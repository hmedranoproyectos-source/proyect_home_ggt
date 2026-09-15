require('dotenv').config();
const db = require('../config/db');
const env = require('../config/env');

// Maquina de estados derivada de RR-05 (linea de tiempo de una factura):
// Correo Recibido -> XML Parseado -> OC Validada -> En Elaboracion SIESA ->
// Contabilizado. Los estados terminales de error no encadenan (id_estado_
// siguiente = null): son salidas del flujo, no pasos intermedios.
//
// Los ids son fijos y explicitos porque quedan referenciados desde el codigo
// (ESTADOS.*) y desde SIESA; estados_documentos no usa AUTO_INCREMENT.
const ESTADOS = [
  { id: 1, descripcion: 'CORREO_RECIBIDO', siguiente: 2 },
  { id: 2, descripcion: 'XML_PARSEADO', siguiente: 3 },
  { id: 3, descripcion: 'OC_VALIDADA', siguiente: 4 },
  { id: 4, descripcion: 'EN_ELABORACION_SIESA', siguiente: 5 },
  { id: 5, descripcion: 'CONTABILIZADO', siguiente: null },
  // Salidas de error / excepcion.
  { id: 90, descripcion: 'ERROR_FORMATO', siguiente: null },
  { id: 91, descripcion: 'DUPLICADO', siguiente: null },
  // RC-02 / DER §6: FE sin OC se muestra sin comparacion y requiere
  // aprobacion manual de un supervisor.
  { id: 92, descripcion: 'SIN_OC', siguiente: null },
];

async function seedEstados() {
  // Se insertan primero todas las filas con siguiente = NULL y luego se
  // enlazan: estados_documentos.id_estado_siguiente es una FK auto-referente,
  // asi que apuntar a un id que aun no existe falla.
  for (const estado of ESTADOS) {
    await db.query(
      `INSERT INTO estados_documentos (id, descripcion, id_estado_siguiente)
       VALUES (?, ?, NULL)
       ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion)`,
      [estado.id, estado.descripcion]
    );
  }

  for (const estado of ESTADOS.filter((e) => e.siguiente !== null)) {
    await db.query(
      'UPDATE estados_documentos SET id_estado_siguiente = ? WHERE id = ?',
      [estado.siguiente, estado.id]
    );
  }

  console.log(`[seed] ${ESTADOS.length} estados_documentos asegurados`);
}

// correos.id_buzon es NOT NULL con FK a buzones, y buzones.id_config_buzon
// apunta a config_buzon_fe. Sin estas filas no se puede registrar un correo.
// La conexion IMAP real sigue saliendo de variables de entorno (ver
// emailConnectionService); estas filas registran a que buzon pertenece cada
// correo. La clave NO se persiste aqui: queda vacia a proposito.
async function seedBuzon() {
  const [companias] = await db.query('SELECT id FROM companias ORDER BY id LIMIT 1');
  if (companias.length === 0) {
    throw new Error('No hay companias; corre primero "npm run seed:auth"');
  }
  const idCia = companias[0].id;

  const [cfgExistente] = await db.query(
    'SELECT id FROM config_buzon_fe WHERE id_cia = ? LIMIT 1',
    [idCia]
  );

  let idConfig;
  if (cfgExistente.length > 0) {
    idConfig = cfgExistente[0].id;
    console.log(`[seed] config_buzon_fe ya existe (id=${idConfig})`);
  } else {
    const [result] = await db.query(
      `INSERT INTO config_buzon_fe
         (id_cia, descripcion, protocolo, servidor, puerto, cifrado, usuario, clave)
       VALUES (?, ?, 'IMAP', ?, ?, 'TLS', ?, '')`,
      [
        idCia,
        'Buzon oficial de facturacion electronica',
        env.IMAP_HOST || '',
        env.IMAP_PORT || 993,
        env.IMAP_USER || '',
      ]
    );
    idConfig = result.insertId;
    console.log(`[seed] config_buzon_fe creada (id=${idConfig})`);
  }

  const [buzonExistente] = await db.query(
    'SELECT id FROM buzones WHERE id_config_buzon = ? AND carpeta = ? LIMIT 1',
    [idConfig, 'INBOX']
  );

  if (buzonExistente.length > 0) {
    console.log(`[seed] buzon INBOX ya existe (id=${buzonExistente[0].id})`);
    return buzonExistente[0].id;
  }

  const [result] = await db.query(
    'INSERT INTO buzones (id_config_buzon, carpeta) VALUES (?, ?)',
    [idConfig, 'INBOX']
  );
  console.log(`[seed] buzon INBOX creado (id=${result.insertId})`);
  return result.insertId;
}

async function main() {
  try {
    await seedEstados();
    await seedBuzon();
    console.log('[seed] pipeline listo');
  } catch (err) {
    console.error('[seed] error:', err.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

main();

module.exports = { ESTADOS };
