const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getFarmerDashboard } = require('../controllers/dashboardController');

router.get('/farmer', requireAuth, getFarmerDashboard);

module.exports = router;
