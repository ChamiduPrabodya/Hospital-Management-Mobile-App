const express = require('express');
const upload = require('../middleware/upload.middleware');
const { protect, adminOnly } = require('../middleware/rbac.middleware');
const { uploadDoctorImage } = require('../controllers/upload.controller');

const router = express.Router();

router.post(
  '/doctor-image',
  protect,
  adminOnly,
  upload.single('doctorImage'),
  uploadDoctorImage
);

module.exports = router;
