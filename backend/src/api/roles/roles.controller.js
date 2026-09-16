const rolesService = require('../../services/rolesService');
const { auditar } = require('../../middleware/auth');

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

async function crear(req, res, next) {
  try {
    const { descripcion, permisos } = req.body || {};

    if (typeof descripcion !== 'string' || descripcion.trim().length === 0) {
      return res.status(400).json({ error: 'La descripción del rol es obligatoria' });
    }
    const idsPermisos = Array.isArray(permisos) ? permisos : [];
    if (!idsPermisos.every((p) => Number.isInteger(p))) {
      return res.status(400).json({ error: 'La lista de permisos es inválida' });
    }

    const creado = await rolesService.crearParaCia({
      descripcion: descripcion.trim(),
      idsPermisos,
      idCia: req.user.id_cia,
    });

    auditar(req, {
      entidad: 'roles',
      idEntidad: creado.id,
      accion: 'creacion',
      dataAfter: { descripcion: creado.descripcion, permisos: idsPermisos },
    });

    res.status(201).json(creado);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
}

async function actualizarPermisos(req, res, next) {
  try {
    const idRol = Number(req.params.idRol);
    const { permisos } = req.body || {};

    if (!Number.isInteger(idRol)) {
      return res.status(400).json({ error: 'Id de rol inválido' });
    }
    const idsPermisos = Array.isArray(permisos) ? permisos : [];
    if (!idsPermisos.every((p) => Number.isInteger(p))) {
      return res.status(400).json({ error: 'La lista de permisos es inválida' });
    }

    const antes = await rolesService.permisosDeRol(idRol, req.user.id_cia);

    const actualizado = await rolesService.actualizarPermisos({
      idRol,
      idsPermisos,
      idCia: req.user.id_cia,
    });

    auditar(req, {
      entidad: 'roles',
      idEntidad: idRol,
      accion: 'modificacion',
      dataBefore: { permisos: antes },
      dataAfter: { permisos: actualizado.permisos },
    });

    res.json(actualizado);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
}

async function eliminar(req, res, next) {
  try {
    const idRol = Number(req.params.idRol);
    if (!Number.isInteger(idRol)) {
      return res.status(400).json({ error: 'Id de rol inválido' });
    }

    const eliminado = await rolesService.desactivarParaCia({
      idRol,
      idCia: req.user.id_cia,
    });

    auditar(req, {
      entidad: 'roles',
      idEntidad: eliminado.id,
      accion: 'eliminacion',
      dataAfter: { activo: false },
    });

    res.json(eliminado);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
}

module.exports = { listar, permisos, crear, actualizarPermisos, eliminar };
