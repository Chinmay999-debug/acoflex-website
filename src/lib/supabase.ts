import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Public environment variables for Supabase frontend integration.
 * NEVER use or expose service-role keys or database credentials in client code.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "https://your-project-ref.supabase.co" &&
  !supabaseUrl.includes("your-project-ref"),
);

/**
 * Singleton Supabase client instance.
 * Returns null if Supabase environment variables are missing or unconfigured placeholder values.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
