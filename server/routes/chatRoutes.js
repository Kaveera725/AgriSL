const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  startSession,
  sendMessage,
  completeSession,
  getHistory,
  getSession,
} = require('../controllers/chatController');

// All chat routes require an authenticated user.
router.post('/start', requireAuth, startSession);
router.post('/message', requireAuth, sendMessage);
router.post('/complete', requireAuth, completeSession);
router.get('/history', requireAuth, getHistory);
router.get('/session/:id', requireAuth, getSession);

module.exports = router;
