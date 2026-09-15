const authService = require('../../services/authService');

async function login(req, res, next) {
  try {
    const { usuario, clave } = req.body;
    if (!usuario || !clave) {
      return res.status(400).json({ error: 'usuario y clave son requeridos' });
    }

    const result = await authService.login(usuario, clave);

    switch (result.status) {
      case 'invalid':
        return res.status(401).json({ error: 'Credenciales inválidas' });
      case 'no_companias':
        return res
          .status(403)
          .json({ error: 'Usuario sin compañías asignadas' });
      case 'select_company':
        return res.status(200).json({
          requiereSeleccionCompania: true,
          token: result.preToken,
          companias: result.companias,
        });
      case 'ok':
        return res.status(200).json({
          token: result.token,
          id_cia: result.id_cia,
          roles: result.roles,
          permisos: result.permisos,
        });
      default:
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
  } catch (err) {
    next(err);
  }
}

async function selectCompany(req, res, next) {
  try {
    const { id_cia } = req.body;
    if (!id_cia) {
      return res.status(400).json({ error: 'id_cia es requerido' });
    }

    const result = await authService.selectCompany(
      req.preSession.id_usuario,
      id_cia
    );

    if (result.status === 'forbidden') {
      return res
        .status(403)
        .json({ error: 'El usuario no tiene acceso a esa compañía' });
    }

    return res.status(200).json({
      token: result.token,
      id_cia: result.id_cia,
      roles: result.roles,
      permisos: result.permisos,
    });
  } catch (err) {
    next(err);
  }
}

async function switchCompany(req, res, next) {
  try {
    const { id_cia } = req.body;
    if (!id_cia) {
      return res.status(400).json({ error: 'id_cia es requerido' });
    }

    const result = await authService.switchCompany(req.user.id_usuario, id_cia);

    if (result.status === 'forbidden') {
      return res
        .status(403)
        .json({ error: 'El usuario no tiene acceso a esa compañía' });
    }

    return res.status(200).json({
      token: result.token,
      id_cia: result.id_cia,
      roles: result.roles,
      permisos: result.permisos,
    });
  } catch (err) {
    next(err);
  }
}

function me(req, res) {
  res.json(req.user);
}

module.exports = { login, selectCompany, switchCompany, me };
