const express = require('express');
const {
  createAppointment,
  getAppointments,
  getDoctorBookedSlots,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus,
  updateMedicalNote,
} = require('../controllers/appointment.controller');
const { protect, adminOnly } = require('../middleware/rbac.middleware');

const router = express.Router();

router.use(protect);
router.get('/', getAppointments);
router.post('/', createAppointment);
router.get('/doctor/:doctorId/booked-slots', getDoctorBookedSlots);
router.get('/:id', getAppointmentById);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);
router.patch('/:id/status', adminOnly, updateAppointmentStatus);
router.patch('/:id/medical-note', updateMedicalNote);

module.exports = router;
