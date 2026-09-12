-- 02_autoincrement_pipeline.sql
--
-- El esquema oficial (Recibo_FE_Create.sql -> 01_schema.sql) declara las PK de
-- estas tablas como `id int(10) NOT NULL` sin AUTO_INCREMENT. Solo companias,
-- proveedores y permisos lo traen. Sin autoincremento, el Email Worker y el
-- parser UBL no pueden insertar: generar el id en la aplicacion con MAX(id)+1
-- produce colision de PK porque `backend` y `worker` escriben en paralelo.
--
-- Este archivo NO modifica 01_schema.sql: el esquema oficial queda intacto y
-- este cambio es revisable por separado por el equipo de BD (ver CLAUDE.md §4).
-- Pendiente de confirmar con ese equipo antes de promover a produccion.

USE `conciliacion-fe`;

-- MySQL rechaza MODIFY sobre una columna referenciada por una FK
-- (ERROR 1833) aunque el tipo base no cambie. Se desactiva la verificacion
-- solo durante el ALTER; las FK quedan intactas y se revalidan al reactivar.
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE correos           MODIFY id int(10) NOT NULL AUTO_INCREMENT;
ALTER TABLE adjuntos_correos  MODIFY id int(10) NOT NULL AUTO_INCREMENT;
ALTER TABLE facturas          MODIFY id int(10) NOT NULL AUTO_INCREMENT;
ALTER TABLE facturas_dian     MODIFY id int(10) NOT NULL AUTO_INCREMENT;
ALTER TABLE detalles_facturas MODIFY id int(10) NOT NULL AUTO_INCREMENT;

-- buzones / config_buzon_fe tambien se insertan desde el seed del pipeline.
ALTER TABLE config_buzon_fe   MODIFY id int(10) NOT NULL AUTO_INCREMENT;
ALTER TABLE buzones           MODIFY id int(10) NOT NULL AUTO_INCREMENT;

SET FOREIGN_KEY_CHECKS = 1;

-- RC-04 (duplicidad NIT + Prefijo + Numero): facturas ya trae la UNIQUE
-- ct_clave_dian (id_cia, id_proveedor, prefijo_fe, consecutivo_fe) y
-- facturas_dian la UNIQUE ct_clave_dian1 (id_cia, nit_emisor, prefijo_fe,
-- consecutivo_fe). El parser se apoya en esos indices existentes; no se crean
-- indices nuevos aqui.
