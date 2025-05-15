import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// TODO: Move this to env or a Profile table
const ADMIN_USER_ID = '464661fa-7ae1-406f-9975-dec0ccbc94aa';

async function getUserId() {
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
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');
  return session.user.id;
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (userId !== ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use Supabase admin API to list users
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;

    // For each user, count their watchlist items and session count
    const users = await Promise.all(
      data.users.map(async (user) => {
        const itemCount = await prisma.watchItem.count({ where: { userId: user.id } });
        const sessionCount = await prisma.userSession.count({ where: { userId: user.id } });
        return {
          id: user.id,
          email: user.email,
          itemCount,
          lastSignInAt: user.last_sign_in_at,
          createdAt: user.created_at,
          sessionCount,
        };
      })
    );
    return NextResponse.json(users);
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 