import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { watchlistId, email, watchlistName } = await request.json();

    if (!watchlistId || !email || !watchlistName) {
      return NextResponse.json(
        { error: 'Watchlist ID, email, and watchlist name are required' },
        { status: 400 }
      );
    }

    // Verify the user owns this watchlist
    const watchlist = await prisma.watchlist.findFirst({
      where: {
        id: watchlistId,
        ownerId: user.id
      }
    });

    if (!watchlist) {
      return NextResponse.json({ error: 'Watchlist not found' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = await prisma.watchlistMember.findFirst({
      where: {
        watchlistId,
        user: {
          email: email.toLowerCase()
        }
      }
    });

    if (existingMember) {
      console.log('User is already a member:', email);
      return NextResponse.json(
        { error: 'User is already a member of this watchlist' },
        { status: 409 }
      );
    }

    // Check if the invited user exists in our system
    let invitedUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    console.log('Invited user found:', invitedUser ? 'Yes' : 'No');

    if (invitedUser) {
      // User exists, add them to the watchlist
      console.log('Adding existing user to watchlist:', { watchlistId, userId: invitedUser.id });
      const member = await prisma.watchlistMember.create({
        data: {
          watchlistId,
          userId: invitedUser.id
        }
      });
      console.log('Created watchlist member:', member.id);
    } else {
      // For now, just return an error if user doesn't exist
      // We'll handle this better in the future with a proper invitation system
      return NextResponse.json(
        { error: 'User not found. They need to sign up first before being added to a watchlist.' },
        { status: 404 }
      );
    }

    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gowatchme.app';
    const invitationLink = `${baseUrl}/watchlists/${watchlistId}?invited=true`;

    // Send invitation email
    console.log('Sending invitation email to:', email);
    try {
      const emailResult = await resend.emails.send({
        from: 'Watch Me <onboarding@resend.dev>',
        to: [email],
        subject: `You've been invited to collaborate on "${watchlistName}"`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Watch Me</h1>
            </div>
            
            <div style="padding: 40px 20px; background: #f9fafb;">
              <h2 style="color: #1f2937; margin-bottom: 20px;">You've been invited to collaborate!</h2>
              
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                <strong>${user.email?.split('@')[0]}</strong> has invited you to collaborate on their watchlist 
                <strong>"${watchlistName}"</strong> on Watch Me.
              </p>
              
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                You can now add movies and TV shows to this shared list, track your progress, and collaborate with others.
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${invitationLink}" 
                   style="background: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                  View Watchlist
                </a>
              </div>
              
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.6;">
                If you don't have an account yet, you'll be prompted to sign up when you click the link above.
              </p>
            </div>
            
            <div style="background: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This invitation was sent by ${user.email}. If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          </div>
        `
      });
      console.log('Email sent successfully:', emailResult);
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation sent successfully' 
    });

  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
