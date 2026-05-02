const multer = require('multer');

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
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

module.exports = {
  uploadDoctorImage: createUpload('doctor-images'),
  uploadUserProfileImage: createUpload('profile-images'),
  uploadMedicalDocument: createUpload('medical-documents', medicalDocumentFilter),
};
