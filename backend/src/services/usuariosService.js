const db = require('../config/db');

// Usuarios con acceso a la compania activa (usuarios no tiene id_cia
// propio -- la pertenencia siempre pasa por usuarios_roles). Un usuario
// puede tener varios roles en la misma compania, por eso se agrega en JS
// en vez de GROUP_CONCAT en SQL.
async function listarPorCia(idCia) {
  const [rows] = await db.query(
    `SELECT u.id, u.usuario, ur.id_rol, r.descripcion
     FROM usuarios u
     JOIN usuarios_roles ur ON ur.id_usuario = u.id
     JOIN roles r ON r.id = ur.id_rol AND r.id_cia = ur.id_cia
     WHERE ur.id_cia = ?
     ORDER BY u.usuario`,
    [idCia]
  );

  const porUsuario = new Map();
  for (const row of rows) {
    if (!porUsuario.has(row.id)) {
      porUsuario.set(row.id, { id: row.id, usuario: row.usuario, roles: [] });
    }
    porUsuario.get(row.id).roles.push({ id: row.id_rol, descripcion: row.descripcion });
  }
  return Array.from(porUsuario.values());
}

module.exports = { listarPorCia };
