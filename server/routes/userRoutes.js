const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getOfficers } = require('../controllers/userController');

router.get('/officers', requireAuth, getOfficers);

module.exports = router;
