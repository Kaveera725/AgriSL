const pool = require('../db/db');

// GET /api/users/officers
// Returns approved officers in the same district as the requesting farmer.
// Officers from any district are returned as fallback if the farmer has no district set.
async function getOfficers(req, res) {
  try {
    const farmerDistrict = req.user?.district;
    let rows;
    if (farmerDistrict) {
      [rows] = await pool.query(
        "SELECT id, name, district FROM users WHERE role = 'officer' AND is_approved = 1 AND district = ? ORDER BY name ASC",
        [farmerDistrict]
      );
    } else {
      [rows] = await pool.query(
        "SELECT id, name, district FROM users WHERE role = 'officer' AND is_approved = 1 ORDER BY name ASC"
      );
    }
    return res.json({ officers: rows });
  } catch (err) {
    console.error('getOfficers error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getOfficers };
