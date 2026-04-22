const Complaint = require('../models/complaint.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { validateObjectIdParam } = require('../utils/validateObjectId');

exports.createComplaint = asyncHandler(async (req, res) => {
  const subject = req.body.subject?.trim();
  const message = req.body.message?.trim();

  if (!subject || !message) {
    return res.status(400).json({ message: 'Subject and message are required' });
  }

  const complaint = await Complaint.create({
    userId: req.user._id,
    subject,
    message,
  });

  res.status(201).json(complaint);
});

exports.updateComplaint = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { subject, message } = req.body;

  if (!validateObjectIdParam(res, id, 'complaint ID')) return;

  const complaint = await Complaint.findById(id);
  if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

  const isAdmin = req.user.role === 'admin';
  const isOwner = complaint.userId.toString() === req.user._id.toString();
  if (!isAdmin && !isOwner) return res.status(403).json({ message: 'Forbidden' });

  if (subject !== undefined) complaint.subject = subject;
  if (message !== undefined) complaint.message = message;

  if (!complaint.subject || !complaint.message) {
    return res.status(400).json({ message: 'Subject and message are required' });
  }

  await complaint.save();
  res.status(200).json(complaint);
});

exports.getComplaints = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { userId: req.user._id };
  const complaints = await Complaint.find(filter)
    .populate('userId', '-password')
    .sort({ createdAt: -1 });
  res.status(200).json(complaints);
});

exports.getComplaintById = asyncHandler(async (req, res) => {
  if (!validateObjectIdParam(res, req.params.id, 'complaint ID')) return;

  const complaint = await Complaint.findById(req.params.id).populate('userId', '-password');

  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  if (req.user.role !== 'admin' && complaint.userId._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  res.status(200).json(complaint);
});

exports.updateComplaintStatus = asyncHandler(async (req, res) => {
  if (!validateObjectIdParam(res, req.params.id, 'complaint ID')) return;

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  const { status, adminReply } = req.body;
  const allowed = ['open', 'in_progress', 'resolved'];
  if (status && !allowed.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  complaint.status = status || complaint.status;
  if (adminReply !== undefined) complaint.adminReply = adminReply;
  await complaint.save();

  res.status(200).json(complaint);
});

exports.deleteComplaint = asyncHandler(async (req, res) => {
  if (!validateObjectIdParam(res, req.params.id, 'complaint ID')) return;

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  if (req.user.role !== 'admin' && complaint.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  await complaint.deleteOne();
  return sendSuccess(res, 200, 'Complaint deleted successfully');
});
