const User = require('../models/user.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { validateObjectIdParam } = require('../utils/validateObjectId');

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ isActive: { $ne: false } }).select('-password');
  res.status(200).json(users);
});

exports.getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validateObjectIdParam(res, id, 'user ID')) return;

  if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const user = await User.findOne({ _id: id, isActive: { $ne: false } }).select('-password');
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

  const updates = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    profileImage: req.body.profileImage,
  };

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

  const user = await User.findOne({ _id: id, isActive: { $ne: false } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.isActive = false;
  user.deletedAt = new Date();
  await user.save();

  return sendSuccess(res, 200, 'User deactivated successfully');
});
