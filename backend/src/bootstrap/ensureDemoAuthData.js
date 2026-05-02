const bcrypt = require('bcryptjs');

const Doctor = require('../models/doctor.model');
const Department = require('../models/department.model');
const Service = require('../models/service.model');
const User = require('../models/user.model');

const isProduction = () => process.env.NODE_ENV === 'production';

const upsertUser = async ({ email, password, ...rest }) => {
  if (!email || !password) return null;

  const hashedPassword = await bcrypt.hash(password, 10);

  return User.findOneAndUpdate(
    { email: String(email).trim().toLowerCase() },
    {
      $set: {
        ...rest,
        email: String(email).trim().toLowerCase(),
        password: hashedPassword,
        isActive: true,
        deletedAt: null,
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
};

const ensureDemoAuthData = async () => {
  if (isProduction() || process.env.AUTO_BOOTSTRAP_DEMO_USERS === 'false') {
    return;
  }

  const cardiologyDepartment = await Department.findOneAndUpdate(
    { name: 'Cardiology' },
    {
      $set: {
        name: 'Cardiology',
        description: 'Heart and cardiovascular care.',
        location: 'Block A, Level 2',
        contactNumber: '0112345678',
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  const doctorProfile = await Doctor.findOneAndUpdate(
    { name: 'Dr. Amara Perera' },
    {
      $set: {
        name: 'Dr. Amara Perera',
        specialization: 'Cardiology',
        departmentId: cardiologyDepartment._id,
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

  const admin = await upsertUser({
    name: process.env.ADMIN_NAME || 'System Admin',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
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

  const doctorUser = await upsertUser({
    name: 'Dr. Amara Perera',
    email: process.env.DOCTOR_EMAIL || 'doctor@example.com',
    password: process.env.DOCTOR_PASSWORD || 'doctor123',
    role: 'doctor',
    phone: '0772223333',
    address: 'Tissamaharama',
    doctorProfileId: doctorProfile._id,
  });

  if (!doctorProfile.userId || doctorProfile.userId.toString() !== doctorUser._id.toString()) {
    doctorProfile.userId = doctorUser._id;
  }

  const [generalService, cardiologyService] = await Promise.all([
    Service.findOneAndUpdate(
      { serviceName: 'General Consultation' },
      {
        $set: {
          departmentId: cardiologyDepartment._id,
          serviceName: 'General Consultation',
          description: 'Basic doctor consultation and medical advice.',
          price: 1500,
          duration: 30,
          availabilityStatus: true,
          isActive: true,
          deletedAt: null,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    ),
    Service.findOneAndUpdate(
      { serviceName: 'Cardiology Checkup' },
      {
        $set: {
          departmentId: cardiologyDepartment._id,
          serviceName: 'Cardiology Checkup',
          description: 'Heart health review with specialist consultation.',
          price: 4500,
          duration: 45,
          availabilityStatus: true,
          isActive: true,
          deletedAt: null,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    ),
  ]);

  doctorProfile.services = [
    {
      serviceId: generalService._id,
      price: generalService.price,
      duration: generalService.duration,
      availabilityStatus: true,
    },
    {
      serviceId: cardiologyService._id,
      price: cardiologyService.price,
      duration: cardiologyService.duration,
      availabilityStatus: true,
    },
  ];
  await doctorProfile.save();

  console.log(
    `Demo auth data ready: ${admin.email}, ${patient.email}, ${doctorUser.email}`
  );
};

module.exports = ensureDemoAuthData;
