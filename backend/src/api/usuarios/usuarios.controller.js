const usuariosService = require('../../services/usuariosService');
const { auditar } = require('../../middleware/auth');

async function listar(req, res, next) {
  try {
    const usuarios = await usuariosService.listarPorCia(req.user.id_cia);
    res.json(usuarios);
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  try {
    const { usuario, clave, roles } = req.body || {};

    if (typeof usuario !== 'string' || usuario.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre de usuario es obligatorio' });
    }
    if (typeof clave !== 'string' || clave.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }
    if (!Array.isArray(roles) || roles.length === 0 || !roles.every((r) => Number.isInteger(r))) {
      return res.status(400).json({ error: 'Debe seleccionar al menos un rol válido' });
    }

    const creado = await usuariosService.crearParaCia({
      usuario: usuario.trim(),
      clave,
      idsRoles: roles,
      idCia: req.user.id_cia,
    });

    auditar(req, {
      entidad: 'usuarios',
      idEntidad: creado.id,
      accion: 'creacion',
      dataAfter: { usuario: creado.usuario, roles: creado.roles },
    });

    res.status(201).json(creado);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
}

async function actualizar(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { clave, roles } = req.body || {};

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Id de usuario inválido' });
    }
    if (clave !== undefined && clave !== '' && (typeof clave !== 'string' || clave.length < 8)) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }
    if (!Array.isArray(roles) || roles.length === 0 || !roles.every((r) => Number.isInteger(r))) {
      return res.status(400).json({ error: 'Debe seleccionar al menos un rol válido' });
    }

    const usuariosAntes = await usuariosService.listarPorCia(req.user.id_cia);
    const antes = usuariosAntes.find((u) => u.id === id) || null;

    const actualizado = await usuariosService.actualizarParaCia({
      id,
      clave: clave || null,
      idsRoles: roles,
      idCia: req.user.id_cia,
    });

    auditar(req, {
      entidad: 'usuarios',
      idEntidad: actualizado.id,
      accion: 'modificacion',
      dataBefore: antes,
      dataAfter: { usuario: actualizado.usuario, roles: actualizado.roles, claveModificada: Boolean(clave) },
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
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Id de usuario inválido' });
    }

    const eliminado = await usuariosService.desactivarParaCia({
      id,
      idCia: req.user.id_cia,
      idUsuarioSolicitante: req.user.id_usuario,
    });

    auditar(req, {
      entidad: 'usuarios',
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

module.exports = { listar, crear, actualizar, eliminar };
