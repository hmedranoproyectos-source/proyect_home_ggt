const db = require('../config/db');
const env = require('../config/env');

const CARPETA_DEFAULT = 'INBOX';
const PROTOCOLO_DEFAULT = 'IMAP';
const CIFRADO_DEFAULT = 'TLS';
const PUERTO_DEFAULT = 993;

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
  };
}

async function obtenerPorCia(idCia) {
  const [rows] = await db.query(
    `SELECT id, id_cia, descripcion, protocolo, servidor, puerto,
            cifrado, usuario, clave
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
                cifrado = ?, usuario = ?, clave = ?
          WHERE id = ? AND id_cia = ?`,
        [
          descripcion,
          protocolo,
          servidor,
          puerto,
          cifrado,
          usuario,
          claveFinal,
          idConfig,
          idCia,
        ]
      );
    } else {
      const [result] = await conn.query(
        `INSERT INTO config_buzon_fe
           (id_cia, descripcion, protocolo, servidor, puerto, cifrado, usuario, clave)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          idCia,
          descripcion,
          protocolo,
          servidor,
          puerto,
          cifrado,
          usuario,
          claveFinal,
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
  obtenerPorCia,
  obtenerCredenciales,
  guardar,
};
