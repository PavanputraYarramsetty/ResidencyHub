const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase URL or Service Role Key not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
}

// Service role client — bypasses RLS, used for server-side operations
const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Creates a client scoped to a specific user's JWT — respects RLS
function createUserClient(accessToken) {
  return createClient(supabaseUrl || '', supabaseAnonKey || '', {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  });
}

module.exports = { supabaseAdmin, createUserClient };
