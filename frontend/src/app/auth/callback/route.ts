import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyNewUser } from '@/lib/adminNotifications';

export async function GET(request: NextRequest) {
  // Use NEXTAUTH_URL (or your specific env var for site URL) as the reliable application origin
  const appOrigin = process.env.NEXTAUTH_URL;

  if (!appOrigin) {
    console.error("[AuthCallback] CRITICAL: Application origin is not configured. Set NEXTAUTH_URL environment variable.");
    // Fallback or error handling if NEXTAUTH_URL is not set
    // For safety, you might redirect to a generic error page or use a less reliable fallback like request.headers.get('host')
    // However, for critical auth redirects, having a definite URL is best.
    // This example will throw an error to make it obvious if not configured.
    return NextResponse.json({ error: "Internal server configuration error: App origin not set." }, { status: 500 });
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
    
    // Create a UserSession record
    if (sessionData.session?.user) {
      try {
        await prisma.userSession.create({
          data: {
            userId: sessionData.session.user.id,
          },
        });
        console.log(`[AuthCallback] UserSession record created for user: ${sessionData.session.user.id}`);
        
        // Check if this is a new user and send admin notification
        const existingUser = await prisma.user.findUnique({
          where: { id: sessionData.session.user.id },
        });
        
        if (!existingUser) {
          // This is a new user, send admin notification
          try {
            await notifyNewUser(
              sessionData.session.user.id,
              sessionData.session.user.email || 'Unknown email'
            );
            console.log(`[AuthCallback] Admin notification sent for new user: ${sessionData.session.user.id}`);
          } catch (notificationError) {
            console.error(`[AuthCallback] Failed to send new user notification:`, notificationError);
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