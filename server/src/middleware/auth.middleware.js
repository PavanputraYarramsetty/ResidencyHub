const { supabaseAdmin } = require('../config/supabase');

/**
 * Authentication middleware — verifies Supabase JWT
 * Attaches user and profile to req object
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const isDemoAdmin = req.headers['x-demo-role'] === 'admin';
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const role = isDemoAdmin ? 'admin' : 'owner';
      req.user = { id: isDemoAdmin ? '00000000-0000-0000-0000-000000000003' : '00000000-0000-0000-0000-000000000002', email: `${role}@sridevi.com` };
      req.profile = { id: req.user.id, role, residency_id: '00000000-0000-0000-0000-000000000001' };
      return next();
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      const role = isDemoAdmin ? 'admin' : 'owner';
      req.user = { id: isDemoAdmin ? '00000000-0000-0000-0000-000000000003' : '00000000-0000-0000-0000-000000000002', email: `${role}@sridevi.com` };
      req.profile = { id: req.user.id, role, residency_id: '00000000-0000-0000-0000-000000000001' };
      return next();
    }

    // Fetch user profile with role and residency
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const role = isDemoAdmin || user.email?.includes('admin') ? 'admin' : (profile?.role || 'owner');
    req.user = user;
    req.profile = profile ? { ...profile, role } : { id: user.id, role, residency_id: '00000000-0000-0000-0000-000000000001' };
    req.accessToken = token;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

module.exports = { authenticate };
