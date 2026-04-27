const express = require('express');
const {
  uploadDoctorImage: uploadDoctorImageMiddleware,
  uploadUserProfileImage: uploadUserProfileImageMiddleware,
} = require('../middleware/upload.middleware');
const { protect, adminOnly } = require('../middleware/rbac.middleware');
const { uploadDoctorImage, uploadUserProfileImage } = require('../controllers/upload.controller');

const router = express.Router();

router.post(
  '/doctor-image',
  protect,
  adminOnly,
  uploadDoctorImageMiddleware.single('doctorImage'),
  uploadDoctorImage
);

router.post(
  '/profile-image',
  protect,
  uploadUserProfileImageMiddleware.single('profileImage'),
  uploadUserProfileImage
);

module.exports = router;
