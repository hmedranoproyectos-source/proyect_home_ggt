const path = require('path');
const fs = require('fs/promises');
const db = require('../config/db');
const env = require('../config/env');

const CARPETA_DEFAULT = 'INBOX';
const PROTOCOLO_DEFAULT = 'IMAP';
const CIFRADO_DEFAULT = 'TLS';
const PUERTO_DEFAULT = 993;
// Raiz del bind-mount host<->contenedor (docker-compose.yml: backend/worker
// -> C:/Documentos/DescargasFacturas). `ruta_descargas` en config_buzon_fe es
// siempre una SUBCARPETA relativa a esta raiz, nunca una ruta absoluta del
// host: el contenedor no tiene visibilidad de otras rutas de Windows.
const DOWNLOADS_BASE_PATH = '/app/descargas-facturas';
// Carpetas destino del clasificador de correos (ver emailScanProcessor.js).
// Ya se crearon manualmente en el buzon real vs imap.gmail.com; el worker
// las referencia por nombre, no las crea (node-imap addBox es idempotente
// pero crear carpetas no es responsabilidad del escaneo periodico).
const CARPETA_PROCESADOS = 'PROCESADOS';
const CARPETA_DUPLICADOS = 'DUPLICADOS';
const CARPETA_ERROR_FORMATO = 'ERROR_FORMATO';
const CARPETA_NOTA_CREDITO = 'NOTA CREDITO';
const CARPETA_NOTA_DEBITO = 'NOTA DEBITO';

function mapearPublico(row, carpeta) {
  if (!row) return null;
  return {
    id: row.id,
    idCia: row.id_cia,
    descripcion: row.descripcion,
    protocolo: row.protocolo,
    servidor: row.servidor,
    puerto: row.puerto,
    cifrado: row.cifrado,
    usuario: row.usuario,
    tieneClave: Boolean(row.clave),
    carpeta: carpeta || CARPETA_DEFAULT,
    rutaDescargas: row.ruta_descargas || '',
  };
}

function defaults(idCia) {
  return {
    id: null,
    idCia,
    descripcion: 'Buzón oficial de facturación electrónica',
    protocolo: PROTOCOLO_DEFAULT,
    servidor: '',
    puerto: PUERTO_DEFAULT,
    cifrado: CIFRADO_DEFAULT,
    usuario: '',
    tieneClave: false,
    carpeta: CARPETA_DEFAULT,
    rutaDescargas: '',
  };
}

async function obtenerPorCia(idCia) {
  const [rows] = await db.query(
    `SELECT id, id_cia, descripcion, protocolo, servidor, puerto,
            cifrado, usuario, clave, ruta_descargas
       FROM config_buzon_fe
      WHERE id_cia = ?
      ORDER BY id
      LIMIT 1`,
    [idCia]
  );
  if (rows.length === 0) {
    return defaults(idCia);
  }

  const [buzones] = await db.query(
    `SELECT carpeta FROM buzones
      WHERE id_config_buzon = ?
      ORDER BY id
      LIMIT 1`,
    [rows[0].id]
  );

  return mapearPublico(rows[0], buzones[0]?.carpeta);
}

// Sanitiza la subcarpeta configurada por el usuario: quita separadores de
// Windows/Unix iniciales, ".." y unidades ("C:") para que path.join no pueda
// escapar de DOWNLOADS_BASE_PATH (el campo del frontend es texto libre).
function sanitizarSubcarpeta(valor) {
  if (!valor) return '';
  return String(valor)
    .replace(/^[a-zA-Z]:/, '')
    .split(/[\\/]+/)
    .filter((seg) => seg && seg !== '.' && seg !== '..')
    .join('/');
}

// Subcarpetas de primer nivel ya existentes bajo DOWNLOADS_BASE_PATH (ej.
// "1", "duquin"), para que la tab Buzon ofrezca un selector en vez de texto
// libre y evite que un typo cree una carpeta nueva por accidente. La raiz
// puede no existir todavia (bind-mount recien creado, ningun correo
// procesado aun): en ese caso se devuelve lista vacia, no error.
async function listarSubcarpetasDescargas() {
  try {
    const entradas = await fs.readdir(DOWNLOADS_BASE_PATH, { withFileTypes: true });
    return entradas
      .filter((entrada) => entrada.isDirectory())
      .map((entrada) => entrada.name)
      .sort((a, b) => a.localeCompare(b));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

// Ruta de descargas efectiva para un correo entrante (RP-01): subcarpeta
// configurada por compania en config_buzon_fe (relativa a
// DOWNLOADS_BASE_PATH), o el fallback de entorno DOWNLOADS_PATH si la
// compania no la definio todavia.
async function obtenerRutaDescargas(idCia) {
  const [rows] = await db.query(
    'SELECT ruta_descargas FROM config_buzon_fe WHERE id_cia = ? ORDER BY id LIMIT 1',
    [idCia]
  );
  const fila = rows[0];
  const subcarpeta = sanitizarSubcarpeta(
    (fila && fila.ruta_descargas) || env.DOWNLOADS_PATH
  );
  return subcarpeta ? path.join(DOWNLOADS_BASE_PATH, subcarpeta) : DOWNLOADS_BASE_PATH;
}

// Credenciales para conectar IMAP. Prioridad: fila de la cia con clave;
// si la fila existe pero la clave está vacía (seed), se usa IMAP_PASSWORD
// del entorno; si no hay fila usable, todo el fallback es el .env.
async function obtenerCredenciales(idCia) {
  const [rows] = await db.query(
    `SELECT servidor, puerto, cifrado, usuario, clave
       FROM config_buzon_fe
      WHERE id_cia = ?
      ORDER BY id
      LIMIT 1`,
    [idCia]
  );

  const fila = rows[0];
  const servidor = (fila && fila.servidor) || env.IMAP_HOST || '';
  const usuario = (fila && fila.usuario) || env.IMAP_USER || '';
  const puerto = Number((fila && fila.puerto) || env.IMAP_PORT || PUERTO_DEFAULT);
  const cifrado = (fila && fila.cifrado) || CIFRADO_DEFAULT;
  const clave = (fila && fila.clave) || env.IMAP_PASSWORD || '';

  return { servidor, puerto, cifrado, usuario, clave };
}

async function asegurarCarpeta(conn, idConfig, carpeta) {
  const [existentes] = await conn.query(
    `SELECT id FROM buzones
      WHERE id_config_buzon = ? AND carpeta = ?
      LIMIT 1`,
    [idConfig, carpeta]
  );
  if (existentes.length > 0) {
    return existentes[0].id;
  }

  const [result] = await conn.query(
    'INSERT INTO buzones (id_config_buzon, carpeta) VALUES (?, ?)',
    [idConfig, carpeta]
  );
  return result.insertId;
}

async function guardar({
  idCia,
  descripcion,
  protocolo,
  servidor,
  puerto,
  cifrado,
  usuario,
  clave,
  carpeta,
  rutaDescargas,
}) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existentes] = await conn.query(
      `SELECT id, clave FROM config_buzon_fe
        WHERE id_cia = ?
        ORDER BY id
        LIMIT 1
        FOR UPDATE`,
      [idCia]
    );

    const claveFinal =
      typeof clave === 'string' && clave.length > 0
        ? clave
        : existentes[0]?.clave || '';

    let idConfig;
    if (existentes.length > 0) {
      idConfig = existentes[0].id;
      await conn.query(
        `UPDATE config_buzon_fe
            SET descripcion = ?, protocolo = ?, servidor = ?, puerto = ?,
                cifrado = ?, usuario = ?, clave = ?, ruta_descargas = ?
          WHERE id = ? AND id_cia = ?`,
        [
          descripcion,
          protocolo,
          servidor,
          puerto,
          cifrado,
          usuario,
          claveFinal,
          rutaDescargas || null,
          idConfig,
          idCia,
        ]
      );
    } else {
      const [result] = await conn.query(
        `INSERT INTO config_buzon_fe
           (id_cia, descripcion, protocolo, servidor, puerto, cifrado, usuario, clave, ruta_descargas)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          idCia,
          descripcion,
          protocolo,
          servidor,
          puerto,
          cifrado,
          usuario,
          claveFinal,
          rutaDescargas || null,
        ]
      );
      idConfig = result.insertId;
    }

    await asegurarCarpeta(conn, idConfig, carpeta);
    await conn.commit();

    return obtenerPorCia(idCia);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  CARPETA_DEFAULT,
  PROTOCOLO_DEFAULT,
  CIFRADO_DEFAULT,
  PUERTO_DEFAULT,
  CARPETA_PROCESADOS,
  CARPETA_DUPLICADOS,
  CARPETA_ERROR_FORMATO,
  CARPETA_NOTA_CREDITO,
  CARPETA_NOTA_DEBITO,
  DOWNLOADS_BASE_PATH,
  obtenerPorCia,
  obtenerCredenciales,
  obtenerRutaDescargas,
  listarSubcarpetasDescargas,
  guardar,
};
