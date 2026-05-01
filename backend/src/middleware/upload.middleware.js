const multer = require('multer');
const fs = require('fs');
const path = require('path');

const createFileFilter = (allowedMimeTypes, message) => (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(message), false);
  }
};

const imageFileFilter = createFileFilter(
  ['image/jpeg', 'image/png', 'image/jpg'],
  'Only JPEG, JPG, or PNG files are allowed'
);

const medicalDocumentFilter = createFileFilter(
  ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  'Only JPEG, JPG, PNG, or PDF files are allowed'
);

const createUpload = (folderName, fileFilter = imageFileFilter) => multer({
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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

module.exports = {
  uploadDoctorImage: createUpload('doctor-images'),
  uploadUserProfileImage: createUpload('profile-images'),
  uploadMedicalDocument: createUpload('medical-documents', medicalDocumentFilter),
};
