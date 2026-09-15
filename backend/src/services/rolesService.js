const db = require('../config/db');

async function listarPorCia(idCia) {
  const [rows] = await db.query(
    'SELECT id, descripcion FROM roles WHERE id_cia = ? ORDER BY descripcion',
    [idCia]
  );
  return rows;
}

// Devuelve null si el rol no existe o no pertenece a idCia -- el
// controller responde 404 en ese caso (no 403, para no filtrar
// existencia de roles de otras companias).
async function permisosDeRol(idRol, idCia) {
  const [rolRows] = await db.query(
    'SELECT 1 FROM roles WHERE id = ? AND id_cia = ? LIMIT 1',
    [idRol, idCia]
  );
  if (rolRows.length === 0) {
    return null;
  }

  const [permisos] = await db.query(
    `SELECT p.id, p.descripcion
     FROM roles_permisos rp
     JOIN permisos p ON p.id = rp.id_permiso
     WHERE rp.id_rol = ? AND rp.id_cia = ?
     ORDER BY p.id`,
    [idRol, idCia]
  );
  return permisos;
}

module.exports = { listarPorCia, permisosDeRol };
