const express = require('express');
const companiasController = require('./companias.controller');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, companiasController.listar);

module.exports = router;
