const path = require('path');
const multer = require('multer');

const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    // Unique name preserving the original extension.
    const ext = path.extname(file.originalname) || '.jpg';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // Flag so the wrapper can return the right 400 message.
      const err = new Error('Only JPG and PNG images are allowed');
      err.code = 'INVALID_FILE_TYPE';
      cb(err);
    }
  },
});

// Wraps upload.single('image') so multer errors become clean 400 responses.
function uploadImage(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Image must be under 5MB' });
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ message: 'Only JPG and PNG images are allowed' });
      }
      return res.status(400).json({ message: err.message || 'File upload failed' });
    }
    next();
  });
}

module.exports = { upload, uploadImage };
