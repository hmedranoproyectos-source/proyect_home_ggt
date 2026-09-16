-- 04_estado_activo.sql
--
-- El esquema oficial (Recibo_FE_Create.sql -> 01_schema.sql) no tiene
-- columna de estado en usuarios, roles ni companias -- "eliminar" en la UI
-- de administracion (Roles y usuarios) se implementa como baja logica
-- (soft delete), nunca DELETE fisico, para no romper FKs existentes
-- (usuarios_roles, roles_permisos, auditoria_acciones, etc. referencian
-- estas filas) ni perder el historial de auditoria RC-06.
--
-- Este archivo NO modifica 01_schema.sql: el esquema oficial queda intacto
-- (mismo patron que 02_autoincrement_pipeline.sql y
-- 03_auditoria_acciones.sql). Pendiente de confirmar con el equipo de BD
-- (CLAUDE.md §4) antes de promover a produccion.

USE `conciliacion-fe`;

ALTER TABLE usuarios  ADD COLUMN activo tinyint(1) NOT NULL DEFAULT 1;
ALTER TABLE roles     ADD COLUMN activo tinyint(1) NOT NULL DEFAULT 1;
ALTER TABLE companias ADD COLUMN activo tinyint(1) NOT NULL DEFAULT 1;

-- Los listados de administracion (GET /api/usuarios, /api/roles,
-- /api/companias) filtran por activo = 1; el DELETE de cada recurso hace
-- UPDATE ... SET activo = 0 en vez de borrar la fila.
