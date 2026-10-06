const path = require('path');
const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, updateProfilePicture } = require('../controllers/authController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { uploadCert, CERT_DIR } = require('../middleware/certUpload');
const { uploadImage } = require('../middleware/upload');

// Registration accepts an optional multipart certification document. Farmers
// send no file (req.file is undefined); officers must include one — the
// controller enforces that based on the role.
router.post('/register', uploadCert, register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.put('/profile', requireAuth, updateProfile);
router.post('/profile-picture', requireAuth, uploadImage, updateProfilePicture);

// Serve an officer's certification document — admins only (never public).
router.get('/cert/:filename', requireAdmin, (req, res) => {
  // path.basename strips any directory components, blocking path traversal.
  const safeName = path.basename(req.params.filename);
  return res.sendFile(path.resolve(CERT_DIR, safeName), (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ message: 'Document not found' });
    }
  });
});

module.exports = router;
