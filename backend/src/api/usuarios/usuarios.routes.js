const express = require('express');
const usuariosController = require('./usuarios.controller');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, usuariosController.listar);

module.exports = router;
