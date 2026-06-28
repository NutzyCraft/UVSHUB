const express = require('express');
const router = express.Router();
const { expireAccess } = require('../controllers/cronController');

router.get('/expire-access', expireAccess);

module.exports = router;
