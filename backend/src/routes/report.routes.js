const express = require('express');
const { generateReport, getReports, getReportById, deleteReport } = require('../controllers/report.controller');
const { protect, adminOnly } = require('../middleware/rbac.middleware');

const router = express.Router();

router.use(protect);
router.post('/generate', adminOnly, generateReport);
router.get('/', adminOnly, getReports);
router.get('/:id', adminOnly, getReportById);
router.delete('/:id', adminOnly, deleteReport);

module.exports = router;
