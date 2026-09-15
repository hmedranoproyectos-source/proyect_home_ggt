const db = require('../config/db');

// RC-06: registra una accion sensible (creacion/modificacion/validacion/
// contabilizacion) sobre un documento. mysql2 no serializa objetos JS a
// JSON en columnas JSON via placeholders -- hay que hacer JSON.stringify
// explicito antes del insert.
async function registrarAccion({
  idCia,
  idUsuario,
  entidad,
  idEntidad,
  accion,
  ipAddress,
  dataBefore = null,
  dataAfter = null,
}) {
  await db.query(
    `INSERT INTO auditoria_acciones
       (id_cia, id_usuario, entidad, id_entidad, accion, ip_address, data_before, data_after)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      idCia,
      idUsuario,
      entidad,
      idEntidad,
      accion,
      ipAddress,
      dataBefore === null ? null : JSON.stringify(dataBefore),
      dataAfter === null ? null : JSON.stringify(dataAfter),
    ]
  );
}

// Linea de tiempo de un documento (RR-05): todas las acciones registradas
// sobre `entidad`+`idEntidad` dentro de la compania del usuario autenticado.
async function getHistorialEntidad(idCia, entidad, idEntidad) {
  const [rows] = await db.query(
    `SELECT a.id, a.id_usuario, u.usuario, a.accion, a.ip_address,
            a.data_before, a.data_after, a.fecha
     FROM auditoria_acciones a
     JOIN usuarios u ON u.id = a.id_usuario
     WHERE a.id_cia = ? AND a.entidad = ? AND a.id_entidad = ?
     ORDER BY a.fecha ASC, a.id ASC`,
    [idCia, entidad, idEntidad]
  );
  return rows;
}

module.exports = { registrarAccion, getHistorialEntidad };
