const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/user.model');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
const isValidOtp = (otp) => /^\d{6}$/.test(String(otp));
const normalizePhone = (phone = '') => String(phone).replace(/[^\d+]/g, '').trim();
const isValidPhone = (phone) => /^\+?\d{10,15}$/.test(normalizePhone(phone));
const OTP_EXPIRY_MINUTES = 10;
const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');
const buildAuthPayload = (user, token) => ({
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

exports.registerUser = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = normalizePhone(req.body.phone || '');
  const password = String(req.body.password || '').trim();

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: 'Name, email, phone, and password are required' });
  }

  if (name.length < 2) {
    return res.status(400).json({ message: 'Name must be at least 2 characters' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Email must be valid' });
  }

  if (!isValidPhone(phone)) {
    return res.status(400).json({ message: 'Phone number must be valid' });
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
    phone,
    password: hashedPassword,
    role,
  });

  const token = generateToken(user._id);

  res.status(201).json(buildAuthPayload(user, token));
});

exports.loginUser = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '').trim();

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Email must be valid' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
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

  res.status(200).json(buildAuthPayload(user, token));
});

exports.requestPasswordResetOtp = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Email must be valid' });
  }

  const user = await User.findOne({ email, isActive: { $ne: false } });
  if (!user) {
    return res.status(404).json({ message: 'No active account found for this email' });
  }

  const otp = String(crypto.randomInt(100000, 1000000));
  user.resetPasswordOtpHash = hashOtp(otp);
  user.resetPasswordOtpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await user.save();

  const response = {
    message: `A 6-digit OTP has been generated. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
  };

  if (process.env.NODE_ENV !== 'production') {
    response.otp = otp;
  }

  return res.status(200).json(response);
});

exports.resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const otp = String(req.body.otp || '').trim();
  const password = String(req.body.password || '').trim();

  if (!email || !otp || !password) {
    return res.status(400).json({ message: 'Email, OTP, and new password are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Email must be valid' });
  }

  if (!isValidOtp(otp)) {
    return res.status(400).json({ message: 'OTP must be a 6-digit code' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const user = await User.findOne({ email, isActive: { $ne: false } });
  if (!user) {
    return res.status(404).json({ message: 'No active account found for this email' });
  }

  const otpExpired = !user.resetPasswordOtpExpiresAt || user.resetPasswordOtpExpiresAt.getTime() < Date.now();
  const otpMismatch = !user.resetPasswordOtpHash || user.resetPasswordOtpHash !== hashOtp(otp);

  if (otpExpired || otpMismatch) {
    return res.status(400).json({ message: 'OTP is invalid or has expired' });
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordOtpHash = null;
  user.resetPasswordOtpExpiresAt = null;
  await user.save();

  return res.status(200).json({ message: 'Password reset successful. You can now sign in.' });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  res.status(200).json(user);
});
