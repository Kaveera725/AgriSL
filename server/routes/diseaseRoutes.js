const express = require('express');
const router = express.Router();
const { requireAuth, requireOfficer } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const {
  detect,
  shareWithOfficer,
  getHistory,
  getReport,
  markReviewed,
} = require('../controllers/diseaseController');

router.post('/', requireAuth, uploadImage, detect);
router.post('/share', requireAuth, shareWithOfficer);
router.get('/history', requireAuth, getHistory);
// Static segments above must precede the dynamic :id route.
router.get('/:id', requireAuth, getReport);
router.patch('/:id/reviewed', requireOfficer, markReviewed);

module.exports = router;
