import { createClient } from '@supabase/supabase-js';

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

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;