// Shared test setup helpers for the AgriSL server test suite.
//
// These integration tests run against the real MySQL database configured in
// server/.env (the same one `npm run migrate` seeds). Each test file resets the
// test data before its tests run and closes the DB pool afterwards.
//
// Tests are executed with `jest --runInBand` so the files share the database
// serially and never clobber each other's rows.

require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../db/db');

// Users created by `npm run migrate`. We preserve these so a developer can still
// log in normally after running the tests; everything else is wiped between runs.
const SEEDED_EMAILS = ['admin@agrisl.lk', 'farmer@agrisl.lk', 'officer@agrisl.lk'];

// Content tables are fully truncated (TRUNCATE also resets their AUTO_INCREMENT).
const CONTENT_TABLES = [
  'chat_messages',
  'chat_sessions',
  'disease_reports',
  'article_ratings',
  'bookmarks',
  'notifications',
  'advisory_articles',
];

// Wipe all test data: clear every content table and remove any user that the
// tests created, keeping only the seeded users.
async function resetDatabase() {
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    for (const table of CONTENT_TABLES) {
      await pool.query(`TRUNCATE TABLE ${table}`);
    }
    const placeholders = SEEDED_EMAILS.map(() => '?').join(', ');
    await pool.query(
      `DELETE FROM users WHERE email NOT IN (${placeholders})`,
      SEEDED_EMAILS
    );
  } finally {
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  }
}

// Close the connection pool so Jest can exit cleanly.
async function closePool() {
  await pool.end();
}

// Registers the before/after hooks every test file needs: reset the DB before
// the file's tests run, close the pool when they finish.
function setupTestDatabase() {
  beforeAll(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await closePool();
  });
}

// Sign a JWT with the same claims and secret the auth controller uses, so the
// token passes `requireAuth`/`requireOfficer`/`requireAdmin` unchanged.
function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      district: user.district,
      is_approved: user.is_approved,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// Insert a user directly and return it together with a ready-to-use bearer
// token. Lets a test set up actors (farmer/officer/admin, approved or not)
// deterministically without going through the register/login endpoints.
async function makeUser(overrides = {}) {
  const user = {
    name: 'Test User',
    email: `u_${Date.now()}_${Math.floor(Math.random() * 1e6)}@test.lk`,
    password: 'password123',
    role: 'farmer',
    district: 'Kandy',
    is_approved: 1,
    ...overrides,
  };

  const hash = await bcrypt.hash(user.password, 10);
  const [result] = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, district, is_approved)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [user.name, user.email, hash, user.role, user.district, user.is_approved]
  );

  user.id = result.insertId;
  user.token = signToken(user);
  return user;
}

module.exports = {
  pool,
  resetDatabase,
  closePool,
  setupTestDatabase,
  signToken,
  makeUser,
  SEEDED_EMAILS,
};
