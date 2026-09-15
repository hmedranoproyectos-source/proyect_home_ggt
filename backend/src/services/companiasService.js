const db = require('../config/db');

// Companias a las que el usuario autenticado tiene acceso via
// usuarios_roles (misma logica que authService.getCompaniasForUser, aqui
// se agrega cod_erp para que el frontend no necesite otra llamada).
async function listarParaUsuario(idUsuario) {
  const [rows] = await db.query(
    `SELECT DISTINCT c.id, c.razon_social, c.cod_erp
     FROM usuarios_roles ur
     JOIN companias c ON c.id = ur.id_cia
     WHERE ur.id_usuario = ?
     ORDER BY c.razon_social`,
    [idUsuario]
  );
  return rows;
}

module.exports = { listarParaUsuario };
