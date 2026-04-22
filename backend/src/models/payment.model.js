const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['cash', 'card'], default: 'card' },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    transactionReference: { type: String },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
