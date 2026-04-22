const mongoose = require('mongoose');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateObjectIdParam = (res, id, label = 'ID') => {
  if (!isValidObjectId(id)) {
    res.status(400).json({
      success: false,
      message: `Invalid ${label}`,
      data: null,
    });
    return false;
  }

  return true;
};

module.exports = { isValidObjectId, validateObjectIdParam };
