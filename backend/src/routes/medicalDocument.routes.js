const express = require('express');
const {
  deleteMedicalDocument,
  getMedicalDocuments,
  uploadMedicalDocument,
} = require('../controllers/medicalDocument.controller');
const { protect } = require('../middleware/rbac.middleware');
const { uploadMedicalDocument: uploadMedicalDocumentMiddleware } = require('../middleware/upload.middleware');

const router = express.Router();

router.get('/', protect, getMedicalDocuments);
router.post('/', protect, uploadMedicalDocumentMiddleware.single('medicalDocument'), uploadMedicalDocument);
router.delete('/:id', protect, deleteMedicalDocument);

module.exports = router;
