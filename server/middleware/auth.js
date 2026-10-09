const { verifyAccessToken } = require('../utils/tokenUtils');

/**
 * requireAuth — verifies the Bearer access token on every protected route.
 * Attaches decoded payload to req.user so downstream middleware/controllers
 * never have to decode the token again.
 */
const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Access token required',
        code: 'NO_TOKEN',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Guard against accidentally passing a refresh token (which is not a JWT
    // and would never reach here, but belt-and-suspenders for future changes).
    if (decoded.type !== 'access') {
      return res.status(401).json({
        message: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE',
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Access token expired',
        code: 'TOKEN_EXPIRED',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid access token',
        code: 'INVALID_TOKEN',
      });
    }
    return res.status(401).json({
      message: 'Authentication failed',
      code: 'AUTH_FAILED',
    });
  }
};

/**
 * requireOfficer — must pass requireAuth first, then checks that the user is
 * an approved officer (or an admin, who outranks officers).
 */
const requireOfficer = (req, res, next) => {
  requireAuth(req, res, () => {
    // Admins may access any officer route.
    if (req.user.role === 'admin') return next();

    if (req.user.role !== 'officer') {
      return res.status(403).json({
        message: 'Officer access required',
        code: 'FORBIDDEN',
      });
    }
    if (req.user.is_approved !== 1) {
      return res.status(403).json({
        message: 'Account pending admin approval',
        code: 'PENDING_APPROVAL',
      });
    }
    next();
  });
};

/**
 * requireAdmin — must pass requireAuth first, then checks role === 'admin'.
 */
const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Admin access required',
        code: 'FORBIDDEN',
      });
    }
    next();
  });
};

module.exports = { requireAuth, requireOfficer, requireAdmin };
