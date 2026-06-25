const pool = require('../db/db');

// Chat sessions older than this many days are "archived": hidden from the
// dashboard's default Chat History view to keep it uncluttered, but never
// deleted — the farmer can still load them via GET /api/chat/history. Disease
// reports are deliberately exempt and kept for the lifetime of the account.
const CHAT_ARCHIVE_DAYS = 30;

// GET /api/dashboard/farmer — single payload powering the farmer dashboard:
// recent chat sessions, disease reports, bookmarks, profile, and unread count.
async function getFarmerDashboard(req, res) {
  const userId = req.user.id;

  try {
    // Only chat sessions from the last CHAT_ARCHIVE_DAYS days. Older ones stay
    // in the database and remain reachable through /api/chat/history.
    const [chat_sessions] = await pool.query(
      `SELECT id, crop_type, district, language, status, created_at,
              (SELECT COUNT(*) FROM chat_messages WHERE session_id = chat_sessions.id) AS message_count
       FROM chat_sessions
       WHERE user_id = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId, CHAT_ARCHIVE_DAYS]
    );

    // How many older sessions are tucked away, so the UI can offer to load them.
    const [[{ count: archived_chat_count }]] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM chat_sessions
       WHERE user_id = ?
         AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [userId, CHAT_ARCHIVE_DAYS]
    );

    const [disease_reports] = await pool.query(
      `SELECT id, crop_type, district, disease_name, confidence_level, image_path, status, created_at
       FROM disease_reports
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    const [bookmarks] = await pool.query(
      `SELECT a.id, a.title_en, a.title_si, a.category, a.status,
              u.name AS officer_name, b.created_at AS bookmarked_at
       FROM bookmarks b
       JOIN advisory_articles a ON b.article_id = a.id
       JOIN users u ON a.officer_id = u.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [userId]
    );

    const [profileRows] = await pool.query(
      'SELECT id, name, email, district, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    const [[{ count: unread_notifications }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    return res.json({
      chat_sessions,
      archived_chat_count,
      chat_archive_days: CHAT_ARCHIVE_DAYS,
      disease_reports,
      bookmarks,
      profile: profileRows[0] || null,
      unread_notifications,
    });
  } catch (err) {
    console.error('getFarmerDashboard error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getFarmerDashboard };
