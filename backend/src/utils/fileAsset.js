const FileAsset = require('../models/fileAsset.model');

const getOriginFromBaseUrl = (req) => {
  if (req?.get) {
    return `${req.protocol}://${req.get('host')}`;
  }

  const base = process.env.BASE_URL || 'http://localhost:5000/api';
  return base.replace(/\/api\/?$/, '');
};

const buildFileAssetUrl = (req, assetId) => `${getOriginFromBaseUrl(req)}/api/files/${assetId}`;

const createFileAsset = async (req, file, kind) => {
  if (!file?.buffer) {
    throw new Error('Uploaded file buffer is missing');
  }

  const asset = await FileAsset.create({
    fileName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    kind,
    data: file.buffer,
  });

  return {
    asset,
    url: buildFileAssetUrl(req, asset._id),
  };
};

const deleteFileAsset = async (assetId) => {
  if (!assetId) return;
  await FileAsset.findByIdAndDelete(assetId);
};

module.exports = {
  buildFileAssetUrl,
  createFileAsset,
  deleteFileAsset,
  getOriginFromBaseUrl,
};
