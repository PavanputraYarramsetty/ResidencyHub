import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://shfrpesksuabwvkxfzfy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZnJwZXNrc3VhYnd2a3hmemZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0Mzk0MjMsImV4cCI6MjEwNDAxNTQyM30.mFF1PUSh0sK3X_jYnEu-aVE4JwdUIIf_0w_pNVlYz_w';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your-project')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
