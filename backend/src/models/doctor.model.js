const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    experience: { type: Number, required: true },
    availabilityStatus: { type: Boolean, default: true },
    image: { type: String },
    description: { type: String },
    consultationFee: { type: Number },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);
