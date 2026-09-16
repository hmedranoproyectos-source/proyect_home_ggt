const db = require('../config/db');

async function listarPorCia(idCia) {
  const [rows] = await db.query(
    'SELECT id, descripcion FROM roles WHERE id_cia = ? AND activo = 1 ORDER BY descripcion',
    [idCia]
  );
  return rows;
}

// roles.id no tiene AUTO_INCREMENT en el esquema oficial y su PK es
// compuesta (id, id_cia) -- mismo patron MAX(id)+1 que usuariosService,
// pero el id se calcula sobre toda la tabla (no solo la cia activa) para
// que un mismo id nunca quede repetido entre companias, evitando choques
// si en el futuro se relaja la unicidad de id_cia en la PK.
async function crearParaCia({ descripcion, idsPermisos, idCia }) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existentes] = await conn.query(
      'SELECT id FROM roles WHERE id_cia = ? AND descripcion = ? LIMIT 1 FOR UPDATE',
      [idCia, descripcion]
    );
    if (existentes.length > 0) {
      const err = new Error('Ya existe un rol con esa descripción en esta compañía');
      err.status = 409;
      throw err;
    }

    if (idsPermisos.length > 0) {
      const [permisosValidos] = await conn.query(
        'SELECT id FROM permisos WHERE id IN (?)',
        [idsPermisos]
      );
      if (permisosValidos.length !== idsPermisos.length) {
        const err = new Error('Uno o más permisos no existen en el catálogo');
        err.status = 400;
        throw err;
      }
    }

    const [[{ nextId }]] = await conn.query(
      'SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM roles'
    );

    await conn.query('INSERT INTO roles (id, id_cia, descripcion) VALUES (?, ?, ?)', [
      nextId,
      idCia,
      descripcion,
    ]);

    for (const idPermiso of idsPermisos) {
      await conn.query(
        'INSERT INTO roles_permisos (id_rol, id_permiso, id_cia) VALUES (?, ?, ?)',
        [nextId, idPermiso, idCia]
      );
    }

    await conn.commit();
    return { id: nextId, descripcion };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Devuelve null si el rol no existe o no pertenece a idCia -- el
// controller responde 404 en ese caso (no 403, para no filtrar
// existencia de roles de otras companias).
async function permisosDeRol(idRol, idCia) {
  const [rolRows] = await db.query(
    'SELECT 1 FROM roles WHERE id = ? AND id_cia = ? AND activo = 1 LIMIT 1',
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

// Reemplaza el set completo de permisos de un rol (no diff incremental,
// igual que actualizarParaCia en usuariosService) -- valida que el rol
// pertenezca a idCia antes de tocar nada (404, no 403, mismo criterio que
// permisosDeRol) y que los permisos nuevos existan en el catalogo global.
async function actualizarPermisos({ idRol, idsPermisos, idCia }) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rolRows] = await conn.query(
      'SELECT descripcion FROM roles WHERE id = ? AND id_cia = ? AND activo = 1 LIMIT 1 FOR UPDATE',
      [idRol, idCia]
    );
    if (rolRows.length === 0) {
      const err = new Error('Rol no encontrado');
      err.status = 404;
      throw err;
    }

    if (idsPermisos.length > 0) {
      const [permisosValidos] = await conn.query(
        'SELECT id FROM permisos WHERE id IN (?)',
        [idsPermisos]
      );
      if (permisosValidos.length !== idsPermisos.length) {
        const err = new Error('Uno o más permisos no existen en el catálogo');
        err.status = 400;
        throw err;
      }
    }

    await conn.query('DELETE FROM roles_permisos WHERE id_rol = ? AND id_cia = ?', [
      idRol,
      idCia,
    ]);
    for (const idPermiso of idsPermisos) {
      await conn.query(
        'INSERT INTO roles_permisos (id_rol, id_permiso, id_cia) VALUES (?, ?, ?)',
        [idRol, idPermiso, idCia]
      );
    }

    await conn.commit();

    const [permisosActualizados] = await db.query(
      'SELECT id, descripcion FROM permisos WHERE id IN (?)',
      [idsPermisos.length > 0 ? idsPermisos : [0]]
    );
    return { id: idRol, descripcion: rolRows[0].descripcion, permisos: permisosActualizados };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Baja logica -- bloquea la desactivacion si hay usuarios activos con ese
// rol en la compania (usuarios_roles), para que el admin reasigne el rol a
// esos usuarios explicitamente en vez de dejarlos con un rol fantasma sin
// darse cuenta. roles_permisos no se limpia: si el rol se reactiva alguna
// vez, conserva sus permisos.
async function desactivarParaCia({ idRol, idCia }) {
  const [rolRows] = await db.query(
    'SELECT descripcion FROM roles WHERE id = ? AND id_cia = ? AND activo = 1 LIMIT 1',
    [idRol, idCia]
  );
  if (rolRows.length === 0) {
    const err = new Error('Rol no encontrado');
    err.status = 404;
    throw err;
  }

  const [usuariosConRol] = await db.query(
    `SELECT COUNT(*) AS n FROM usuarios_roles ur
     JOIN usuarios u ON u.id = ur.id_usuario
     WHERE ur.id_rol = ? AND ur.id_cia = ? AND u.activo = 1`,
    [idRol, idCia]
  );
  if (usuariosConRol[0].n > 0) {
    const err = new Error(
      'No se puede eliminar el rol: hay usuarios activos con este rol asignado'
    );
    err.status = 409;
    throw err;
  }

  await db.query('UPDATE roles SET activo = 0 WHERE id = ? AND id_cia = ?', [idRol, idCia]);
  return { id: idRol, descripcion: rolRows[0].descripcion };
}

module.exports = {
  listarPorCia,
  permisosDeRol,
  crearParaCia,
  actualizarPermisos,
  desactivarParaCia,
};
