import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Robust fallback: Ensure URL is actually a URL, not just a string like "YOUR_URL"
const isValidUrl = (url: string) => {
    try { return new URL(url).protocol.startsWith('http'); }
    catch { return false; }
};

const supabaseUrl = isValidUrl(envUrl) ? envUrl : 'https://placeholder-project.supabase.co';
const supabaseAnonKey = envKey || 'placeholder-key';

// Create a strongly typed client configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper type for direct usage if needed
export type TypedSupabaseClient = typeof supabase;
