import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyNewUser, notifyRepeatVisit, notifyUserReturned } from '@/lib/adminNotifications';
import { getAppOrigin } from '@/lib/getAppOrigin';

export async function GET(request: NextRequest) {
  // Prefer public Host / x-forwarded-* / NEXTAUTH_URL. request.nextUrl.origin alone can be
  // https://localhost:10000 on Render even when the browser used gowatchme.app.
  let appOrigin: string;
  try {
    appOrigin = getAppOrigin(request);
  } catch (error) {
    console.error('[AuthCallback] CRITICAL: Could not determine app origin.', error);
    return NextResponse.json(
      { error: 'Internal server configuration error: App origin not set.' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url); // Still use request.url for searchParams
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // Log using the determined appOrigin
  console.log(`[AuthCallback] Received request. AppOrigin: ${appOrigin}, Code: ${code}, Next: ${next}, All Params: ${searchParams.toString()}`);

  const initialError = searchParams.get('error');
  const initialErrorDescription = searchParams.get('error_description');

  if (initialError) {
    console.error(`[AuthCallback] Initial error from Supabase redirect: Code: ${initialError}, Desc: ${initialErrorDescription}`);
    return NextResponse.redirect(`${appOrigin}/auth/auth-supabase-initial-error?message=${encodeURIComponent(initialErrorDescription || initialError)}`);
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const value = cookieStore.get(name)?.value;
            console.log(`[AuthCallback] Cookie GET: ${name} = ${value ? 'found' : 'not found'}`);
            return value;
          },
          set(name: string, value: string, options: CookieOptions) {
            console.log(`[AuthCallback] Cookie SET: ${name}`);
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: CookieOptions) {
            console.log(`[AuthCallback] Cookie REMOVE: ${name}`);
            const deleteOpts: { name: string; path?: string; domain?: string } = { name };
            if (options.path) deleteOpts.path = options.path;
            if (options.domain) deleteOpts.domain = options.domain;
            cookieStore.delete(deleteOpts);
          },
        },
      }
    );

    console.log(`[AuthCallback] Attempting to exchange code: ${code}`);
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error(`[AuthCallback] Error exchanging code '${code}' for session:`, exchangeError.message, exchangeError);
      return NextResponse.redirect(`${appOrigin}/auth/auth-exchange-error?message=${encodeURIComponent(exchangeError.message)}&source=exchangeCodeForSession`);
    }

    console.log('[AuthCallback] Successfully exchanged code for session. Session data:', sessionData);
    
    // Create a UserSession record and handle notifications
    if (sessionData.session?.user) {
      try {
        const userId = sessionData.session.user.id;
        const userEmail = sessionData.session.user.email || 'Unknown email';
        const currentTime = new Date();
        
        // Create new session record
        await prisma.userSession.create({
          data: {
            userId,
          },
        });
        console.log(`[AuthCallback] UserSession record created for user: ${userId}`);
        
        // Check if this is a new user and send admin notification
        const existingUser = await prisma.user.findUnique({
          where: { id: userId },
        });
        
        if (!existingUser) {
          // This is a new user, send admin notification
          try {
            await notifyNewUser(userId, userEmail);
            console.log(`[AuthCallback] Admin notification sent for new user: ${userId}`);
          } catch (notificationError) {
            console.error(`[AuthCallback] Failed to send new user notification:`, notificationError);
            // Non-critical, so we just log and continue
          }
        } else {
          // Existing user - check for repeat visits and inactivity returns
          try {
            // Get user's session history
            const userSessions = await prisma.userSession.findMany({
              where: { userId },
              orderBy: { createdAt: 'desc' },
              take: 10, // Get last 10 sessions for analysis
            });

            if (userSessions.length > 1) {
              const lastSession = userSessions[1]; // Second most recent (first is the one we just created)
              const daysSinceLastVisit = Math.floor(
                (currentTime.getTime() - lastSession.createdAt.getTime()) / (1000 * 60 * 60 * 24)
              );

              // Check for user returning after inactivity (7+ days)
              if (daysSinceLastVisit >= 7) {
                await notifyUserReturned(
                  userId,
                  userEmail,
                  daysSinceLastVisit,
                  lastSession.createdAt,
                  currentTime
                );
                console.log(`[AuthCallback] User returned after ${daysSinceLastVisit} days of inactivity: ${userId}`);
              }

              // Check for repeat visits this week (3+ visits in last 7 days)
              const weekAgo = new Date(currentTime.getTime() - (7 * 24 * 60 * 60 * 1000));
              const visitsThisWeek = userSessions.filter(
                session => session.createdAt >= weekAgo
              ).length;

              if (visitsThisWeek >= 3) {
                const firstVisitThisWeek = userSessions[visitsThisWeek - 1];
                await notifyRepeatVisit(
                  userId,
                  userEmail,
                  visitsThisWeek,
                  firstVisitThisWeek.createdAt,
                  currentTime
                );
                console.log(`[AuthCallback] User has ${visitsThisWeek} visits this week: ${userId}`);
              }
            }
          } catch (notificationError) {
            console.error(`[AuthCallback] Failed to send activity notifications:`, notificationError);
            // Non-critical, so we just log and continue
          }
        }
      } catch (dbError: unknown) { // Explicitly type dbError
        const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
        console.error(`[AuthCallback] Failed to create UserSession record for user ${sessionData.session.user.id}:`, errorMessage, dbError);
        // Non-critical, so we just log and continue
      }
    }
    
    const finalRedirectUrl = `${appOrigin}${next}`;
    console.log(`[AuthCallback] Preparing final redirect. AppOrigin: '${appOrigin}', next: '${next}', Final URL: '${finalRedirectUrl}'`);
    
    return NextResponse.redirect(finalRedirectUrl);

  } else {
    console.warn("[AuthCallback] Code missing in request parameters and no initial Supabase error detected.");
    return NextResponse.redirect(`${appOrigin}/auth/auth-code-error?message=Authorization%20code%20missing&source=callback_nocode_final`);
  }
}

// Remove or comment out unused variables 'getUserId' and 'supabase' if present
// async function getUserId() {
//   const cookieStore = await cookies();
//   // Only implement 'get' for SSR session reading
//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         get(name: string) {
//           return cookieStore.get(name)?.value;
//         },
//       },
//     }
//   );
//   // ...rest of function...
// } 