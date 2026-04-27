const multer = require('multer');
const fs = require('fs');
const path = require('path');

const createUpload = (folderName) => multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.resolve(__dirname, '..', '..', 'uploads', folderName);
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const name = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
      cb(null, name);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG, or PNG files are allowed'), false);
  }
};

module.exports = {
  uploadDoctorImage: createUpload('doctor-images'),
  uploadUserProfileImage: createUpload('profile-images'),
};
