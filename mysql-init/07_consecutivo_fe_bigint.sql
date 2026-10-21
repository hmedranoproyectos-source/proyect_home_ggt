-- 07_consecutivo_fe_bigint.sql
--
-- El esquema oficial (Recibo_FE_Create.sql -> 01_schema.sql) declara
-- consecutivo_fe como `int(10)` (max 2.147.483.647). Hay proveedores cuyo
-- numero de factura supera ese rango (ej. consecutivos largos tipo
-- "P0641717568" o numeraciones con fecha embebida), y el INSERT fallaba con
-- "Out of range value for column 'consecutivo_fe'": el correo completo se
-- reintentaba en cada escaneo sin poder ingerirse.
--
-- Se ensanchan a BIGINT las tres columnas que guardan el consecutivo de la
-- FE (facturas, facturas_dian y facturas_erp.consecutivo_fe_prov, esta ultima
-- para que el cruce contra SIESA use el mismo tipo). Los UNIQUE de RC-04
-- (ct_clave_dian, ct_clave_dian1) se reconstruyen solos con el MODIFY.
--
-- Este archivo NO modifica 01_schema.sql: el esquema oficial queda intacto y
-- este cambio es revisable por separado por el equipo de BD (ver CLAUDE.md §4).
-- Pendiente de confirmar con ese equipo antes de promover a produccion.

USE `conciliacion-fe`;

ALTER TABLE facturas      MODIFY consecutivo_fe      bigint NOT NULL;
ALTER TABLE facturas_dian MODIFY consecutivo_fe      bigint NOT NULL;
ALTER TABLE facturas_erp  MODIFY consecutivo_fe_prov bigint NOT NULL;
