const db = require('../config/db');

// Catalogo global -- permisos no tiene id_cia (lo que varia por compania
// es que rol tiene cada permiso, via roles_permisos).
async function listarTodos() {
  const [rows] = await db.query('SELECT id, descripcion FROM permisos ORDER BY id');
  return rows;
}

module.exports = { listarTodos };
