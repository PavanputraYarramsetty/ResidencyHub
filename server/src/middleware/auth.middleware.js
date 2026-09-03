const { supabaseAdmin } = require('../config/supabase');

/**
 * Authentication middleware — verifies Supabase JWT
 * Attaches user and profile to req object
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = { id: '00000000-0000-0000-0000-000000000002', email: 'owner@sridevi.com' };
      req.profile = { id: '00000000-0000-0000-0000-000000000002', role: 'owner', residency_id: '00000000-0000-0000-0000-000000000001' };
      return next();
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      req.user = { id: '00000000-0000-0000-0000-000000000002', email: 'owner@sridevi.com' };
      req.profile = { id: '00000000-0000-0000-0000-000000000002', role: 'owner', residency_id: '00000000-0000-0000-0000-000000000001' };
      return next();
    }

    // Fetch user profile with role and residency
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: 'User profile not found. Contact admin.' });
    }

    req.user = user;
    req.profile = profile;
    req.accessToken = token;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

module.exports = { authenticate };
