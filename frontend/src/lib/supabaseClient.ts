import { createBrowserClient } from '@supabase/ssr';

// Log these at the very top of the module to see what they are when this module is parsed.
if (typeof window === 'undefined') { // Only log during build/server-side processing
  console.log('[SupabaseClient] Build-time check: NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('[SupabaseClient] Build-time check: NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey); 