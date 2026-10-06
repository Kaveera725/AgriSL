const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  startSession,
  sendMessage,
  completeSession,
  continueSession,
  getHistory,
  getSession,
  deleteSession,
} = require('../controllers/chatController');

// All chat routes require an authenticated user.
router.post('/start', requireAuth, startSession);
router.post('/message', requireAuth, sendMessage);
router.post('/complete', requireAuth, completeSession);
router.post('/continue', requireAuth, continueSession);
router.get('/history', requireAuth, getHistory);
router.get('/session/:id', requireAuth, getSession);
router.delete('/session/:id', requireAuth, deleteSession);

module.exports = router;
