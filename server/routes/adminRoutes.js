const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const {
  getStats,
  getUsers,
  approveOfficer,
  rejectOfficer,
  getAllArticles,
  getAllReports,
  deleteUser,
} = require('../controllers/adminController');

// Every admin route is guarded by requireAdmin.
router.get('/stats', requireAdmin, getStats);
router.get('/users', requireAdmin, getUsers);
router.patch('/users/:id/approve', requireAdmin, approveOfficer);
router.patch('/users/:id/reject', requireAdmin, rejectOfficer);
router.get('/articles', requireAdmin, getAllArticles);
router.get('/reports', requireAdmin, getAllReports);
router.patch('/users/:id/deactivate', requireAdmin, deleteUser);

module.exports = router;
