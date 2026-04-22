const express = require('express');
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  updateComplaintStatus,
  deleteComplaint,
} = require('../controllers/complaint.controller');
const { protect, adminOnly } = require('../middleware/rbac.middleware');

const router = express.Router();

router.use(protect);
router.get('/', getComplaints);
router.post('/', createComplaint);
router.get('/:id', getComplaintById);
router.put('/:id', updateComplaint);
router.patch('/:id/status', adminOnly, updateComplaintStatus);
router.delete('/:id', deleteComplaint);

module.exports = router;
