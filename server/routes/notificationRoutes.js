const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getNotifications,
  markRead,
  markAllRead,
} = require('../controllers/notificationController');

// All notification routes require an authenticated user.
router.get('/', requireAuth, getNotifications);
// Static path must precede the dynamic /:id/read route.
router.patch('/read-all', requireAuth, markAllRead);
router.patch('/:id/read', requireAuth, markRead);

module.exports = router;
