import { createClient } from '@supabase/supabase-js';

// Get environment variables from .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL: Missing Supabase environment variables. Check your Vercel Project Settings.');
}

// Create the Supabase client (will be null/broken if env vars missing, but won't crash entire app bundle)
export const supabase = createClient(supabaseUrl || '', supabaseKey || '');