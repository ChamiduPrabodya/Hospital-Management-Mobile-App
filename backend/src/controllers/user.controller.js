const User = require('../models/user.model');
const Appointment = require('../models/appointment.model');
const Complaint = require('../models/complaint.model');
const MedicalDocument = require('../models/medicalDocument.model');
const Payment = require('../models/payment.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { validateObjectIdParam } = require('../utils/validateObjectId');
const { deleteFileAsset } = require('../utils/fileAsset');
const {
  normalizeUserProfilePayload,
  validateUserProfilePayload,
} = require('../utils/userProfile');

exports.getUsers = asyncHandler(async (req, res) => {
  const includeInactive = String(req.query?.includeInactive || '').toLowerCase() === 'true';
  const filter = includeInactive ? {} : { isActive: { $ne: false } };
  const users = await User.find(filter).select('-password');
  res.status(200).json(users);
});

exports.getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validateObjectIdParam(res, id, 'user ID')) return;

  if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const userQuery = req.user.role === 'admin'
    ? { _id: id }
    : { _id: id, isActive: { $ne: false } };

  const user = await User.findOne(userQuery).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json(user);
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validateObjectIdParam(res, id, 'user ID')) return;

  if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const updates = normalizeUserProfilePayload(req.body);
  const validationMessage = validateUserProfilePayload(updates);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  const existingUser = await User.findOne({
    email: updates.email,
    _id: { $ne: id },
    isActive: { $ne: false },
  });

  if (existingUser) {
    return res.status(409).json({ message: 'Email is already registered' });
  }

  const user = await User.findOneAndUpdate(
    { _id: id, isActive: { $ne: false } },
    updates,
    { new: true }
  ).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json(user);
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reason = String(req.body?.reason || '').trim();

  if (!validateObjectIdParam(res, id, 'user ID')) return;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (req.user._id.toString() === id) {
    return res.status(409).json({
      success: false,
      message: 'You cannot delete your own admin account while logged in',
      data: null,
    });
  }

  if (!reason) {
    return res.status(400).json({ message: 'A deactivation reason is required' });
  }

  if (reason.length > 500) {
    return res.status(400).json({ message: 'Deactivation reason cannot exceed 500 characters' });
  }

  const user = await User.findOne({ _id: id, isActive: { $ne: false } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.isActive = false;
  user.deletedAt = new Date();
  user.deactivationReason = reason;
  await user.save();

  return sendSuccess(res, 200, 'User deactivated successfully', {
    _id: user._id,
    isActive: user.isActive,
    deletedAt: user.deletedAt,
    deactivationReason: user.deactivationReason,
  });
});

exports.permanentlyDeleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validateObjectIdParam(res, id, 'user ID')) return;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (req.user._id.toString() === id) {
    return res.status(409).json({
      success: false,
      message: 'You cannot permanently delete your own admin account while logged in',
      data: null,
    });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.role !== 'patient') {
    return res.status(400).json({ message: 'Permanent delete is only available for patient accounts' });
  }

  const [appointmentCount, paymentCount, complaintCount, medicalDocumentCount] = await Promise.all([
    Appointment.countDocuments({ userId: id }),
    Payment.countDocuments({ userId: id }),
    Complaint.countDocuments({ userId: id }),
    MedicalDocument.countDocuments({ patientId: id }),
  ]);

  if (appointmentCount || paymentCount || complaintCount || medicalDocumentCount) {
    return res.status(409).json({
      message: 'Cannot permanently delete this patient because linked records still exist',
      data: {
        appointmentCount,
        paymentCount,
        complaintCount,
        medicalDocumentCount,
      },
    });
  }

  await deleteFileAsset(user.profileImageAssetId);
  await user.deleteOne();

  return sendSuccess(res, 200, 'Patient permanently deleted successfully', {
    _id: id,
    permanentlyDeleted: true,
  });
});

exports.reactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validateObjectIdParam(res, id, 'user ID')) return;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const user = await User.findById(id).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.isActive !== false) {
    return res.status(409).json({ message: 'User account is already active' });
  }

  user.isActive = true;
  user.deletedAt = null;
  user.deactivationReason = null;
  await user.save();

  return sendSuccess(res, 200, 'User reactivated successfully', user);
});
