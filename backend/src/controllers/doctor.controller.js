const bcrypt = require('bcryptjs');
const Doctor = require('../models/doctor.model');
const Appointment = require('../models/appointment.model');
const User = require('../models/user.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { validateObjectIdParam, isValidObjectId } = require('../utils/validateObjectId');
const { isStrongPassword } = require('../utils/userProfile');

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(String(email));
const isValidTime = (time) => /^\d{2}:\d{2}$/.test(String(time));
const isValidDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(String(date));

const formatDoctorName = (name) => {
  const trimmedName = String(name || '').trim().replace(/\s+/g, ' ');
  if (!trimmedName) return trimmedName;

  const withoutTitle = trimmedName.replace(/^dr\.?\s+/i, '').trim();
  return `Dr. ${withoutTitle || trimmedName}`;
};

const formatSpecialization = (specialization) => {
  const trimmedSpecialization = String(specialization || '').trim().replace(/\s+/g, ' ');
  if (!trimmedSpecialization) return trimmedSpecialization;
  return trimmedSpecialization.charAt(0).toUpperCase() + trimmedSpecialization.slice(1);
};

const normalizeDoctorServices = (services = []) => {
  if (!Array.isArray(services)) return [];

  return services
    .map((service) => ({
      serviceId: service.serviceId,
      price: Number(service.price),
      duration: Number(service.duration),
      availabilityStatus: service.availabilityStatus !== undefined ? Boolean(service.availabilityStatus) : true,
    }))
    .filter((service) => service.serviceId);
};

const validateDoctorServices = (services) => {
  if (services.length === 0) {
    return 'At least one doctor service is required';
  }

  for (const service of services) {
    if (!isValidObjectId(service.serviceId)) {
      return 'Invalid service ID in doctor services';
    }
    if (Number.isNaN(service.price) || service.price <= 0) {
      return 'Doctor service price must be a positive number';
    }
    if (!Number.isInteger(service.duration) || service.duration <= 0) {
      return 'Doctor service duration must be a positive whole number';
    }
  }
  return null;
};

const normalizeTimeSlots = (timeSlots = []) => (
  Array.isArray(timeSlots)
    ? Array.from(new Set(timeSlots.map((slot) => String(slot || '').trim()).filter(Boolean))).sort()
    : []
);

const normalizeAvailabilitySchedule = (schedule = []) => {
  if (!Array.isArray(schedule)) return [];

  return schedule
    .map((item) => ({
      date: String(item.date || '').trim(),
      timeSlots: normalizeTimeSlots(item.timeSlots),
    }))
    .filter((item) => item.date && item.timeSlots.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
};

const validateAvailability = ({ availabilityMode, dailyTimeSlots, availabilitySchedule }) => {
  if (!['custom', 'daily'].includes(availabilityMode)) {
    return 'Availability mode must be custom or daily';
  }

  const slotsToValidate = availabilityMode === 'daily'
    ? dailyTimeSlots
    : availabilitySchedule.flatMap((item) => item.timeSlots);

  if (slotsToValidate.length === 0) {
    return 'At least one availability time slot is required';
  }

  if (slotsToValidate.some((slot) => !isValidTime(slot))) {
    return 'Availability time slots must be in HH:MM format';
  }

  if (availabilityMode === 'custom') {
    const invalidDate = availabilitySchedule.find((item) => !isValidDate(item.date));
    if (invalidDate) return 'Availability dates must be in YYYY-MM-DD format';
  }

  return null;
};

exports.createDoctor = asyncHandler(async (req, res) => {
  const {
    name,
    specialization,
    experience,
    description,
    image,
    availabilityStatus,
    email,
    password,
    services,
  } = req.body;

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '').trim();
  const normalizedSpecialization = formatSpecialization(specialization);

  if (!name || !normalizedSpecialization || experience === undefined || !normalizedEmail || !normalizedPassword) {
    return res.status(400).json({ message: 'Name, specialization, experience, email, and password are required' });
  }

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ message: 'Doctor email must be valid' });
  }

  if (!isStrongPassword(normalizedPassword)) {
    return res.status(400).json({ message: 'Doctor password must use 8+ characters with uppercase, lowercase, number, and symbol' });
  }

  const doctorName = formatDoctorName(name);
  const doctorServices = normalizeDoctorServices(services);

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(409).json({ message: 'Doctor email is already used by another account' });
  }

  const serviceValidationError = validateDoctorServices(doctorServices);
  if (serviceValidationError) {
    return res.status(400).json({ message: serviceValidationError });
  }

  const doctor = await Doctor.create({
    name: doctorName,
    specialization: normalizedSpecialization,
    experience,
    description,
    image,
    services: doctorServices,
    availabilityStatus: availabilityStatus !== undefined ? availabilityStatus : true,
  });

  const hashedPassword = await bcrypt.hash(normalizedPassword, 10);
  const user = await User.create({
    name: doctorName,
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
  const doctors = await Doctor.find({ isActive: { $ne: false } })
    .populate('userId', 'email role isActive profileImage')
    .populate('services.serviceId');
  res.status(200).json(doctors);
});

exports.getDoctorById = asyncHandler(async (req, res) => {
  if (!validateObjectIdParam(res, req.params.id, 'doctor ID')) return;

  const doctor = await Doctor.findOne({ _id: req.params.id, isActive: { $ne: false } })
    .populate('userId', 'email role isActive profileImage')
    .populate('services.serviceId');
  if (!doctor) {
    return res.status(404).json({ message: 'Doctor not found' });
  }
  res.status(200).json(doctor);
});

const ensureDoctorAccess = (req, res) => {
  if (req.user.role !== 'doctor') {
    res.status(403).json({ message: 'Only doctors can view patient history' });
    return false;
  }

  if (!req.user.doctorProfileId) {
    res.status(400).json({ message: 'Doctor account is not linked to a doctor profile' });
    return false;
  }

  return true;
};

exports.getMyPatients = asyncHandler(async (req, res) => {
  if (!ensureDoctorAccess(req, res)) return;

  const appointments = await Appointment.find({ doctorId: req.user.doctorProfileId })
    .sort({ appointmentDate: -1, appointmentTime: -1 })
    .populate('userId', '-password')
    .populate('serviceId', 'serviceName')
    .lean();

  const patientMap = new Map();

  appointments.forEach((appointment) => {
    const patient = appointment.userId;
    if (!patient?._id) return;

    const patientId = patient._id.toString();
    const current = patientMap.get(patientId) || {
      patient,
      appointmentCount: 0,
      lastAppointment: null,
      lastServiceName: null,
      hasMedicalNotes: false,
    };

    current.appointmentCount += 1;
    current.hasMedicalNotes = current.hasMedicalNotes || Boolean(appointment.medicalNote?.text);

    if (!current.lastAppointment) {
      current.lastAppointment = appointment;
      current.lastServiceName = appointment.serviceId?.serviceName || null;
    }

    patientMap.set(patientId, current);
  });

  res.status(200).json(Array.from(patientMap.values()));
});

exports.getPatientHistory = asyncHandler(async (req, res) => {
  if (!ensureDoctorAccess(req, res)) return;
  if (!validateObjectIdParam(res, req.params.patientId, 'patient ID')) return;

  const appointments = await Appointment.find({
    doctorId: req.user.doctorProfileId,
    userId: req.params.patientId,
  })
    .sort({ appointmentDate: -1, appointmentTime: -1 })
    .populate('doctorId')
    .populate('serviceId')
    .populate('userId', '-password')
    .populate('medicalNote.addedBy', 'name role')
    .lean();

  if (appointments.length === 0) {
    return res.status(403).json({ message: 'You are not authorized to view this patient history' });
  }

  const patient = appointments[0].userId;
  const medicalNotes = appointments
    .filter((appointment) => appointment.medicalNote?.text)
    .map((appointment) => ({
      appointmentId: appointment._id,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      serviceName: appointment.serviceId?.serviceName || 'Service',
      text: appointment.medicalNote.text,
      addedBy: appointment.medicalNote.addedBy,
      updatedAt: appointment.medicalNote.updatedAt,
    }));

  res.status(200).json({
    patient,
    appointmentCount: appointments.length,
    medicalNoteCount: medicalNotes.length,
    appointments,
    medicalNotes,
  });
});

exports.updateDoctor = asyncHandler(async (req, res) => {
  if (!validateObjectIdParam(res, req.params.id, 'doctor ID')) return;

  const doctor = await Doctor.findOne({ _id: req.params.id, isActive: { $ne: false } });
  if (!doctor) {
    return res.status(404).json({ message: 'Doctor not found' });
  }

  const updates = {};
  if (req.body.name !== undefined) updates.name = formatDoctorName(req.body.name);
  if (req.body.specialization !== undefined) {
    updates.specialization = formatSpecialization(req.body.specialization);
    if (!updates.specialization) return res.status(400).json({ message: 'Specialization is required' });
  }
  if (req.body.experience !== undefined) updates.experience = req.body.experience;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.image !== undefined) updates.image = req.body.image;
  if (req.body.availabilityStatus !== undefined) updates.availabilityStatus = req.body.availabilityStatus;
  if (req.body.availabilityMode !== undefined || req.body.dailyTimeSlots !== undefined || req.body.availabilitySchedule !== undefined) {
    const normalizedAvailabilityMode = req.body.availabilityMode === 'daily' ? 'daily' : 'custom';
    const normalizedDailyTimeSlots = normalizeTimeSlots(req.body.dailyTimeSlots);
    const normalizedAvailabilitySchedule = normalizeAvailabilitySchedule(req.body.availabilitySchedule);
    const availabilityValidationError = validateAvailability({
      availabilityMode: normalizedAvailabilityMode,
      dailyTimeSlots: normalizedDailyTimeSlots,
      availabilitySchedule: normalizedAvailabilitySchedule,
    });
    if (availabilityValidationError) return res.status(400).json({ message: availabilityValidationError });
    updates.availabilityMode = normalizedAvailabilityMode;
    updates.dailyTimeSlots = normalizedDailyTimeSlots;
    updates.availabilitySchedule = normalizedAvailabilitySchedule;
  }
  if (req.body.services !== undefined) {
    const doctorServices = normalizeDoctorServices(req.body.services);
    const serviceValidationError = validateDoctorServices(doctorServices);
    if (serviceValidationError) return res.status(400).json({ message: serviceValidationError });
    updates.services = doctorServices;
  }

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

    if (req.body.name !== undefined) user.name = updates.name;
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
      if (!isStrongPassword(normalizedPassword)) {
        return res.status(400).json({ message: 'Doctor password must use 8+ characters with uppercase, lowercase, number, and symbol' });
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

  const populatedDoctor = await Doctor.findById(doctor._id)
    .populate('userId', 'email role isActive profileImage')
    .populate('services.serviceId');
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
