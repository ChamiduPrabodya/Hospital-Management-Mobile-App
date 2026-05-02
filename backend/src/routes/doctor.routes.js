const express = require('express');
const {
  createDoctor,
  getDoctors,
  getDoctorById,
  getMyPatients,
  getPatientHistory,
  updateDoctor,
  deleteDoctor,
} = require('../controllers/doctor.controller');
const { protect, adminOnly } = require('../middleware/rbac.middleware');

const router = express.Router();

router.get('/', getDoctors);
router.get('/my-patients', protect, getMyPatients);
router.get('/patients/:patientId/history', protect, getPatientHistory);
router.post('/', protect, adminOnly, createDoctor);
router.get('/:id', getDoctorById);
router.put('/:id', protect, adminOnly, updateDoctor);
router.delete('/:id', protect, adminOnly, deleteDoctor);

module.exports = router;
