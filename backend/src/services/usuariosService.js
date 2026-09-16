const bcrypt = require('bcrypt');
const db = require('../config/db');

const BCRYPT_SALT_ROUNDS = 10;

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
     WHERE ur.id_cia = ? AND u.activo = 1
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

// usuarios.id no tiene AUTO_INCREMENT en el esquema oficial (ver CLAUDE.md
// §4 / mysql-init/01_schema.sql) -- mismo patron que seedAuth.js
// (MAX(id)+1), pero aqui corre dentro de una transaccion con la fila
// bloqueada (FOR UPDATE) para no chocar con otra creacion concurrente.
async function crearParaCia({ usuario, clave, idsRoles, idCia }) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existentes] = await conn.query(
      'SELECT id FROM usuarios WHERE usuario = ? LIMIT 1 FOR UPDATE',
      [usuario]
    );
    if (existentes.length > 0) {
      const err = new Error('El usuario ya existe');
      err.status = 409;
      throw err;
    }

    const [rolesValidos] = await conn.query(
      `SELECT id FROM roles WHERE id_cia = ? AND id IN (?) AND activo = 1`,
      [idCia, idsRoles]
    );
    if (rolesValidos.length !== idsRoles.length) {
      const err = new Error('Uno o más roles no pertenecen a la compañía activa');
      err.status = 400;
      throw err;
    }

    const [[{ nextId }]] = await conn.query(
      'SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM usuarios'
    );
    const hash = await bcrypt.hash(clave, BCRYPT_SALT_ROUNDS);

    await conn.query('INSERT INTO usuarios (id, usuario, clave) VALUES (?, ?, ?)', [
      nextId,
      usuario,
      hash,
    ]);

    for (const idRol of idsRoles) {
      await conn.query(
        'INSERT INTO usuarios_roles (id_usuario, id_rol, id_cia) VALUES (?, ?, ?)',
        [nextId, idRol, idCia]
      );
    }

    await conn.commit();

    const [rolesCreados] = await db.query(
      'SELECT id, descripcion FROM roles WHERE id_cia = ? AND id IN (?)',
      [idCia, idsRoles]
    );
    return { id: nextId, usuario, roles: rolesCreados };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Igual que crearParaCia, valida que el usuario y los roles pertenezcan a
// la compania activa antes de tocar nada -- usuarios no tiene id_cia
// propio, asi que "pertenecer a la cia" se prueba via una fila existente
// en usuarios_roles para esa cia (si no la tiene, no deberia ser editable
// desde esta cia aunque el id exista en la tabla usuarios global).
async function actualizarParaCia({ id, clave, idsRoles, idCia }) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existentes] = await conn.query(
      `SELECT 1 FROM usuarios_roles ur
       JOIN usuarios u ON u.id = ur.id_usuario
       WHERE ur.id_usuario = ? AND ur.id_cia = ? AND u.activo = 1
       LIMIT 1 FOR UPDATE`,
      [id, idCia]
    );
    if (existentes.length === 0) {
      const err = new Error('Usuario no encontrado en esta compañía');
      err.status = 404;
      throw err;
    }

    const [rolesValidos] = await conn.query(
      'SELECT id FROM roles WHERE id_cia = ? AND id IN (?) AND activo = 1',
      [idCia, idsRoles]
    );
    if (rolesValidos.length !== idsRoles.length) {
      const err = new Error('Uno o más roles no pertenecen a la compañía activa');
      err.status = 400;
      throw err;
    }

    if (clave) {
      const hash = await bcrypt.hash(clave, BCRYPT_SALT_ROUNDS);
      await conn.query('UPDATE usuarios SET clave = ? WHERE id = ?', [hash, id]);
    }

    await conn.query('DELETE FROM usuarios_roles WHERE id_usuario = ? AND id_cia = ?', [
      id,
      idCia,
    ]);
    for (const idRol of idsRoles) {
      await conn.query(
        'INSERT INTO usuarios_roles (id_usuario, id_rol, id_cia) VALUES (?, ?, ?)',
        [id, idRol, idCia]
      );
    }

    await conn.commit();

    const [[usuarioRow]] = await db.query('SELECT id, usuario FROM usuarios WHERE id = ?', [id]);
    const [rolesActualizados] = await db.query(
      'SELECT id, descripcion FROM roles WHERE id_cia = ? AND id IN (?)',
      [idCia, idsRoles]
    );
    return { id: usuarioRow.id, usuario: usuarioRow.usuario, roles: rolesActualizados };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Baja logica (RC-06 no admite DELETE fisico: usuarios_roles,
// auditoria_acciones, etc. referencian la fila). No valida "pertenece a
// idCia" via usuarios_roles porque desactivar es global al usuario (si
// tiene acceso a mas de una compania, queda inactivo para todas) --
// distinto de actualizarParaCia, que solo toca el set de roles de la
// compania activa.
async function desactivarParaCia({ id, idCia, idUsuarioSolicitante }) {
  if (id === idUsuarioSolicitante) {
    const err = new Error('No puedes desactivar tu propio usuario');
    err.status = 400;
    throw err;
  }

  const [existentes] = await db.query(
    `SELECT u.id, u.usuario FROM usuarios u
     JOIN usuarios_roles ur ON ur.id_usuario = u.id
     WHERE u.id = ? AND ur.id_cia = ? AND u.activo = 1
     LIMIT 1`,
    [id, idCia]
  );
  if (existentes.length === 0) {
    const err = new Error('Usuario no encontrado en esta compañía');
    err.status = 404;
    throw err;
  }

  await db.query('UPDATE usuarios SET activo = 0 WHERE id = ?', [id]);
  return { id, usuario: existentes[0].usuario };
}

module.exports = { listarPorCia, crearParaCia, actualizarParaCia, desactivarParaCia };
