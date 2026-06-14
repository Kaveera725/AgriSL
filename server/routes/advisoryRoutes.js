const express = require('express');
const router = express.Router();
const { requireAuth, requireOfficer } = require('../middleware/auth');
const {
  createArticle,
  updateArticle,
  deleteArticle,
  getArticles,
  getArticle,
  getOfficerArticles,
  getOfficerPendingReports,
  bookmarkArticle,
  removeBookmark,
  rateArticle,
} = require('../controllers/advisoryController');

// Officer-scoped routes — keep these static paths above the dynamic /:id route.
router.get('/officer/mine', requireOfficer, getOfficerArticles);
router.get('/officer/pending-reports', requireOfficer, getOfficerPendingReports);

// Public browsing
router.get('/', getArticles);
router.get('/:id', getArticle);

// Officer authoring
router.post('/', requireOfficer, createArticle);
router.put('/:id', requireOfficer, updateArticle);
router.delete('/:id', requireOfficer, deleteArticle);

// Authenticated user actions
router.post('/:id/bookmark', requireAuth, bookmarkArticle);
router.delete('/:id/bookmark', requireAuth, removeBookmark);
router.post('/:id/rate', requireAuth, rateArticle);

module.exports = router;
