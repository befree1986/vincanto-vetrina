const express = require('express');
const { login } = require('../controllers/auth.controller.js');

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Autentica l'amministratore e restituisce un token
// @access  Public
router.post('/login', login);

module.exports = router;