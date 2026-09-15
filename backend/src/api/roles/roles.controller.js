const rolesService = require('../../services/rolesService');

async function listar(req, res, next) {
  try {
    const roles = await rolesService.listarPorCia(req.user.id_cia);
    res.json(roles);
  } catch (err) {
    next(err);
  }
}

async function permisos(req, res, next) {
  try {
    const idRol = Number(req.params.idRol);
    const permisos = await rolesService.permisosDeRol(idRol, req.user.id_cia);
    if (permisos === null) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }
    res.json(permisos);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, permisos };
