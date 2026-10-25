const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads', 'signatures');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

function imageOnly(_req, file, cb) {
  const allowed = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowed.includes(file.mimetype)) return cb(new Error('Upload a PNG, JPG, or WEBP image.'));
  cb(null, true);
}

module.exports = multer({ storage, fileFilter: imageOnly, limits: { fileSize: 2 * 1024 * 1024 } });
