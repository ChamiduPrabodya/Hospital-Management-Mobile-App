const express = require('express');
const { createDoctor, getDoctors, getDoctorById, updateDoctor, deleteDoctor } = require('../controllers/doctor.controller');
const { protect, adminOnly } = require('../middleware/rbac.middleware');

const router = express.Router();

router.get('/', getDoctors);
router.post('/', protect, adminOnly, createDoctor);
router.get('/:id', getDoctorById);
router.put('/:id', protect, adminOnly, updateDoctor);
router.delete('/:id', protect, adminOnly, deleteDoctor);

module.exports = router;
