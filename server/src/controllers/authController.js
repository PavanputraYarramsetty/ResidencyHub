const { profiles } = require('../services/datastore');

async function getProfile(req, res) {
  res.json({
    user: req.user,
    profile: req.profile,
  });
}

async function login(req, res) {
  const { email } = req.body;
  const cleanEmail = (email || '').toLowerCase().trim();
  const isDemoAdmin = cleanEmail.includes('admin');
  const role = isDemoAdmin ? 'admin' : 'owner';

  const profile = profiles.find((p) => p.role === role) || profiles[0];

  res.json({
    token: `demo-token-${role}`,
    user: { id: profile.id, email: profile.email },
    profile,
  });
}

module.exports = {
  getProfile,
  login,
};
