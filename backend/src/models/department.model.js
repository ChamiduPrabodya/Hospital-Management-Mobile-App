const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
    maxlength: [80, 'Department name cannot exceed 80 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [120, 'Location cannot exceed 120 characters'],
  },
  contactNumber: {
    type: String,
    trim: true,
    default: '',
    maxlength: [30, 'Contact number cannot exceed 30 characters'],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Department', departmentSchema);
