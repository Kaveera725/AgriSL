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

  if (errors.length) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  // Officers require admin approval; farmers are approved immediately.
  const isApproved = role === 'officer' ? 0 : 1;

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing[0].length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, district, is_approved)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name.trim(), email, passwordHash, role, district.trim(), isApproved]
    );

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

    if (user.role === 'officer' && user.is_approved === 0) {
      return res.status(403).json({ message: 'Account pending admin approval' });
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

module.exports = { register, login, getMe };
