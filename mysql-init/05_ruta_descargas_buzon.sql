-- 05_ruta_descargas_buzon.sql
--
-- La descarga a disco de los adjuntos de FE (RP-01/RI-01) necesita una
-- carpeta destino configurable por compania desde el frontend (tab Buzon),
-- ej. "C:\Documentos\DescargasFacturas". El esquema oficial
-- (Recibo_FE_Create.sql) no tiene esa columna en config_buzon_fe.
--
-- Este archivo NO modifica 01_schema.sql: el esquema oficial queda intacto
-- (mismo patron que 02_autoincrement_pipeline.sql y
-- 03_auditoria_acciones.sql).

USE `conciliacion-fe`;

ALTER TABLE config_buzon_fe
  ADD COLUMN ruta_descargas VARCHAR(255) NULL
    COMMENT 'Carpeta del sistema donde se guardan los adjuntos (xml/pdf) descargados del correo. Configurable desde tab Buzon.'
    AFTER clave;
