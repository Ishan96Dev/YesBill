import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Singleton browser client — stores session in cookies so Next.js middleware
// can read auth state server-side without infinite redirect loops.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export type { User, Session } from '@supabase/supabase-js'
