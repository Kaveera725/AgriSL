const pool = require('../db/db');

// GET /api/notifications — all notifications for the current user, newest first.
async function getNotifications(req, res) {
  try {
    const [notifications] = await pool.query(
      `SELECT id, type, message, is_read, related_id, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    const unread_count = notifications.reduce(
      (count, n) => count + (n.is_read ? 0 : 1),
      0
    );

    return res.json({ notifications, unread_count });
  } catch (err) {
    console.error('getNotifications error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// PATCH /api/notifications/:id/read — mark one notification read (own only).
async function markRead(req, res) {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('markRead error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// PATCH /api/notifications/read-all — mark every notification read for the user.
async function markAllRead(req, res) {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.user.id]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('markAllRead error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getNotifications, markRead, markAllRead };
