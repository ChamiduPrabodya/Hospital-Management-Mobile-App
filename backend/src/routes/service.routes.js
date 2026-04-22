const express = require('express');
const { createService, getServices, getServiceById, updateService, deleteService } = require('../controllers/service.controller');
const { protect, adminOnly } = require('../middleware/rbac.middleware');

const router = express.Router();

router.get('/', getServices);
router.post('/', protect, adminOnly, createService);
router.get('/:id', getServiceById);
router.put('/:id', protect, adminOnly, updateService);
router.delete('/:id', protect, adminOnly, deleteService);

module.exports = router;
