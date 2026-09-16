const companiasService = require('../../services/companiasService');
const { auditar } = require('../../middleware/auth');

async function listar(req, res, next) {
  try {
    const companias = await companiasService.listarParaUsuario(req.user.id_usuario);
    res.json(companias);
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  try {
    const { razonSocial, codErp } = req.body || {};

    if (typeof razonSocial !== 'string' || razonSocial.trim().length === 0) {
      return res.status(400).json({ error: 'La razón social es obligatoria' });
    }
    if (typeof codErp !== 'string' || codErp.trim().length !== 3) {
      return res.status(400).json({ error: 'El código ERP debe tener exactamente 3 caracteres' });
    }

    const creada = await companiasService.crearParaUsuario({
      razonSocial: razonSocial.trim(),
      codErp: codErp.trim(),
      idUsuario: req.user.id_usuario,
    });

    auditar(req, {
      entidad: 'companias',
      idEntidad: creada.id,
      accion: 'creacion',
      dataAfter: creada,
    });

    res.status(201).json(creada);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
}

async function eliminar(req, res, next) {
  try {
    const idCia = Number(req.params.id);
    if (!Number.isInteger(idCia)) {
      return res.status(400).json({ error: 'Id de compañía inválido' });
    }

    const eliminada = await companiasService.desactivar({
      idCia,
      idCiaSolicitante: req.user.id_cia,
      idUsuarioSolicitante: req.user.id_usuario,
    });

    auditar(req, {
      entidad: 'companias',
      idEntidad: eliminada.id,
      accion: 'eliminacion',
      dataAfter: { activo: false },
    });

    res.json(eliminada);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
}

module.exports = { listar, crear, eliminar };
