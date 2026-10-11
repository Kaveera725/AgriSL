const path = require('path');
const fs = require('fs');
const multer = require('multer');

const PROFILES_DIR = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(PROFILES_DIR)) {
  fs.mkdirSync(PROFILES_DIR, { recursive: true });
}

const profileUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, PROFILES_DIR);
    },
    filename: (req, file, cb) => {
      cb(null, 'profile-' + req.user.id + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, or WEBP images accepted'), false);
    }
  },
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB max for profile photo
});

module.exports = { profileUpload, PROFILES_DIR };
