const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  register, login, getMe, updateProfile, updateProfilePicture,
  logout, refreshAccessToken, logoutAll, getActiveSessions,
} = require('../controllers/authController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { uploadCert, CERT_DIR } = require('../middleware/certUpload');
const { uploadImage } = require('../middleware/upload');

// ── Rate limiters ─────────────────────────────────────────────────────────────

// Limit login / register attempts: 5 per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    message: 'Too many login attempts. Please wait 15 minutes before trying again.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,  // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,   // Disable the `X-RateLimit-*` headers
});

// Limit token refresh attempts: 30 per 15 minutes per IP
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: {
    message: 'Too many token refresh requests.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Auth routes ───────────────────────────────────────────────────────────────

// Registration accepts an optional multipart certification document. Farmers
// send no file (req.file is undefined); officers must include one — the
// controller enforces that based on the role.
router.post('/register', loginLimiter, uploadCert, register);
router.post('/login', loginLimiter, login);
router.get('/me', requireAuth, getMe);
router.put('/profile', requireAuth, updateProfile);
router.post('/profile-picture', requireAuth, uploadImage, updateProfilePicture);

// Revoke a single refresh token on logout (access token required to bind to user).
router.post('/logout', requireAuth, logout);

// Issue a new access token + rotated refresh token — no access token needed.
router.post('/refresh', refreshLimiter, refreshAccessToken);

// Revoke ALL refresh tokens for the authenticated user (logout from all devices).
router.post('/logout-all', requireAuth, logoutAll);

// List active sessions (non-revoked, non-expired refresh tokens) for the user.
router.get('/sessions', requireAuth, getActiveSessions);

// Serve an officer's certification document — admins only (never public).
router.get('/cert/:filename', requireAdmin, (req, res) => {
  // path.basename strips any directory components, blocking path traversal.
  const safeName = path.basename(req.params.filename);
  return res.sendFile(path.resolve(CERT_DIR, safeName), (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ message: 'Document not found' });
    }
  });
});

module.exports = router;
