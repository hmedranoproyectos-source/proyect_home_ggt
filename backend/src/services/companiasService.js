const db = require('../config/db');

const ROL_ADMIN_DESCRIPCION = 'Administrador';

// Companias a las que el usuario autenticado tiene acceso via
// usuarios_roles (misma logica que authService.getCompaniasForUser, aqui
// se agrega cod_erp para que el frontend no necesite otra llamada).
async function listarParaUsuario(idUsuario) {
  const [rows] = await db.query(
    `SELECT DISTINCT c.id, c.razon_social, c.cod_erp
     FROM usuarios_roles ur
     JOIN companias c ON c.id = ur.id_cia AND c.activo = 1
     JOIN roles r ON r.id = ur.id_rol AND r.id_cia = ur.id_cia AND r.activo = 1
     WHERE ur.id_usuario = ?
     ORDER BY c.razon_social`,
    [idUsuario]
  );
  return rows;
}

// companias.id SI tiene AUTO_INCREMENT en el esquema oficial (a diferencia
// de usuarios/roles) -- no hace falta el patron MAX(id)+1 aqui.
//
// Una compania recien creada queda invisible para todos (listarParaUsuario
// filtra por usuarios_roles) a menos que alguien tenga acceso -- por eso se
// crea junto con un rol "Administrador" con TODOS los permisos del
// catalogo global y se asigna al usuario creador, mismo patron que
// seedAuth.js. roles.id tampoco tiene AUTO_INCREMENT, mismo MAX(id)+1 que
// rolesService.crearParaCia.
async function crearParaUsuario({ razonSocial, codErp, idUsuario }) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existentes] = await conn.query(
      'SELECT id FROM companias WHERE cod_erp = ? AND activo = 1 LIMIT 1 FOR UPDATE',
      [codErp]
    );
    if (existentes.length > 0) {
      const err = new Error('Ya existe una compañía con ese código ERP');
      err.status = 409;
      throw err;
    }

    const [result] = await conn.query(
      'INSERT INTO companias (razon_social, cod_erp) VALUES (?, ?)',
      [razonSocial, codErp]
    );
    const idCia = result.insertId;

    const [[{ nextId }]] = await conn.query(
      'SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM roles'
    );
    await conn.query('INSERT INTO roles (id, id_cia, descripcion) VALUES (?, ?, ?)', [
      nextId,
      idCia,
      ROL_ADMIN_DESCRIPCION,
    ]);

    const [permisos] = await conn.query('SELECT id FROM permisos');
    for (const permiso of permisos) {
      await conn.query(
        'INSERT INTO roles_permisos (id_rol, id_permiso, id_cia) VALUES (?, ?, ?)',
        [nextId, permiso.id, idCia]
      );
    }

    await conn.query(
      'INSERT INTO usuarios_roles (id_usuario, id_rol, id_cia) VALUES (?, ?, ?)',
      [idUsuario, nextId, idCia]
    );

    await conn.commit();
    return { id: idCia, razonSocial, codErp };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Baja logica. No se permite desactivar la compania que el solicitante
// tiene activa en su sesion actual (req.user.id_cia) -- se quedaria sin
// poder seguir operando sobre la compania que acaba de desactivar hasta
// cambiar de sesion, un estado confuso que es mejor bloquear explicito.
async function desactivar({ idCia, idCiaSolicitante, idUsuarioSolicitante }) {
  if (idCia === idCiaSolicitante) {
    const err = new Error('No puedes eliminar la compañía activa en tu sesión actual');
    err.status = 400;
    throw err;
  }

  const [existentes] = await db.query(
    `SELECT c.id, c.razon_social FROM companias c
     JOIN usuarios_roles ur ON ur.id_cia = c.id
     WHERE c.id = ? AND c.activo = 1 AND ur.id_usuario = ?
     LIMIT 1`,
    [idCia, idUsuarioSolicitante]
  );
  if (existentes.length === 0) {
    const err = new Error('Compañía no encontrada');
    err.status = 404;
    throw err;
  }

  await db.query('UPDATE companias SET activo = 0 WHERE id = ?', [idCia]);
  return { id: idCia, razonSocial: existentes[0].razon_social };
}

module.exports = { listarParaUsuario, crearParaUsuario, desactivar };
