const bcrypt = require('bcryptjs');
const Doctor = require('../models/doctor.model');
const Appointment = require('../models/appointment.model');
const User = require('../models/user.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { validateObjectIdParam } = require('../utils/validateObjectId');

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(String(email));

exports.createDoctor = asyncHandler(async (req, res) => {
  const {
    name,
    specialization,
    experience,
    description,
    consultationFee,
    image,
    availabilityStatus,
    email,
    password,
  } = req.body;

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '').trim();

  if (!name || !specialization || experience === undefined || !normalizedEmail || !normalizedPassword) {
    return res.status(400).json({ message: 'Name, specialization, experience, email, and password are required' });
  }

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ message: 'Doctor email must be valid' });
  }

  if (normalizedPassword.length < 6) {
    return res.status(400).json({ message: 'Doctor password must be at least 6 characters' });
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(409).json({ message: 'Doctor email is already used by another account' });
  }

  const doctor = await Doctor.create({
    name,
    specialization,
    experience,
    description,
    consultationFee,
    image,
    availabilityStatus: availabilityStatus !== undefined ? availabilityStatus : true,
  });

  const hashedPassword = await bcrypt.hash(normalizedPassword, 10);
  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    role: 'doctor',
    doctorProfileId: doctor._id,
    profileImage: image || null,
    isActive: true,
    deletedAt: null,
  });

  doctor.userId = user._id;
  await doctor.save();

  res.status(201).json(doctor);
});

exports.getDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find({ isActive: { $ne: false } }).populate('userId', 'email role isActive profileImage');
  res.status(200).json(doctors);
});

exports.getDoctorById = asyncHandler(async (req, res) => {
  if (!validateObjectIdParam(res, req.params.id, 'doctor ID')) return;

  const doctor = await Doctor.findOne({ _id: req.params.id, isActive: { $ne: false } }).populate('userId', 'email role isActive profileImage');
  if (!doctor) {
    return res.status(404).json({ message: 'Doctor not found' });
  }
  res.status(200).json(doctor);
});

exports.updateDoctor = asyncHandler(async (req, res) => {
  if (!validateObjectIdParam(res, req.params.id, 'doctor ID')) return;

  const doctor = await Doctor.findOne({ _id: req.params.id, isActive: { $ne: false } });
  if (!doctor) {
    return res.status(404).json({ message: 'Doctor not found' });
  }

  const updates = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.specialization !== undefined) updates.specialization = req.body.specialization;
  if (req.body.experience !== undefined) updates.experience = req.body.experience;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.consultationFee !== undefined) updates.consultationFee = req.body.consultationFee;
  if (req.body.image !== undefined) updates.image = req.body.image;
  if (req.body.availabilityStatus !== undefined) updates.availabilityStatus = req.body.availabilityStatus;

  Object.assign(doctor, updates);
  await doctor.save();

  let user = doctor.userId ? await User.findById(doctor.userId) : null;

  if (!user) {
    user = await User.findOne({ doctorProfileId: doctor._id, role: 'doctor' });
  }

  const wantsLoginUpdate = req.body.email !== undefined || req.body.password !== undefined;

  if (user || wantsLoginUpdate) {

    if (!user) {
      if (!req.body.email || !req.body.password) {
        return res.status(400).json({ message: 'Email and password are required to create missing doctor login' });
      }
      user = new User({
        role: 'doctor',
        doctorProfileId: doctor._id,
        isActive: true,
        deletedAt: null,
      });
    }

    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.image !== undefined) user.profileImage = req.body.image;

    if (req.body.email !== undefined) {
      const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
      if (!normalizedEmail) return res.status(400).json({ message: 'Doctor email cannot be empty' });
      if (!isValidEmail(normalizedEmail)) return res.status(400).json({ message: 'Doctor email must be valid' });

      const emailOwner = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
      if (emailOwner) return res.status(409).json({ message: 'Doctor email is already used by another account' });
      user.email = normalizedEmail;
    }

    if (req.body.password !== undefined && String(req.body.password).trim()) {
      const normalizedPassword = String(req.body.password).trim();
      if (normalizedPassword.length < 6) {
        return res.status(400).json({ message: 'Doctor password must be at least 6 characters' });
      }
      user.password = await bcrypt.hash(normalizedPassword, 10);
    }

    if (!user.email || !user.password) {
      return res.status(400).json({ message: 'Doctor login email and password are required' });
    }

    await user.save();

    if (!doctor.userId) {
      doctor.userId = user._id;
      await doctor.save();
    }
  }

  const populatedDoctor = await Doctor.findById(doctor._id).populate('userId', 'email role isActive profileImage');
  res.status(200).json(populatedDoctor);
});

exports.deleteDoctor = asyncHandler(async (req, res) => {
  if (!validateObjectIdParam(res, req.params.id, 'doctor ID')) return;

  const doctor = await Doctor.findOne({ _id: req.params.id, isActive: { $ne: false } });
  if (!doctor) {
    return res.status(404).json({ message: 'Doctor not found' });
  }

  const linkedAppointments = await Appointment.countDocuments({ doctorId: doctor._id });

  doctor.isActive = false;
  doctor.deletedAt = new Date();
  doctor.availabilityStatus = false;
  await doctor.save();

  const linkedUser = doctor.userId
    ? await User.findById(doctor.userId)
    : await User.findOne({ doctorProfileId: doctor._id, role: 'doctor' });

  if (linkedUser) {
    linkedUser.isActive = false;
    linkedUser.deletedAt = new Date();
    await linkedUser.save();
  }

  const message = linkedAppointments > 0
    ? 'Doctor has linked appointments, so the doctor was deactivated instead of hard deleted'
    : 'Doctor deleted successfully';

  return sendSuccess(res, 200, message);
});
