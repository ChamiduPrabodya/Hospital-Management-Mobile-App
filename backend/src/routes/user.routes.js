const express = require('express');
const { getUsers, getUserById, updateUser, deleteUser } = require('../controllers/user.controller');
const { protect, adminOnly } = require('../middleware/rbac.middleware');

const router = express.Router();

router.use(protect);
router.get('/', adminOnly, getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', adminOnly, deleteUser);

module.exports = router;
