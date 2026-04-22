const sendSuccess = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data,
  });
};

module.exports = { sendSuccess, sendError };
