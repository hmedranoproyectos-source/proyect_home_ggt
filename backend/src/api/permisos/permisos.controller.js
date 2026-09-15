const permisosService = require('../../services/permisosService');

async function listar(req, res, next) {
  try {
    const permisos = await permisosService.listarTodos();
    res.json(permisos);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
