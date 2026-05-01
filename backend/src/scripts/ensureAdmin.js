require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/user.model');

const ensureAdmin = async () => {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required in backend/.env');
  }

  await connectDB();

  const email = process.env.ADMIN_EMAIL.toLowerCase();
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

  const admin = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        name: process.env.ADMIN_NAME || 'System Admin',
        email,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        deletedAt: null,
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  ).select('name email role isActive createdAt updatedAt');

  console.log(JSON.stringify(admin, null, 2));
};

ensureAdmin()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
