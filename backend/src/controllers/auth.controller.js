const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));

exports.registerUser = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '').trim();

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  if (name.length < 2) {
    return res.status(400).json({ message: 'Name must be at least 2 characters' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Email must be valid' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: 'Email is already registered' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  let role = 'patient';
  if (req.body.role && ['patient', 'doctor', 'admin'].includes(req.body.role)) {
    role = req.body.role;
  } else {
    // Bootstrap for academic demos: if no admin exists, create the first account as admin.
    const adminExists = await User.exists({ role: 'admin' });
    if (!adminExists) role = 'admin';
  }

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
  });

  const token = generateToken(user._id);

  res.status(201).json({
    token,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    doctorProfileId: user.doctorProfileId,
    phone: user.phone,
    address: user.address,
    profileImage: user.profileImage,
  });
});

exports.loginUser = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '').trim();

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email, isActive: { $ne: false } });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = generateToken(user._id);

  res.status(200).json({
    token,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    doctorProfileId: user.doctorProfileId,
    phone: user.phone,
    address: user.address,
    profileImage: user.profileImage,
  });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '').trim();

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and new password are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Email must be valid' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const user = await User.findOne({ email, isActive: { $ne: false } });
  if (!user) {
    return res.status(404).json({ message: 'No active account found for this email' });
  }

  user.password = await bcrypt.hash(password, 10);
  await user.save();

  return res.status(200).json({ message: 'Password reset successful. You can now sign in.' });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  res.status(200).json(user);
});
