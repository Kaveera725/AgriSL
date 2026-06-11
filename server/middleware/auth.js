const jwt = require('jsonwebtoken');

// Verify the JWT from the Authorization header and attach the user to req.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
      district: payload.district,
      is_approved: payload.is_approved,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Require an approved officer (admins also pass, since they outrank officers).
function requireOfficer(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role === 'admin') return next();
    if (req.user.role === 'officer' && req.user.is_approved === 1) return next();
    return res.status(403).json({ message: 'Approved officer access required' });
  });
}

// Require an admin.
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role === 'admin') return next();
    return res.status(403).json({ message: 'Admin access required' });
  });
}

module.exports = { requireAuth, requireOfficer, requireAdmin };
