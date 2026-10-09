require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// ── Security headers ────────────────────────────────────────────────────────
// helmet sets sensible HTTP security headers on every response.
// crossOriginResourcePolicy is relaxed to 'cross-origin' so the React client
// can load images served from /uploads.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
// In development allow the Vite dev server; in production restrict to the
// deployed frontend URL set via FRONTEND_URL in the server's environment.
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AgriSL API' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/disease', require('./routes/diseaseRoutes'));
app.use('/api/advisory', require('./routes/advisoryRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

const PORT = process.env.PORT || 5000;
// Only start listening when run directly (node server.js / nodemon).
// When required by the test suite (supertest), skip listening so no port is
// opened and Jest can exit cleanly.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AgriSL server running on http://localhost:${PORT}`);
  });
}

// ---------------------------------------------------------------------------
// Refresh-token housekeeping — delete expired/revoked rows every 24 hours.
// Keeps the refresh_tokens table small and prevents stale rows accumulating.
// ---------------------------------------------------------------------------
const pool = require('./db/db');

const cleanupExpiredTokens = async () => {
  try {
    const [result] = await pool.query(
      `DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = 1`
    );
    if (result.affectedRows > 0) {
      console.log(`Cleaned up ${result.affectedRows} expired/revoked refresh tokens`);
    }
  } catch (error) {
    console.error('Token cleanup error:', error);
  }
};

// Run once on startup, then every 24 hours.
cleanupExpiredTokens();
setInterval(cleanupExpiredTokens, 24 * 60 * 60 * 1000);

module.exports = app;

