const protect = require('./auth.middleware');
const roleMiddleware = require('./role.middleware');

const adminOnly = roleMiddleware('admin');

const ownerOrAdmin = (getOwnerId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized access', data: null });
    }

    if (req.user.role === 'admin') return next();

    try {
      const ownerId = await getOwnerId(req);
      if (ownerId && ownerId.toString() === req.user._id.toString()) return next();
      return res.status(403).json({ success: false, message: 'Forbidden', data: null });
    } catch (error) {
      return next(error);
    }
  };
};

module.exports = { protect, adminOnly, ownerOrAdmin };
