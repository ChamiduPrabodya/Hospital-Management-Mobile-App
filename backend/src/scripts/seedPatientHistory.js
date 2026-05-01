require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Appointment = require('../models/appointment.model');
const Doctor = require('../models/doctor.model');
const Service = require('../models/service.model');
const User = require('../models/user.model');

const upsertUser = async ({ email, password, ...data }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return User.findOneAndUpdate(
    { email },
    {
      $set: {
        ...data,
        email,
        password: hashedPassword,
        isActive: true,
        deletedAt: null,
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
};

const upsertService = (service) =>
  Service.findOneAndUpdate(
    { serviceName: service.serviceName },
    { $set: { ...service, isActive: true, deletedAt: null } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

const upsertAppointment = (appointment) =>
  Appointment.findOneAndUpdate(
    {
      userId: appointment.userId,
      doctorId: appointment.doctorId,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
    },
    { $set: appointment },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

const seedPatientHistory = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing in backend/.env');

  await mongoose.connect(process.env.MONGO_URI);

  const doctor = await Doctor.findOneAndUpdate(
    { name: 'Dr. Amara Perera' },
    {
      $set: {
        name: 'Dr. Amara Perera',
        specialization: 'Cardiology',
        experience: 12,
        description: 'Senior cardiologist specializing in preventive heart care.',
        consultationFee: 3500,
        availabilityStatus: true,
        isActive: true,
        deletedAt: null,
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  const doctorUser = await upsertUser({
    name: 'Dr. Amara Perera',
    email: (process.env.DOCTOR_EMAIL || 'doctor@example.com').toLowerCase(),
    password: process.env.DOCTOR_PASSWORD || 'doctor123',
    role: 'doctor',
    phone: '0772223333',
    address: 'Colombo',
    doctorProfileId: doctor._id,
  });

  doctor.userId = doctorUser._id;
  await doctor.save();

  const [cardiology, general] = await Promise.all([
    upsertService({
      serviceName: 'Cardiology Checkup',
      description: 'Heart health review with specialist consultation.',
      price: 4500,
      duration: 45,
      availabilityStatus: true,
    }),
    upsertService({
      serviceName: 'General Consultation',
      description: 'Basic doctor consultation and medical advice.',
      price: 1500,
      duration: 30,
      availabilityStatus: true,
    }),
  ]);

  const [patientOne, patientTwo] = await Promise.all([
    upsertUser({
      name: 'Demo Patient',
      email: 'patient@example.com',
      password: 'patient123',
      role: 'patient',
      phone: '0777654321',
      address: 'Kandy',
    }),
    upsertUser({
      name: 'Nimali Jayawardena',
      email: 'nimali.patient@example.com',
      password: 'patient123',
      role: 'patient',
      phone: '0714567890',
      address: 'Galle',
    }),
  ]);

  const history = [
    {
      userId: patientOne._id,
      doctorId: doctor._id,
      serviceId: cardiology._id,
      appointmentDate: new Date('2026-02-12T00:00:00.000Z'),
      appointmentTime: '09:30',
      status: 'approved',
      paymentStatus: 'paid',
      paidAt: new Date('2026-02-12T09:15:00.000Z'),
      notes: 'Patient reported mild chest discomfort during exercise.',
      medicalNote: {
        text: 'Blood pressure 128/82. ECG reviewed, no acute ischemic changes. Recommended lipid profile and reduced caffeine intake.',
        addedBy: doctorUser._id,
        updatedAt: new Date('2026-02-12T10:05:00.000Z'),
      },
    },
    {
      userId: patientOne._id,
      doctorId: doctor._id,
      serviceId: cardiology._id,
      appointmentDate: new Date('2026-03-18T00:00:00.000Z'),
      appointmentTime: '11:00',
      status: 'approved',
      paymentStatus: 'paid',
      paidAt: new Date('2026-03-18T10:50:00.000Z'),
      notes: 'Follow-up visit after lab results.',
      medicalNote: {
        text: 'LDL mildly elevated. Started diet plan and advised 30 minutes walking five days per week. Review in six weeks.',
        addedBy: doctorUser._id,
        updatedAt: new Date('2026-03-18T11:30:00.000Z'),
      },
    },
    {
      userId: patientTwo._id,
      doctorId: doctor._id,
      serviceId: general._id,
      appointmentDate: new Date('2026-04-02T00:00:00.000Z'),
      appointmentTime: '14:00',
      status: 'approved',
      paymentStatus: 'paid',
      paidAt: new Date('2026-04-02T13:45:00.000Z'),
      notes: 'Routine visit with palpitations after stress.',
      medicalNote: {
        text: 'Pulse regular during exam. Suggested hydration, sleep routine, and symptom diary. No red flags reported.',
        addedBy: doctorUser._id,
        updatedAt: new Date('2026-04-02T14:25:00.000Z'),
      },
    },
  ];

  await Promise.all(history.map(upsertAppointment));

  console.log('Doctor patient history data ready');
  console.log(`Doctor login: ${doctorUser.email} / ${process.env.DOCTOR_PASSWORD || 'doctor123'}`);
  console.log('Patient logins: patient@example.com / patient123, nimali.patient@example.com / patient123');
};

seedPatientHistory()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
