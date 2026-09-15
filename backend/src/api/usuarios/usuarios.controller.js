const usuariosService = require('../../services/usuariosService');

async function listar(req, res, next) {
  try {
    const usuarios = await usuariosService.listarPorCia(req.user.id_cia);
    res.json(usuarios);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
