const express = require('express');
const { registerUser, loginUser, forgotPassword, getMe } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.get('/me', authMiddleware, getMe);

module.exports = router;
