const mongoose = require('mongoose');

const medicalDocumentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
    title: { type: String, required: true },
    documentType: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileAssetId: { type: mongoose.Schema.Types.ObjectId, ref: 'FileAsset', default: null },
    fileName: { type: String },
    mimeType: { type: String },
    notes: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicalDocument', medicalDocumentSchema);
