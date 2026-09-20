require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const env = require('../config/env');
const { USUARIO_SISTEMA_NOMBRE } = require('../constants/usuarioSistema');

async function nextId(table, pkColumn = 'id') {
  const [rows] = await db.query(
    `SELECT COALESCE(MAX(${pkColumn}), 0) + 1 AS next FROM ${table}`
  );
  return rows[0].next;
}

// Maquina de estados: NUEVA -> EN_VALIDACION -> {ALERTA | REGISTRADA_ERP} ->
// CONTABILIZADA. Solo estas 5 filas deben existir en estados_documentos
// (ver constants/estados.js e instrucciones del usuario) -- id_estado_
// siguiente queda en NULL para las 5: no se modela aqui una cadena lineal
// unica porque ALERTA puede resolverse hacia REGISTRADA_ERP tras aprobacion
// manual de un supervisor (DER §6), no es un estado terminal de error.
//
// Los ids son fijos y explicitos porque quedan referenciados desde el codigo
// (ESTADOS.*) y desde SIESA; estados_documentos no usa AUTO_INCREMENT.
const ESTADOS = [
  { id: 1, descripcion: 'NUEVA' },
  { id: 2, descripcion: 'EN_VALIDACION' },
  { id: 3, descripcion: 'ALERTA' },
  { id: 4, descripcion: 'REGISTRADA_ERP' },
  { id: 5, descripcion: 'CONTABILIZADA' },
];

async function seedEstados() {
  // Elimina cualquier fila fuera de este catalogo de 5 (ej. la maquina de 8
  // estados de una iteracion anterior) antes de sembrar, para que la tabla
  // quede exactamente con estos 5 registros como pide el negocio. Se hace
  // con DELETE explicito en vez de TRUNCATE porque estados_documentos tiene
  // FKs entrantes (facturas.id_estado, entradas_almacen.id_estado) que un
  // TRUNCATE no puede tocar si ya hay datos referenciandola.
  const ids = ESTADOS.map((e) => e.id);
  await db.query(
    `DELETE FROM estados_documentos WHERE id NOT IN (${ids.map(() => '?').join(',')})`,
    ids
  );

  for (const estado of ESTADOS) {
    // id_estado_siguiente se fuerza a NULL tambien en el UPDATE: una fila
    // 1-5 que ya existiera de una iteracion anterior (con la cadena lineal
    // vieja NUEVA->EN_VALIDACION->...->CONTABILIZADA) debe quedar
    // desencadenada, tal como lo pide el negocio.
    await db.query(
      `INSERT INTO estados_documentos (id, descripcion, id_estado_siguiente)
       VALUES (?, ?, NULL)
       ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion), id_estado_siguiente = NULL`,
      [estado.id, estado.descripcion]
    );
  }

  console.log(`[seed] ${ESTADOS.length} estados_documentos asegurados`);
}

// Usuario tecnico usado por auditoria_acciones cuando el cambio de estado lo
// dispara el worker de conciliacion (BullMQ), sin usuario autenticado detras
// (RC-06 exige id_usuario NOT NULL). Clave hasheada con un valor no usable
// para login real -- este usuario no debe poder autenticarse por
// POST /api/auth/login, solo sirve como FK de atribucion en auditoria.
async function seedUsuarioSistema() {
  const [existentes] = await db.query(
    'SELECT id FROM usuarios WHERE usuario = ? LIMIT 1',
    [USUARIO_SISTEMA_NOMBRE]
  );
  if (existentes.length > 0) {
    console.log(`[seed] usuario '${USUARIO_SISTEMA_NOMBRE}' ya existe (id=${existentes[0].id})`);
    return existentes[0].id;
  }

  // Hash de un valor aleatorio, no de una contraseña real: nadie debe poder
  // loguearse como 'sistema' desde el login normal.
  const hash = await bcrypt.hash(crypto.randomUUID(), 10);
  // usuarios.id no tiene AUTO_INCREMENT (mismo caso que estados_documentos):
  // se calcula con MAX+1, igual que seedAuth.js hace para 'admin'. No se usa
  // un id fijo porque seed:auth (que crea 'admin') siempre corre antes que
  // este script (seedBuzon ya lo exige), y un id fijo=1 chocaria con el id
  // que 'admin' ya haya tomado.
  const id = await nextId('usuarios');
  await db.query('INSERT INTO usuarios (id, usuario, clave) VALUES (?, ?, ?)', [
    id,
    USUARIO_SISTEMA_NOMBRE,
    hash,
  ]);
  console.log(`[seed] usuario '${USUARIO_SISTEMA_NOMBRE}' creado (id=${id})`);
  return id;
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
    await seedUsuarioSistema();
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
