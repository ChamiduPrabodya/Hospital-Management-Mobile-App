require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Doctor = require('../models/doctor.model');
const User = require('../models/user.model');
const Appointment = require('../models/appointment.model');
const Service = require('../models/service.model');
const Payment = require('../models/payment.model');
const Complaint = require('../models/complaint.model');
const Report = require('../models/report.model');

const slugify = (value) => String(value || 'doctor')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '.')
  .replace(/^\.+|\.+$/g, '')
  || 'doctor';

const makeEmail = async (doctor) => {
  const base = slugify(doctor.name).replace(/^dr\./, 'dr.');
  let email = `${base}@victoriahospital.local`;
  let counter = 1;

  while (await User.findOne({ email })) {
    email = `${base}.${counter}@victoriahospital.local`;
    counter += 1;
  }

  return email;
};

const printCounts = async () => {
  const [
    users,
    admins,
    doctors,
    patients,
    doctorProfiles,
    services,
    appointments,
    payments,
    complaints,
    reports,
  ] = await Promise.all([
    User.countDocuments({ isActive: { $ne: false } }),
    User.countDocuments({ role: 'admin', isActive: { $ne: false } }),
    User.countDocuments({ role: 'doctor', isActive: { $ne: false } }),
    User.countDocuments({ role: 'patient', isActive: { $ne: false } }),
    Doctor.countDocuments({ isActive: { $ne: false } }),
    Service.countDocuments({ isActive: { $ne: false } }),
    Appointment.countDocuments({}),
    Payment.countDocuments({ isActive: { $ne: false } }),
    Complaint.countDocuments({}),
    Report.countDocuments({}),
  ]);

  console.log('\nDatabase counts');
  console.log(`Users: ${users} (admin: ${admins}, doctor: ${doctors}, patient: ${patients})`);
  console.log(`Doctor profiles: ${doctorProfiles}`);
  console.log(`Services: ${services}`);
  console.log(`Appointments: ${appointments}`);
  console.log(`Payments: ${payments}`);
  console.log(`Complaints: ${complaints}`);
  console.log(`Reports: ${reports}`);
};

const syncDoctorLogins = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing in backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  await printCounts();

  const doctors = await Doctor.find({ isActive: { $ne: false } }).sort({ name: 1 });
  const created = [];
  const existing = [];

  for (const doctor of doctors) {
    let user = doctor.userId ? await User.findById(doctor.userId) : null;

    if (!user) {
      user = await User.findOne({ doctorProfileId: doctor._id, role: 'doctor' });
    }

    if (user) {
      let changed = false;

      if (user.role !== 'doctor') {
        user.role = 'doctor';
        changed = true;
      }
      if (!user.doctorProfileId || user.doctorProfileId.toString() !== doctor._id.toString()) {
        user.doctorProfileId = doctor._id;
        changed = true;
      }
      if (user.isActive === false || user.deletedAt) {
        user.isActive = true;
        user.deletedAt = null;
        changed = true;
      }
      if (!doctor.userId || doctor.userId.toString() !== user._id.toString()) {
        doctor.userId = user._id;
        await doctor.save();
      }
      if (changed) await user.save();

      existing.push({
        doctor: doctor.name,
        email: user.email,
        note: 'existing password kept',
      });
      continue;
    }

    const email = await makeEmail(doctor);
    const password = `Doctor@${doctor._id.toString().slice(-6)}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.create({
      name: doctor.name,
      email,
      password: hashedPassword,
      role: 'doctor',
      doctorProfileId: doctor._id,
      isActive: true,
      deletedAt: null,
    });

    doctor.userId = user._id;
    await doctor.save();

    created.push({ doctor: doctor.name, email, password });
  }

  console.log('\nDoctor login sync complete');
  console.log(`Doctor profiles checked: ${doctors.length}`);
  console.log(`New doctor logins created: ${created.length}`);
  console.log(`Existing doctor logins kept/linked: ${existing.length}`);

  if (created.length) {
    console.log('\nNew doctor credentials');
    created.forEach((item) => {
      console.log(`${item.doctor}: ${item.email} / ${item.password}`);
    });
  }

  if (existing.length) {
    console.log('\nExisting doctor logins');
    existing.forEach((item) => {
      console.log(`${item.doctor}: ${item.email} / ${item.note}`);
    });
  }
};

syncDoctorLogins()
  .catch((error) => {
    console.error(`Doctor login sync failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
