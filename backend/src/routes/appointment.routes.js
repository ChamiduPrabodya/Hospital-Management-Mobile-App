const express = require('express');
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus,
} = require('../controllers/appointment.controller');
const { protect, adminOnly } = require('../middleware/rbac.middleware');

const router = express.Router();

router.use(protect);
router.get('/', getAppointments);
router.post('/', createAppointment);
router.get('/:id', getAppointmentById);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);
router.patch('/:id/status', adminOnly, updateAppointmentStatus);

module.exports = router;
