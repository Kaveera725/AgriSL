const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/db');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_EXPIRY = '7d';

// Shape the public user object returned to clients (never expose password_hash).
function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    district: u.district,
    is_approved: u.is_approved,
  };
}

async function register(req, res) {
  const { name, email, password, district } = req.body;
  let { role } = req.body;
  // Officer-only certification fields (sent as multipart form fields).
  const { gov_service_id, designation, province } = req.body;

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
    if (!gov_service_id || !gov_service_id.trim()) errors.push('Government service ID is required');
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
  const govServiceId = role === 'officer' ? gov_service_id.trim() : null;
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
          gov_service_id, designation, province, cert_document_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        email,
        passwordHash,
        role,
        district.trim(),
        isApproved,
        govServiceId,
        officerDesignation,
        officerProvince,
        certPath,
      ]
    );

    // Notify every admin that a new officer is awaiting verification.
    if (role === 'officer') {
      const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin'");
      if (admins.length) {
        const message = `New agricultural officer registration pending approval: ${name.trim()} (${officerDesignation}) from ${officerProvince} province. Government Service ID: ${govServiceId}`;
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
    };

    return res.status(201).json({
      message:
        role === 'officer'
          ? 'Registration successful. Your officer account is pending admin approval.'
          : 'Registration successful',
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

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        district: user.district,
        is_approved: user.is_approved,
      },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    return res.json({ token, user: publicUser(user) });
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

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        district: user.district,
        is_approved: user.is_approved,
      },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    return res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('updateProfile error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { register, login, getMe, updateProfile };
