const express = require('express');
const { createPayment, getPayments, getPaymentById, updatePayment, deletePayment } = require('../controllers/payment.controller');
const { protect } = require('../middleware/rbac.middleware');

const router = express.Router();

router.use(protect);
router.get('/', getPayments);
router.post('/', createPayment);
router.get('/:id', getPaymentById);
router.put('/:id', updatePayment);
router.delete('/:id', deletePayment);

module.exports = router;
