-- 06_facturas_erp_pipeline.sql
--
-- El esquema oficial (Recibo_FE_Create.sql -> 01_schema.sql) declara
-- facturas_erp.id como `int(10) NOT NULL` sin AUTO_INCREMENT (mismo problema
-- que las tablas cubiertas por 02_autoincrement_pipeline.sql -- esta tabla
-- no estaba en esa lista porque en ese momento no tenia todavia un pipeline
-- de escritura). facturasErpService.importarDesdeSiesa la llena ahora desde
-- el WS SIESA (listar_facturas_compras_proveedores), asi que necesita el
-- mismo tratamiento.
--
-- Este archivo NO modifica 01_schema.sql: el esquema oficial queda intacto y
-- este cambio es revisable por separado por el equipo de BD (ver CLAUDE.md §4).
-- Pendiente de confirmar con ese equipo antes de promover a produccion.

USE `conciliacion-fe`;

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE facturas_erp MODIFY id int(10) NOT NULL AUTO_INCREMENT;

SET FOREIGN_KEY_CHECKS = 1;

-- Dedupe: la consulta SIESA se corre a diario con una ventana de 1 mes
-- (hoy - 1 mes .. hoy), asi que el mismo documento aparece en varias
-- corridas seguidas mientras siga dentro de la ventana. facturas_erp no
-- trae ningun UNIQUE en el esquema oficial -- se agrega uno sobre la llave
-- de negocio real del documento ERP (compania + tipo de documento +
-- consecutivo del ERP, que es lo que identifica un documento en SIESA) para
-- que el INSERT choque y la fila se omita en vez de duplicarse, mismo
-- patron que ct_clave_dian1 en facturas_dian (RC-04).
ALTER TABLE facturas_erp
  ADD CONSTRAINT ct_clave_erp1
  UNIQUE (id_cia, cod_erp_tipo_docto, cod_erp_consecutivo_docto);
