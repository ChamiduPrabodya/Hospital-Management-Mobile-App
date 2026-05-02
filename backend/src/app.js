const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const { errorHandler } = require('./middleware/error.middleware');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const doctorRoutes = require('./routes/doctor.routes');
const serviceRoutes = require('./routes/service.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const paymentRoutes = require('./routes/payment.routes');
const complaintRoutes = require('./routes/complaint.routes');
const reportRoutes = require('./routes/report.routes');
const departmentRoutes = require('./routes/departmentRoutes');
const fileRoutes = require('./routes/file.routes');
const uploadRoutes = require('./routes/upload.routes');
const medicalDocumentRoutes = require('./routes/medicalDocument.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/medical-documents', medicalDocumentRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    message: 'Hospital Management API is running',
    db: {
      name: mongoose.connection?.name || null,
      host: mongoose.connection?.host || null,
      readyState: mongoose.connection?.readyState ?? null,
    },
    mongoMode: process.env.MONGO_URI_SOURCE || process.env.MONGO_TARGET || 'auto',
  });
});

app.use(errorHandler);

module.exports = app;
