import { createClient } from '@supabase/supabase-js';

// Get environment variables from .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create the Supabase client
// We initialize with empty strings if variables are missing to prevent a hard crash
// but we add a warning that helps debug the deployment.
if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL: Missing Supabase environment variables. Check your Vercel Project Settings.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseKey || 'placeholder-key'
);