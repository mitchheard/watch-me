import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';

  // Explicitly log received search params
  console.log(`[AuthCallback] Received request. Origin: ${origin}, Code: ${code}, Next: ${next}, All Params: ${searchParams.toString()}`);

  // Check for errors passed directly in the URL from Supabase's first redirect
  const initialError = searchParams.get('error');
  const initialErrorDescription = searchParams.get('error_description');

  if (initialError) {
    console.error(`[AuthCallback] Initial error from Supabase redirect: Code: ${initialError}, Desc: ${initialErrorDescription}`);
    return NextResponse.redirect(`${origin}/auth/auth-supabase-initial-error?message=${encodeURIComponent(initialErrorDescription || initialError)}`);
  }

  if (code) {
    const cookieStore = cookies() as ReturnType<typeof cookies>; // Type assertion using ReturnType
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            // @ts-expect-error TypeScript compiler seems to incorrectly infer Promise here
            const value = cookieStore.get(name)?.value;
            console.log(`[AuthCallback] Cookie GET: ${name} = ${value ? 'found' : 'not found'}`);
            return value;
          },
          set(name: string, value: string, options: CookieOptions) {
            console.log(`[AuthCallback] Cookie SET: ${name}`);
            // @ts-expect-error TypeScript compiler seems to incorrectly infer Promise here
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: CookieOptions) {
            console.log(`[AuthCallback] Cookie REMOVE: ${name}`);
            // Construct deleteOpts specifically for Next.js cookies().delete
            const deleteOpts: { name: string; path?: string; domain?: string } = { name };
            if (options.path) deleteOpts.path = options.path;
            if (options.domain) deleteOpts.domain = options.domain;
            // Note: Next.js delete typically doesn't need other options like secure, sameSite from the original set options
            
            // @ts-expect-error TypeScript compiler seems to incorrectly infer Promise here
            cookieStore.delete(deleteOpts);
          },
        },
      }
    );

    console.log(`[AuthCallback] Attempting to exchange code: ${code}`);
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error(`[AuthCallback] Error exchanging code '${code}' for session:`, exchangeError.message, exchangeError);
      return NextResponse.redirect(`${origin}/auth/auth-exchange-error?message=${encodeURIComponent(exchangeError.message)}&source=exchangeCodeForSession`);
    }

    console.log('[AuthCallback] Successfully exchanged code for session. Session data:', sessionData);
    console.log(`[AuthCallback] Redirecting to: ${origin}${next}`);
    return NextResponse.redirect(`${origin}${next}`);

  } else {
    console.warn("[AuthCallback] Code missing in request parameters and no initial Supabase error detected.");
    return NextResponse.redirect(`${origin}/auth/auth-code-error?message=Authorization%20code%20missing&source=callback_nocode_final`);
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