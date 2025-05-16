import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: CookieOptions) {
            // Next.js 15.x cookies().delete might expect a single object argument
            // that includes the name, path, and domain.
            const deleteOpts: { name: string; path?: string; domain?: string } = { name };
            if (options.path) deleteOpts.path = options.path;
            if (options.domain) deleteOpts.domain = options.domain;
            // other options like secure, sameSite might be needed if they were used during set
            // but Next.js delete is often minimal. If options.secure is true, it should be passed.
            // if (options.secure) deleteOpts.secure = options.secure; 
            // if (options.sameSite) deleteOpts.sameSite = options.sameSite as 'lax' | 'strict' | 'none';
            cookieStore.delete(deleteOpts);
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Error exchanging code for session in /auth/callback:", error.message);
      return NextResponse.redirect(`${origin}/auth/auth-code-error?message=${encodeURIComponent(error.message)}&source=callback`);
    }
  } else {
    // Handle case where code is missing, maybe redirect with an error
    console.warn("Code missing in /auth/callback");
    return NextResponse.redirect(`${origin}/auth/auth-code-error?message=Authorization%20code%20missing&source=callback_nocode`);
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}${next}`);
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