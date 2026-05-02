const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    serviceName: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true },
    availabilityStatus: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
