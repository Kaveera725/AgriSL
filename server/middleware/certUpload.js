const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Certification documents are stored separately from disease-report images so
// they can be served behind an admin-only route (never via express.static).
const CERT_DIR = 'uploads/certifications/';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Ensure the destination folder exists before multer tries to write to it.
fs.mkdirSync(CERT_DIR, { recursive: true });

// Replace anything that isn't a safe filename character so a crafted
// originalname can't escape the upload directory.
function sanitize(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CERT_DIR),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${sanitize(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error('Only JPG, PNG, or PDF files are allowed');
      err.code = 'INVALID_FILE_TYPE';
      cb(err);
    }
  },
});

// Wraps upload.single('cert_document') so multer errors become clean 400s.
// Farmers register without a file, so a missing file is not an error here —
// the controller decides whether a document is required based on the role.
function uploadCert(req, res, next) {
  upload.single('cert_document')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Certification document must be under 5MB' });
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ message: 'Only JPG, PNG, or PDF files are allowed' });
      }
      return res.status(400).json({ message: err.message || 'File upload failed' });
    }
    next();
  });
}

module.exports = { uploadCert, CERT_DIR };
