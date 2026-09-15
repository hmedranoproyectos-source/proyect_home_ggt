const companiasService = require('../../services/companiasService');

async function listar(req, res, next) {
  try {
    const companias = await companiasService.listarParaUsuario(req.user.id_usuario);
    res.json(companias);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
