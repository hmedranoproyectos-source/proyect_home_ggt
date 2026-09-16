require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../config/db');

const COMPANIA_DEFAULT = {
  razon_social: 'El Gigante del Hogar',
  cod_erp: '001',
};

const USUARIO_ADMIN = 'admin';
const ROL_DEFAULT_DESCRIPCION = 'Administrador';
const PERMISO_DEFAULT_DESCRIPCION = 'ver_facturas';
const BCRYPT_SALT_ROUNDS = 10;

// Catalogo de permisos "de negocio" que la UI de roles-usuarios espera
// (antes vivian hardcodeados en frontend/lib/datos-mock.ts). Se siembran
// aqui ademas de ver_facturas para que GET /api/permisos no devuelva un
// catalogo casi vacio.
const PERMISOS_NEGOCIO = [
  'Dashboard',
  'Bandeja de facturas',
  'Ingresar factura',
  'Informes',
  'Roles y usuarios',
  'Compañías',
  'gestionar_usuarios',
  'gestionar_roles',
  'gestionar_companias',
];

async function nextId(table, pkColumn = 'id') {
  const [rows] = await db.query(
    `SELECT COALESCE(MAX(${pkColumn}), 0) + 1 AS next FROM ${table}`
  );
  return rows[0].next;
}

async function getOrCreateCompania() {
  const [existentes] = await db.query(
    'SELECT id, razon_social FROM companias LIMIT 1'
  );
  if (existentes.length > 0) {
    console.log(
      `[seed] Usando compañía existente: ${existentes[0].razon_social} (id=${existentes[0].id})`
    );
    return existentes[0].id;
  }

  const [result] = await db.query(
    'INSERT INTO companias (razon_social, cod_erp) VALUES (?, ?)',
    [COMPANIA_DEFAULT.razon_social, COMPANIA_DEFAULT.cod_erp]
  );
  console.log(
    `[seed] Compañía creada: ${COMPANIA_DEFAULT.razon_social} (id=${result.insertId})`
  );
  return result.insertId;
}

async function getOrCreateUsuarioAdmin() {
  const [existentes] = await db.query(
    'SELECT id FROM usuarios WHERE usuario = ? LIMIT 1',
    [USUARIO_ADMIN]
  );
  if (existentes.length > 0) {
    console.log(`[seed] Usuario '${USUARIO_ADMIN}' ya existe (id=${existentes[0].id})`);
    return existentes[0].id;
  }

  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) {
    throw new Error('SEED_ADMIN_PASSWORD no está definida en el entorno');
  }

  const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const id = await nextId('usuarios');
  await db.query('INSERT INTO usuarios (id, usuario, clave) VALUES (?, ?, ?)', [
    id,
    USUARIO_ADMIN,
    hash,
  ]);
  console.log(`[seed] Usuario '${USUARIO_ADMIN}' creado (id=${id})`);
  return id;
}

async function getOrCreateRolAdministrador(idCia) {
  const [existentes] = await db.query(
    'SELECT id FROM roles WHERE id_cia = ? AND descripcion = ? LIMIT 1',
    [idCia, ROL_DEFAULT_DESCRIPCION]
  );
  if (existentes.length > 0) {
    console.log(
      `[seed] Rol '${ROL_DEFAULT_DESCRIPCION}' ya existe para id_cia=${idCia} (id=${existentes[0].id})`
    );
    return existentes[0].id;
  }

  const id = await nextId('roles');
  await db.query(
    'INSERT INTO roles (id, id_cia, descripcion) VALUES (?, ?, ?)',
    [id, idCia, ROL_DEFAULT_DESCRIPCION]
  );
  console.log(
    `[seed] Rol '${ROL_DEFAULT_DESCRIPCION}' creado para id_cia=${idCia} (id=${id})`
  );
  return id;
}

async function getOrCreatePermisoVerFacturas() {
  const [existentes] = await db.query(
    'SELECT id FROM permisos WHERE descripcion = ? LIMIT 1',
    [PERMISO_DEFAULT_DESCRIPCION]
  );
  if (existentes.length > 0) {
    console.log(
      `[seed] Permiso '${PERMISO_DEFAULT_DESCRIPCION}' ya existe (id=${existentes[0].id})`
    );
    return existentes[0].id;
  }

  const [result] = await db.query(
    'INSERT INTO permisos (descripcion) VALUES (?)',
    [PERMISO_DEFAULT_DESCRIPCION]
  );
  console.log(
    `[seed] Permiso '${PERMISO_DEFAULT_DESCRIPCION}' creado (id=${result.insertId})`
  );
  return result.insertId;
}

async function getOrCreatePermiso(descripcion) {
  const [existentes] = await db.query(
    'SELECT id FROM permisos WHERE descripcion = ? LIMIT 1',
    [descripcion]
  );
  if (existentes.length > 0) {
    return existentes[0].id;
  }

  const [result] = await db.query(
    'INSERT INTO permisos (descripcion) VALUES (?)',
    [descripcion]
  );
  console.log(`[seed] Permiso '${descripcion}' creado (id=${result.insertId})`);
  return result.insertId;
}

async function ensureRolPermiso(idRol, idPermiso, idCia) {
  const [existentes] = await db.query(
    'SELECT 1 FROM roles_permisos WHERE id_rol = ? AND id_permiso = ? AND id_cia = ? LIMIT 1',
    [idRol, idPermiso, idCia]
  );
  if (existentes.length > 0) {
    console.log('[seed] Relación roles_permisos ya existe');
    return;
  }

  await db.query(
    'INSERT INTO roles_permisos (id_rol, id_permiso, id_cia) VALUES (?, ?, ?)',
    [idRol, idPermiso, idCia]
  );
  console.log('[seed] Relación roles_permisos creada');
}

async function ensureUsuarioRol(idUsuario, idRol, idCia) {
  const [existentes] = await db.query(
    'SELECT 1 FROM usuarios_roles WHERE id_usuario = ? AND id_rol = ? AND id_cia = ? LIMIT 1',
    [idUsuario, idRol, idCia]
  );
  if (existentes.length > 0) {
    console.log('[seed] Relación usuarios_roles ya existe');
    return;
  }

  await db.query(
    'INSERT INTO usuarios_roles (id_usuario, id_rol, id_cia) VALUES (?, ?, ?)',
    [idUsuario, idRol, idCia]
  );
  console.log('[seed] Relación usuarios_roles creada');
}

async function main() {
  const idCia = await getOrCreateCompania();
  const idUsuario = await getOrCreateUsuarioAdmin();
  const idRol = await getOrCreateRolAdministrador(idCia);
  const idPermiso = await getOrCreatePermisoVerFacturas();
  await ensureRolPermiso(idRol, idPermiso, idCia);
  await ensureUsuarioRol(idUsuario, idRol, idCia);

  for (const descripcion of PERMISOS_NEGOCIO) {
    const idPermisoNegocio = await getOrCreatePermiso(descripcion);
    await ensureRolPermiso(idRol, idPermisoNegocio, idCia);
  }

  console.log('[seed] Seed de autenticación completado.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed] Error ejecutando el seed:', err);
  process.exit(1);
});
