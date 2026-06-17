const pool = require('../db/db');

// GET /api/admin/stats  (requireAdmin)
// Platform-wide counts powering the admin dashboard stat cards.
async function getStats(req, res) {
  try {
    const [[{ total_users }]] = await pool.query(
      'SELECT COUNT(*) AS total_users FROM users'
    );
    const [[{ total_farmers }]] = await pool.query(
      "SELECT COUNT(*) AS total_farmers FROM users WHERE role = 'farmer'"
    );
    const [[{ total_officers }]] = await pool.query(
      "SELECT COUNT(*) AS total_officers FROM users WHERE role = 'officer'"
    );
    const [[{ pending_officers }]] = await pool.query(
      "SELECT COUNT(*) AS pending_officers FROM users WHERE role = 'officer' AND is_approved = 0"
    );
    const [[{ total_chat_sessions }]] = await pool.query(
      'SELECT COUNT(*) AS total_chat_sessions FROM chat_sessions'
    );
    const [[{ total_disease_reports }]] = await pool.query(
      'SELECT COUNT(*) AS total_disease_reports FROM disease_reports'
    );
    const [[{ total_articles }]] = await pool.query(
      'SELECT COUNT(*) AS total_articles FROM advisory_articles'
    );
    const [[{ published_articles }]] = await pool.query(
      "SELECT COUNT(*) AS published_articles FROM advisory_articles WHERE status = 'published'"
    );

    return res.json({
      total_users,
      total_farmers,
      total_officers,
      pending_officers,
      total_chat_sessions,
      total_disease_reports,
      total_articles,
      published_articles,
    });
  } catch (err) {
    console.error('getStats error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/admin/users  (requireAdmin)
// Paginated user list with optional role filter and name/email search.
async function getUsers(req, res) {
  const { role, search } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  try {
    const where = [];
    const params = [];

    if (role && ['farmer', 'officer', 'admin'].includes(role)) {
      where.push('role = ?');
      params.push(role);
    }
    if (search && search.trim()) {
      where.push('(name LIKE ? OR email LIKE ?)');
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM users ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    // limit/offset are validated integers, safe to interpolate.
    const [users] = await pool.query(
      `SELECT id, name, email, role, district, is_approved, created_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return res.json({
      users,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error('getUsers error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// PATCH /api/admin/users/:id/approve  (requireAdmin)
// Approve a pending officer and notify them their account is active.
async function approveOfficer(req, res) {
  const userId = req.params.id;

  try {
    const [result] = await pool.query(
      "UPDATE users SET is_approved = 1 WHERE id = ? AND role = 'officer'",
      [userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Officer not found' });
    }

    await pool.query(
      `INSERT INTO notifications (user_id, type, message)
       VALUES (?, 'account_approved', ?)`,
      [
        userId,
        'Your AgriSL agricultural officer account has been approved. You can now log in and publish advisory content.',
      ]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('approveOfficer error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// PATCH /api/admin/users/:id/role  (requireAdmin)
// Switch a user between farmer and officer. Admins cannot be re-roled.
async function changeUserRole(req, res) {
  const userId = req.params.id;
  const { role } = req.body;

  if (!['farmer', 'officer'].includes(role)) {
    return res.status(400).json({ message: "role must be 'farmer' or 'officer'" });
  }

  try {
    const [rows] = await pool.query('SELECT role FROM users WHERE id = ?', [userId]);
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot change an admin role' });
    }

    // Promoting to officer activates them immediately; farmers are always approved.
    const isApproved = 1;
    await pool.query('UPDATE users SET role = ?, is_approved = ? WHERE id = ?', [
      role,
      isApproved,
      userId,
    ]);

    return res.json({ success: true });
  } catch (err) {
    console.error('changeUserRole error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/admin/articles  (requireAdmin)
// All articles in every status, with author name, views and average rating.
async function getAllArticles(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  try {
    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM advisory_articles'
    );
    const total = countRows[0].total;

    const [articles] = await pool.query(
      `SELECT a.id, a.title_en, a.title_si, a.category, a.status, a.views, a.created_at,
              u.name AS officer_name,
              (SELECT ROUND(AVG(r.rating), 1) FROM article_ratings r WHERE r.article_id = a.id) AS average_rating,
              (SELECT COUNT(*) FROM article_ratings r WHERE r.article_id = a.id) AS total_ratings
       FROM advisory_articles a
       JOIN users u ON u.id = a.officer_id
       ORDER BY a.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`
    );

    return res.json({
      articles,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error('getAllArticles error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/admin/reports  (requireAdmin)
// All disease reports with the reporting farmer's name and the stored image path.
async function getAllReports(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  try {
    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM disease_reports'
    );
    const total = countRows[0].total;

    const [reports] = await pool.query(
      `SELECT r.id, r.crop_type, r.district, r.image_path, r.disease_name,
              r.confidence_level, r.symptoms, r.treatment_en, r.treatment_si,
              r.status, r.created_at, u.name AS farmer_name
       FROM disease_reports r
       JOIN users u ON u.id = r.user_id
       ORDER BY r.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`
    );

    const base = `${req.protocol}://${req.get('host')}/uploads/`;
    const withUrls = reports.map((r) => ({
      ...r,
      image_url: r.image_path ? base + r.image_path : null,
    }));

    return res.json({
      reports: withUrls,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error('getAllReports error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// PATCH /api/admin/users/:id/deactivate  (requireAdmin)
// Soft-deactivate a user by demoting to an unapproved farmer. Admins cannot
// deactivate themselves.
async function deleteUser(req, res) {
  const userId = req.params.id;

  // req.user.id is a number; route param is a string — compare loosely.
  if (Number(userId) === Number(req.user.id)) {
    return res.status(400).json({ message: 'You cannot deactivate your own account' });
  }

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'User not found' });
    }

    await pool.query(
      "UPDATE users SET role = 'farmer', is_approved = 0 WHERE id = ?",
      [userId]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('deleteUser error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getStats,
  getUsers,
  approveOfficer,
  changeUserRole,
  getAllArticles,
  getAllReports,
  deleteUser,
};
