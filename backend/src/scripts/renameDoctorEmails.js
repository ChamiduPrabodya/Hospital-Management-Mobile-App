require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Doctor = require('../models/doctor.model');
const User = require('../models/user.model');

const emailByDoctorName = {
  'Dr. Amara Perera': 'amara@victoriahospital.local',
  'Dr. Ishara Fernando': 'ishara@victoriahospital.local',
  'Dr. Kavindu Jayasinghe': 'kavindu@victoriahospital.local',
  'Dr. Nuwan Silva': 'nuwan@victoriahospital.local',
};

const renameDoctorEmails = async () => {
  await connectDB();

  const doctors = await Doctor.find({
    name: { $in: Object.keys(emailByDoctorName) },
    isActive: { $ne: false },
  });

  const changed = [];

  for (const doctor of doctors) {
    const email = emailByDoctorName[doctor.name];
    let user = doctor.userId ? await User.findById(doctor.userId) : null;

    if (!user) {
      user = await User.findOne({ doctorProfileId: doctor._id, role: 'doctor' });
    }

    if (!user) {
      console.log(`${doctor.name}: no linked doctor user found`);
      continue;
    }

    const owner = await User.findOne({ email, _id: { $ne: user._id } });
    if (owner) {
      console.log(`${doctor.name}: skipped because ${email} is already used`);
      continue;
    }

    user.email = email;
    user.role = 'doctor';
    user.doctorProfileId = doctor._id;
    user.isActive = true;
    user.deletedAt = null;
    await user.save();

    if (!doctor.userId || doctor.userId.toString() !== user._id.toString()) {
      doctor.userId = user._id;
      await doctor.save();
    }

    changed.push({ doctor: doctor.name, email });
  }

  console.log('\nDoctor emails updated');
  changed.forEach((item) => {
    console.log(`${item.doctor}: ${item.email}`);
  });
};

renameDoctorEmails()
  .catch((error) => {
    console.error(`Doctor email rename failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
