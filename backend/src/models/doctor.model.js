const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    experience: { type: Number, required: true },
    availabilityStatus: { type: Boolean, default: true },
    availabilityMode: { type: String, enum: ['custom', 'daily'], default: 'custom' },
    dailyTimeSlots: [{ type: String }],
    availabilitySchedule: [
      {
        date: { type: String, required: true },
        timeSlots: [{ type: String, required: true }],
      },
    ],
    image: { type: String },
    imageAssetId: { type: mongoose.Schema.Types.ObjectId, ref: 'FileAsset', default: null },
    description: { type: String },
    consultationFee: { type: Number },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    services: [
      {
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
        price: { type: Number, required: true },
        duration: { type: Number, required: true },
        availabilityStatus: { type: Boolean, default: true },
      },
    ],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);
