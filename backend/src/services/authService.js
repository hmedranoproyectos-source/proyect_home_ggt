const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const env = require('../config/env');

const PRE_SESSION_EXPIRES_IN = '5m';

async function findUserByUsername(usuario) {
  const [rows] = await db.query(
    'SELECT id, usuario, clave FROM usuarios WHERE usuario = ? LIMIT 1',
    [usuario]
  );
  return rows[0] || null;
}

async function getCompaniasForUser(idUsuario) {
  const [rows] = await db.query(
    `SELECT DISTINCT c.id, c.razon_social
     FROM usuarios_roles ur
     JOIN companias c ON c.id = ur.id_cia
     WHERE ur.id_usuario = ?`,
    [idUsuario]
  );
  return rows;
}

async function userHasAccessToCompania(idUsuario, idCia) {
  const [rows] = await db.query(
    'SELECT 1 FROM usuarios_roles WHERE id_usuario = ? AND id_cia = ? LIMIT 1',
    [idUsuario, idCia]
  );
  return rows.length > 0;
}

async function getRolesAndPermisos(idUsuario, idCia) {
  const [roles] = await db.query(
    `SELECT r.id AS id_rol, r.descripcion
     FROM usuarios_roles ur
     JOIN roles r ON r.id = ur.id_rol AND r.id_cia = ur.id_cia
     WHERE ur.id_usuario = ? AND ur.id_cia = ?`,
    [idUsuario, idCia]
  );

  const [permisoRows] = await db.query(
    `SELECT DISTINCT p.descripcion
     FROM usuarios_roles ur
     JOIN roles_permisos rp ON rp.id_rol = ur.id_rol AND rp.id_cia = ur.id_cia
     JOIN permisos p ON p.id = rp.id_permiso
     WHERE ur.id_usuario = ? AND ur.id_cia = ?`,
    [idUsuario, idCia]
  );

  return {
    roles,
    permisos: permisoRows.map((row) => row.descripcion),
  };
}

function signFinalToken(idUsuario, idCia, roles, permisos) {
  return jwt.sign(
    { id_usuario: idUsuario, id_cia: idCia, roles, permisos },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

function signPreSessionToken(idUsuario) {
  return jwt.sign({ id_usuario: idUsuario }, env.JWT_SECRET, {
    expiresIn: PRE_SESSION_EXPIRES_IN,
  });
}

async function login(usuario, clave) {
  const user = await findUserByUsername(usuario);
  if (!user) {
    return { status: 'invalid' };
  }

  const claveValida = await bcrypt.compare(clave, user.clave);
  if (!claveValida) {
    return { status: 'invalid' };
  }

  const companias = await getCompaniasForUser(user.id);

  if (companias.length === 0) {
    return { status: 'no_companias' };
  }

  if (companias.length === 1) {
    const idCia = companias[0].id;
    const { roles, permisos } = await getRolesAndPermisos(user.id, idCia);
    const token = signFinalToken(user.id, idCia, roles, permisos);
    return { status: 'ok', token, id_cia: idCia, roles, permisos };
  }

  return {
    status: 'select_company',
    preToken: signPreSessionToken(user.id),
    companias,
  };
}

async function selectCompany(idUsuario, idCia) {
  const tieneAcceso = await userHasAccessToCompania(idUsuario, idCia);
  if (!tieneAcceso) {
    return { status: 'forbidden' };
  }

  const { roles, permisos } = await getRolesAndPermisos(idUsuario, idCia);
  const token = signFinalToken(idUsuario, idCia, roles, permisos);
  return { status: 'ok', token, id_cia: idCia, roles, permisos };
}

// Cambia la compania activa de una sesion YA logueada (a diferencia de
// selectCompany, que solo aplica al pre-token del primer paso del login
// multiempresa). Reemite un token final completo con roles/permisos
// recalculados para la nueva compania.
async function switchCompany(idUsuario, idCia) {
  const tieneAcceso = await userHasAccessToCompania(idUsuario, idCia);
  if (!tieneAcceso) {
    return { status: 'forbidden' };
  }

  const { roles, permisos } = await getRolesAndPermisos(idUsuario, idCia);
  const token = signFinalToken(idUsuario, idCia, roles, permisos);
  return { status: 'ok', token, id_cia: idCia, roles, permisos };
}

module.exports = { login, selectCompany, switchCompany };
