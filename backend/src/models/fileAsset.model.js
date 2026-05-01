const mongoose = require('mongoose');

const fileAssetSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    kind: {
      type: String,
      enum: ['doctor-image', 'profile-image', 'medical-document'],
      required: true,
    },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FileAsset', fileAssetSchema);
