-- 03_auditoria_acciones.sql
--
-- RC-06 exige un log de auditoria de toda accion sensible (creacion,
-- modificacion, validacion, contabilizacion): usuario, fecha, tipo de
-- operacion, IP y data_before/data_after. Esta tabla NO existe en el
-- esquema oficial (Recibo_FE_Create.sql) -- ver ESPECIFICACIONES.md §7.6,
-- que la marca como "vacio importante" pendiente de diseñar.
--
-- Este archivo NO modifica 01_schema.sql: el esquema oficial queda intacto
-- (mismo patron que 02_autoincrement_pipeline.sql). Diseño y nombres de
-- columna pendientes de confirmar con el equipo de BD (CLAUDE.md §4) antes
-- de promover a produccion.

USE `conciliacion-fe`;

CREATE TABLE auditoria_acciones (
  id          int(10) NOT NULL AUTO_INCREMENT,
  id_cia      int(10) NOT NULL,
  id_usuario  int(10) NOT NULL,
  entidad     varchar(50) NOT NULL COMMENT 'nombre de tabla/recurso auditado, ej. facturas, entradas_almacen',
  id_entidad  int(10) NOT NULL COMMENT 'PK del registro afectado en `entidad`',
  accion      varchar(30) NOT NULL COMMENT 'creacion | modificacion | validacion | contabilizacion',
  ip_address  varchar(45) NOT NULL COMMENT 'IPv4 o IPv6 (req.ip / X-Forwarded-For)',
  data_before json NULL COMMENT 'estado previo del registro; NULL en accion=creacion',
  data_after  json NULL COMMENT 'estado nuevo del registro; NULL en accion=eliminacion si aplicara',
  fecha       datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_auditoria_entidad (id_cia, entidad, id_entidad),
  KEY ix_auditoria_usuario (id_usuario, fecha),
  CONSTRAINT FKauditoria_cia
    FOREIGN KEY (id_cia) REFERENCES companias (id),
  CONSTRAINT FKauditoria_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id)
) COMMENT='RC-06: log de auditoria de acciones sensibles sobre documentos';

-- Indices de lectura: el dashboard consulta por compania+entidad+registro
-- (linea de tiempo de una factura, RR-05) y por usuario+fecha (informes de
-- actividad). No se indexa `accion` sola: siempre se filtra junto a
-- entidad/id_entidad o usuario, nunca de forma aislada.
