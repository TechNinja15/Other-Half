
// This is a setup file for Supabase. 
// To use a real database:
// 1. Create a project at supabase.com
// 2. Get your URL and ANON KEY
// 3. Set them in your .env file as VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

import { createClient } from '@supabase/supabase-js';

// Safely access environment variables to prevent runtime errors
const getEnv = () => {
  try {
    return (import.meta as any)?.env || {};
  } catch (e) {
    return {};
  }
};

const env = getEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

// We export a client if keys exist, otherwise we handle it gracefully in the auth service
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
