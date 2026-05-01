const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/user.model');
const Doctor = require('../models/doctor.model');
const Service = require('../models/service.model');
const Appointment = require('../models/appointment.model');
const Payment = require('../models/payment.model');
const Complaint = require('../models/complaint.model');
const Report = require('../models/report.model');

dotenv.config();

const upsertUser = async ({ name, email, password, role, phone, address, doctorProfileId = null }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return User.findOneAndUpdate(
    { email },
    { name, email, password: hashedPassword, role, phone, address, doctorProfileId, isActive: true, deletedAt: null },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
};

const upsertDoctor = (doctor) =>
  Doctor.findOneAndUpdate(
    { name: doctor.name },
    { ...doctor, isActive: true, deletedAt: null },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

const upsertService = (service) =>
  Service.findOneAndUpdate(
    { serviceName: service.serviceName },
    { ...service, isActive: true, deletedAt: null },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

const seed = async () => {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required in backend/.env');
  }

  await connectDB();

  const admin = await upsertUser({
    name: process.env.ADMIN_NAME || 'System Admin',
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: 'admin',
    phone: '0771234567',
    address: 'Colombo',
  });

  const patient = await upsertUser({
    name: 'Demo Patient',
    email: 'patient@example.com',
    password: 'patient123',
    role: 'patient',
    phone: '0777654321',
    address: 'Kandy',
  });

  const doctors = await Promise.all([
    upsertDoctor({
      name: 'Dr. Amara Perera',
      specialization: 'Cardiology',
      experience: 12,
      description: 'Senior cardiologist specializing in preventive heart care.',
      consultationFee: 3500,
      availabilityStatus: true,
    }),
    upsertDoctor({
      name: 'Dr. Nuwan Silva',
      specialization: 'Dermatology',
      experience: 8,
      description: 'Treats skin, hair, and allergy-related conditions.',
      consultationFee: 2800,
      availabilityStatus: true,
    }),
    upsertDoctor({
      name: 'Dr. Ishara Fernando',
      specialization: 'Pediatrics',
      experience: 10,
      description: 'Child health specialist for infants, children, and teens.',
      consultationFee: 3000,
      availabilityStatus: true,
    }),
    upsertDoctor({
      name: 'Dr. Kavindu Jayasinghe',
      specialization: 'Orthopedics',
      experience: 15,
      description: 'Bone, joint, and sports injury consultant.',
      consultationFee: 4000,
      availabilityStatus: true,
    }),
  ]);

  const doctorUser = await upsertUser({
    name: 'Dr. Amara Perera',
    email: process.env.DOCTOR_EMAIL || 'doctor@example.com',
    password: process.env.DOCTOR_PASSWORD || 'doctor123',
    role: 'doctor',
    phone: '0772223333',
    address: 'Tissamaharama',
    doctorProfileId: doctors[0]._id,
  });
  doctors[0].userId = doctorUser._id;
  await doctors[0].save();

  const services = await Promise.all([
    upsertService({
      serviceName: 'General Consultation',
      description: 'Basic doctor consultation and medical advice.',
      price: 1500,
      duration: 30,
      availabilityStatus: true,
    }),
    upsertService({
      serviceName: 'Cardiology Checkup',
      description: 'Heart health review with specialist consultation.',
      price: 4500,
      duration: 45,
      availabilityStatus: true,
    }),
    upsertService({
      serviceName: 'Child Health Consultation',
      description: 'Pediatric consultation and child health guidance.',
      price: 2500,
      duration: 30,
      availabilityStatus: true,
    }),
    upsertService({
      serviceName: 'Orthopedic Consultation',
      description: 'Bone, joint, and injury assessment.',
      price: 3500,
      duration: 40,
      availabilityStatus: true,
    }),
  ]);

  const appointment = await Appointment.findOneAndUpdate(
    {
      userId: patient._id,
      doctorId: doctors[0]._id,
      serviceId: services[1]._id,
      appointmentDate: new Date('2026-05-05T00:00:00.000Z'),
      appointmentTime: '10:00',
    },
    {
      userId: patient._id,
      doctorId: doctors[0]._id,
      serviceId: services[1]._id,
      appointmentDate: new Date('2026-05-05T00:00:00.000Z'),
      appointmentTime: '10:00',
      status: 'approved',
      paymentStatus: 'paid',
      paidAt: new Date('2026-05-05T10:00:00.000Z'),
      notes: 'Demo appointment for seeded database.',
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  await Payment.findOneAndUpdate(
    { appointmentId: appointment._id },
    {
      appointmentId: appointment._id,
      userId: patient._id,
      amount: services[1].price,
      paymentMethod: 'card',
      status: 'completed',
      transactionReference: 'DEMO-TXN-001',
      isActive: true,
      deletedAt: null,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  await Complaint.findOneAndUpdate(
    { userId: patient._id, subject: 'Long waiting time' },
    {
      userId: patient._id,
      subject: 'Long waiting time',
      message: 'The appointment queue took longer than expected.',
      status: 'in_progress',
      adminReply: 'We are reviewing the schedule and will improve the process.',
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  await Report.findOneAndUpdate(
    { reportType: 'appointments', title: 'Appointment Report' },
    {
      reportType: 'appointments',
      generatedBy: admin._id,
      title: 'Appointment Report',
      data: {
        totalAppointments: 1,
        pending: 0,
        approved: 1,
        rejected: 0,
        cancelled: 0,
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  const counts = {
    users: await User.countDocuments(),
    doctors: await Doctor.countDocuments(),
    services: await Service.countDocuments(),
    appointments: await Appointment.countDocuments(),
    payments: await Payment.countDocuments(),
    complaints: await Complaint.countDocuments(),
    reports: await Report.countDocuments(),
  };

  console.log('Database seeded successfully:', counts);
  console.log(`Admin login: ${process.env.ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD}`);
  console.log('Patient login: patient@example.com / patient123');
  console.log(`Doctor login: ${process.env.DOCTOR_EMAIL || 'doctor@example.com'} / ${process.env.DOCTOR_PASSWORD || 'doctor123'}`);
};

seed()
  .catch((error) => {
    console.error('Database seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
