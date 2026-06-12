const pool = require('../db/db');

// GET /api/users/officers
async function getOfficers(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, district FROM users WHERE role = 'officer' AND is_approved = 1 ORDER BY name ASC"
    );
    return res.json({ officers: rows });
  } catch (err) {
    console.error('getOfficers error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getOfficers };
