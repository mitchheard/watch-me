import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// TODO: Move this to env or a Profile table
const ADMIN_USER_ID = '464661fa-7ae1-406f-9975-dec0ccbc94aa';

async function getUserId() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // @ts-expect-error TypeScript compiler may incorrectly infer Promise here
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('[Admin API] Error getting session in getUserId:', sessionError.message);
    throw new Error('Session fetch error');
  }
  if (!session?.user) {
    console.warn('[Admin API] No session or user in getUserId');
    throw new Error('Not authenticated');
  }
  return session.user.id;
}

export async function GET() {
  try {
    console.log('[Admin API] Verifying admin user...');
    const userId = await getUserId();
    if (userId !== ADMIN_USER_ID) {
      console.warn(`[Admin API] Forbidden access attempt by user: ${userId}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.log('[Admin API] Admin user verified. Fetching users...');

    // Use Supabase admin API to list users
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    console.log('[Admin API] Attempting to list users with Supabase admin client.');
    const { data: usersData, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listUsersError) {
      console.error('[Admin API] Error listing users with Supabase admin client:', listUsersError.message);
      throw listUsersError;
    }
    console.log(`[Admin API] Successfully listed ${usersData.users.length} users.`);

    // For each user, count their watchlist items and session count
    console.log('[Admin API] Fetching item and session counts for users...');
    const usersWithCounts = await Promise.all(
      usersData.users.map(async (user) => {
        const itemCount = await prisma.watchItem.count({ where: { userId: user.id } });
        let sessionCount = 0;
        try {
          if (prisma.userSession) { 
            sessionCount = await prisma.userSession.count({ where: { userId: user.id } });
          }
        } catch (_e: unknown) {
          // console.warn(`[Admin API] Could not count sessions for user ${user.id} (UserSession model might be missing): ${(_e instanceof Error) ? _e.message : String(_e)}`);
        }
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
    console.log('[Admin API] Successfully fetched counts. Returning user data.');
    return NextResponse.json(usersWithCounts);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Admin API] Overall error in GET handler:', errorMessage, error);
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
} 