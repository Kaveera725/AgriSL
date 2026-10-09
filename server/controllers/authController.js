const bcrypt = require('bcryptjs');
const pool = require('../db/db');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
} = require('../utils/tokenUtils');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Shape the public user object returned to clients (never expose password_hash).
function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    district: u.district,
    is_approved: u.is_approved,
    profile_picture: u.profile_picture,
  };
}

async function register(req, res) {
  const { name, email, password, district } = req.body;
  let { role } = req.body;
  // Officer-only certification fields (sent as multipart form fields).
  const { designation, province } = req.body;

  // Validation
  const errors = [];
  if (!name || !name.trim()) errors.push('Name is required');
  if (!email || !EMAIL_RE.test(email)) errors.push('A valid email is required');
  if (!password || password.length < 8) errors.push('Password must be at least 8 characters');
  if (!district || !district.trim()) errors.push('District is required');

  // Only farmer/officer may self-register; default to farmer.
  if (role === undefined || role === null || role === '') role = 'farmer';
  if (role !== 'farmer' && role !== 'officer') {
    errors.push("Role must be 'farmer' or 'officer'");
  }

  // Officers must supply certification details and an uploaded document.
  if (role === 'officer') {
    if (!designation || !designation.trim()) errors.push('Designation is required');
    if (!province || !province.trim()) errors.push('Province is required');
    if (!req.file) errors.push('Certification document is required for officer registration');
  }

  if (errors.length) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  // Officers require admin approval; farmers are approved immediately.
  const isApproved = role === 'officer' ? 0 : 1;
  const certPath = role === 'officer' && req.file ? req.file.filename : null;
  const officerDesignation = role === 'officer' ? designation.trim() : null;
  const officerProvince = role === 'officer' ? province.trim() : null;

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing[0].length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users
         (name, email, password_hash, role, district, is_approved,
          designation, province, cert_document_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        email,
        passwordHash,
        role,
        district.trim(),
        isApproved,
        officerDesignation,
        officerProvince,
        certPath,
      ]
    );

    // Notify every admin that a new officer is awaiting verification.
    if (role === 'officer') {
      const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin'");
      if (admins.length) {
        const message = `New agricultural officer registration pending approval: ${name.trim()} (${officerDesignation}) from ${officerProvince} province.`;
        const values = admins.map((a) => [a.id, 'new_officer_pending', message, result.insertId]);
        await pool.query(
          'INSERT INTO notifications (user_id, type, message, related_id) VALUES ?',
          [values]
        );
      }
    }

    const user = {
      id: result.insertId,
      name: name.trim(),
      email,
      role,
      district: district.trim(),
      is_approved: isApproved,
      profile_picture: null,
    };

    // Auto-login: generate access + refresh tokens so the client is immediately
    // authenticated after registration (officer tokens still work, but officer
    // routes will block until is_approved = 1).
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);
    const expiresAt = getRefreshTokenExpiry();
    const deviceInfo = req.headers['user-agent']
      ? req.headers['user-agent'].substring(0, 255)
      : 'Unknown';

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info)
       VALUES (?, ?, ?, ?)`,
      [user.id, tokenHash, expiresAt, deviceInfo]
    );

    return res.status(201).json({
      message:
        role === 'officer'
          ? 'Registration successful. Your officer account is pending admin approval.'
          : 'Registration successful',
      accessToken,
      refreshToken,
      expiresIn: 2700,
      user: publicUser(user),
    });
  } catch (err) {
    console.error('register error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Deactivated accounts cannot log in, regardless of role.
    if (user.is_active === 0) {
      return res.status(403).json({
        message: `Your account has been deactivated. Reason: ${
          user.deactivation_reason || 'Please contact the administrator for details.'
        }`,
      });
    }

    if (user.role === 'officer' && user.is_approved === 2) {
      return res.status(403).json({
        message: `Your officer registration was rejected. Reason: ${
          user.rejection_reason || 'Please contact the administrator for details.'
        }`,
      });
    }
    if (user.role === 'officer' && user.is_approved === 0) {
      return res.status(403).json({ message: 'Your account is pending admin approval.' });
    }

    // Generate access + refresh tokens.
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);
    const expiresAt = getRefreshTokenExpiry();

    // Capture device info for security tracking.
    const deviceInfo = req.headers['user-agent']
      ? req.headers['user-agent'].substring(0, 255)
      : 'Unknown';

    // Persist hashed refresh token — never store the raw token.
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info)
       VALUES (?, ?, ?, ?)`,
      [user.id, tokenHash, expiresAt, deviceInfo]
    );

    return res.json({
      accessToken,
      refreshToken,
      expiresIn: 2700, // 45 minutes in seconds
      user: publicUser(user),
    });
  } catch (err) {
    console.error('login error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Returns the authenticated user's data straight from the verified token.
function getMe(req, res) {
  return res.json({ user: req.user });
}

// PUT /api/auth/profile — update the current user's name and district.
// Returns a fresh token so the client's decoded session reflects the change.
async function updateProfile(req, res) {
  const { name, district } = req.body;

  const errors = [];
  if (!name || !name.trim()) errors.push('Name is required');
  if (!district || !district.trim()) errors.push('District is required');
  if (errors.length) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  try {
    await pool.query('UPDATE users SET name = ?, district = ? WHERE id = ?', [
      name.trim(),
      district.trim(),
      req.user.id,
    ]);

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return a fresh access token reflecting the updated name/district.
    const token = generateAccessToken(user);

    return res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('updateProfile error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function updateProfilePicture(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'No image provided' });
  }

  try {
    const filename = req.file.filename;
    await pool.query('UPDATE users SET profile_picture = ? WHERE id = ?', [
      filename,
      req.user.id,
    ]);

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return a fresh access token reflecting the updated profile picture.
    const token = generateAccessToken(user);

    return res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('updateProfilePicture error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * POST /api/auth/logout
 * Revokes the supplied refresh token so it can no longer be used to obtain
 * new access tokens. The client should also discard its local tokens.
 */
async function logout(req, res) {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await pool.query(
        `UPDATE refresh_tokens
         SET revoked = 1, revoked_at = NOW()
         WHERE token_hash = ? AND user_id = ?`,
        [tokenHash, req.user.id]
      );
    }

    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('logout error:', error);
    return res.status(500).json({ message: 'Logout failed' });
  }
}

/**
 * POST /api/auth/refresh
 * Validates the refresh token and issues a new access token.
 * No auth middleware — the refresh token IS the credential here.
 */
async function refreshAccessToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        message: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN',
      });
    }

    const tokenHash = hashToken(refreshToken);

    // Join with users so we can build the new access token payload without a
    // second query.
    const [tokens] = await pool.query(
      `SELECT rt.*, u.id AS uid, u.name, u.email, u.role,
              u.district, u.is_approved
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token_hash = ?`,
      [tokenHash]
    );

    if (tokens.length === 0) {
      return res.status(401).json({
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    const tokenRecord = tokens[0];

    if (tokenRecord.revoked) {
      return res.status(401).json({
        message: 'Refresh token has been revoked',
        code: 'TOKEN_REVOKED',
      });
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(401).json({
        message: 'Refresh token expired, please login again',
        code: 'REFRESH_TOKEN_EXPIRED',
      });
    }

    const newAccessToken = generateAccessToken({
      id: tokenRecord.uid,
      email: tokenRecord.email,
      role: tokenRecord.role,
      name: tokenRecord.name,
      district: tokenRecord.district,
      is_approved: tokenRecord.is_approved,
    });

    return res.json({
      accessToken: newAccessToken,
      expiresIn: 2700,
    });
  } catch (error) {
    console.error('refreshAccessToken error:', error);
    return res.status(500).json({ message: 'Token refresh failed' });
  }
}

module.exports = { register, login, getMe, updateProfile, updateProfilePicture, logout, refreshAccessToken };
