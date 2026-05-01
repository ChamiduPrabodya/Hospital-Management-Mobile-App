const FileAsset = require('../models/fileAsset.model');
const { validateObjectIdParam } = require('../utils/validateObjectId');

exports.getFileAsset = async (req, res, next) => {
  try {
    if (!validateObjectIdParam(res, req.params.id, 'file ID')) return;

    const asset = await FileAsset.findById(req.params.id).select('fileName mimeType size data');
    if (!asset) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Content-Length', asset.size);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(asset.fileName)}"`);
    res.send(asset.data);
  } catch (error) {
    next(error);
  }
};
