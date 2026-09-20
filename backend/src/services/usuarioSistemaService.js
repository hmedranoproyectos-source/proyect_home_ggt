const db = require('../config/db');
const { USUARIO_SISTEMA_NOMBRE } = require('../constants/usuarioSistema');

// usuarios.id no tiene AUTO_INCREMENT y el usuario 'sistema' se siembra con
// MAX(id)+1 (seedPipeline.js) -- no hay un id fijo que este modulo pueda
// asumir. Se resuelve por nombre y se cachea en memoria del proceso (el
// worker de conciliacion no cambia de usuario 'sistema' en caliente).
let idCache = null;

async function getUsuarioSistemaId() {
  if (idCache !== null) return idCache;

  const [rows] = await db.query('SELECT id FROM usuarios WHERE usuario = ? LIMIT 1', [
    USUARIO_SISTEMA_NOMBRE,
  ]);
  if (rows.length === 0) {
    throw new Error(
      `Usuario '${USUARIO_SISTEMA_NOMBRE}' no existe. Corre "npm run seed:pipeline".`
    );
  }

  idCache = rows[0].id;
  return idCache;
}

module.exports = { getUsuarioSistemaId };
