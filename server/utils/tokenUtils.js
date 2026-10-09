const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generate a short-lived (15 min) JWT access token.
 * Payload includes everything the middleware needs so it never has to hit the DB.
 * @param {object} user - Row from the users table (or equivalent plain object)
 * @returns {string} Signed JWT
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      district: user.district,
      is_approved: user.is_approved,
      type: 'access',
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
};

/**
 * Generate a cryptographically secure random refresh token (128 hex chars).
 * The raw value is sent to the client — only the hash is stored in the DB.
 * @returns {string} 128-character hex string
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Hash a refresh token with SHA-256 before storing or looking it up in the DB.
 * Never store the raw token — only store/compare the hash.
 * @param {string} token - Raw refresh token
 * @returns {string} SHA-256 hex digest
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Verify and decode a JWT access token.
 * Throws TokenExpiredError / JsonWebTokenError on failure.
 * @param {string} token - Raw JWT string
 * @returns {object} Decoded payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

/**
 * Return a Date object 7 days from now — used as the refresh token expiry.
 * @returns {Date}
 */
const getRefreshTokenExpiry = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
};

/**
 * Return the access token expiry duration in seconds matching JWT_ACCESS_EXPIRES.
 * Defaults to 900 seconds (15 minutes).
 * @returns {number}
 */
const getAccessTokenExpiresInSeconds = () => {
  const exp = process.env.JWT_ACCESS_EXPIRES || '15m';
  if (exp.endsWith('m')) return parseInt(exp, 10) * 60;
  if (exp.endsWith('h')) return parseInt(exp, 10) * 3600;
  if (exp.endsWith('s')) return parseInt(exp, 10);
  if (exp.endsWith('d')) return parseInt(exp, 10) * 86400;
  const num = parseInt(exp, 10);
  return Number.isNaN(num) ? 900 : num;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyAccessToken,
  getRefreshTokenExpiry,
  getAccessTokenExpiresInSeconds,
};
