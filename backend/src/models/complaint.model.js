const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
    adminReply: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
