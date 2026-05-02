const express = require('express');
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  permanentlyDeleteUser,
  reactivateUser,
} = require('../controllers/user.controller');
const { protect, adminOnly } = require('../middleware/rbac.middleware');

const router = express.Router();

router.use(protect);
router.get('/', adminOnly, getUsers);
router.delete('/:id/permanent', adminOnly, permanentlyDeleteUser);
router.patch('/:id/reactivate', adminOnly, reactivateUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', adminOnly, deleteUser);

module.exports = router;
