const express = require('express');
const { getFileAsset } = require('../controllers/file.controller');

const router = express.Router();

router.get('/:id', getFileAsset);

module.exports = router;
