/**
 * Authentication middleware — standalone local demo authentication
 * Attaches user and profile to req object without external database calls.
 */
const { profiles, DEFAULT_RESIDENCY_ID } = require('../services/datastore');

async function authenticate(req, res, next) {
  try {
    const isDemoAdmin = req.headers['x-demo-role'] === 'admin';
    const role = isDemoAdmin ? 'admin' : 'owner';

    const matchedProfile = profiles.find((p) => p.role === role) || {
      id: isDemoAdmin ? '00000000-0000-0000-0000-000000000003' : '00000000-0000-0000-0000-000000000002',
      email: `${role}@sridevi.com`,
      full_name: isDemoAdmin ? 'System Admin' : 'Front Desk Owner',
      role,
      residency_id: DEFAULT_RESIDENCY_ID,
    };

    req.user = { id: matchedProfile.id, email: matchedProfile.email };
    req.profile = matchedProfile;
    req.accessToken = 'mock-jwt-token';
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

module.exports = { authenticate };
