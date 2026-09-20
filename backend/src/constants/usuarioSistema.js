// Usuario tecnico usado como FK de atribucion en auditoria_acciones cuando
// una accion sensible la dispara un proceso en background (worker de
// conciliacion BullMQ) sin usuario autenticado detras. RC-06 exige
// auditoria_acciones.id_usuario NOT NULL, asi que no puede quedar en NULL.
//
// Sembrado por seeds/seedPipeline.js (seedUsuarioSistema). usuarios.id no
// tiene AUTO_INCREMENT y este usuario se crea con MAX(id)+1 (mismo patron
// que seedAuth.js para 'admin'), asi que NO tiene un id fijo conocido de
// antemano -- codigo que lo necesite debe resolverlo por nombre en runtime
// (ver services/usuarioSistemaService.js), no asumir un numero.
//
// Este usuario no tiene una contraseña real: su hash es aleatorio y no debe
// poder autenticarse por POST /api/auth/login.
const USUARIO_SISTEMA_NOMBRE = 'sistema';

module.exports = { USUARIO_SISTEMA_NOMBRE };
