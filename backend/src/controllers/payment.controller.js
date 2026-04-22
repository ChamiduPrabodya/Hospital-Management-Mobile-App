const Payment = require('../models/payment.model');
const Appointment = require('../models/appointment.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { validateObjectIdParam, isValidObjectId } = require('../utils/validateObjectId');

exports.createPayment = asyncHandler(async (req, res) => {
  const { appointmentId, amount, paymentMethod, transactionReference, status } = req.body;

  if (!appointmentId || amount === undefined || !paymentMethod) {
    return res.status(400).json({ message: 'appointmentId, amount, and paymentMethod are required' });
  }

  if (!isValidObjectId(appointmentId)) {
    return res.status(400).json({ message: 'Invalid appointment ID' });
  }

  const parsedAmount = Number(amount);
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    return res.status(404).json({ message: 'Appointment not found' });
  }

  if (req.user.role !== 'admin' && appointment.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (appointment.status !== 'approved') {
    return res.status(400).json({ message: 'Payment can be made only for approved appointments' });
  }

  // Prevent multiple payments for the same appointment.
  const existing = await Payment.findOne({ appointmentId, isActive: { $ne: false } });
  if (existing && existing.status !== 'failed') {
    return res.status(409).json({ message: 'Payment already exists for this appointment' });
  }

  const normalizedStatus = status || 'completed';
  const payment = await Payment.create({
    userId: req.user._id,
    appointmentId,
    amount: parsedAmount,
    paymentMethod,
    transactionReference,
    status: normalizedStatus,
  });

  if (normalizedStatus === 'completed') {
    appointment.paymentStatus = 'paid';
    appointment.paidAt = new Date();
    await appointment.save();
  }

  res.status(201).json(payment);
});

exports.getPayments = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { userId: req.user._id };
  const payments = await Payment.find({ ...filter, isActive: { $ne: false } })
    .populate('appointmentId')
    .populate('userId', '-password')
    .sort({ createdAt: -1 });
  res.status(200).json(payments);
});

exports.getPaymentById = asyncHandler(async (req, res) => {
  if (!validateObjectIdParam(res, req.params.id, 'payment ID')) return;

  const payment = await Payment.findOne({ _id: req.params.id, isActive: { $ne: false } })
    .populate('appointmentId')
    .populate('userId', '-password');

  if (!payment) {
    return res.status(404).json({ message: 'Payment not found' });
  }

  if (req.user.role !== 'admin' && payment.userId._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  res.status(200).json(payment);
});

exports.updatePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { appointmentId, amount, paymentMethod, status, transactionReference } = req.body;

  if (!validateObjectIdParam(res, id, 'payment ID')) return;

  const payment = await Payment.findOne({ _id: id, isActive: { $ne: false } });
  if (!payment) return res.status(404).json({ message: 'Payment not found' });

  if (req.user.role !== 'admin' && payment.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (appointmentId !== undefined) {
    if (!isValidObjectId(appointmentId)) {
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }
    payment.appointmentId = appointmentId;
  }

  if (amount !== undefined) {
    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }
    payment.amount = parsedAmount;
  }

  if (paymentMethod !== undefined) payment.paymentMethod = paymentMethod;
  if (status !== undefined) payment.status = status;
  if (transactionReference !== undefined) payment.transactionReference = transactionReference;

  await payment.save();

  // Keep appointment.paymentStatus in sync for completed payments.
  if (payment.status === 'completed') {
    const appointment = await Appointment.findById(payment.appointmentId);
    if (appointment) {
      appointment.paymentStatus = 'paid';
      appointment.paidAt = appointment.paidAt || new Date();
      await appointment.save();
    }
  }

  res.status(200).json(payment);
});

exports.deletePayment = asyncHandler(async (req, res) => {
  if (!validateObjectIdParam(res, req.params.id, 'payment ID')) return;

  const payment = await Payment.findOne({ _id: req.params.id, isActive: { $ne: false } });
  if (!payment) {
    return res.status(404).json({ message: 'Payment not found' });
  }

  if (req.user.role !== 'admin' && payment.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (payment.status === 'completed') {
    return res.status(409).json({
      success: false,
      message: 'Completed payments cannot be deleted',
      data: null,
    });
  }

  payment.isActive = false;
  payment.deletedAt = new Date();
  await payment.save();

  return sendSuccess(res, 200, 'Payment deleted successfully');
});
