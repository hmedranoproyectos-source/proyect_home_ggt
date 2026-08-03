USE `conciliacion-fe`;

CREATE TABLE adjuntos_correos (
  id             int(10) NOT NULL,
  id_correo      int(10) NOT NULL,
  nombre_archivo varchar(255) NOT NULL,
  extension      varchar(10) NOT NULL,
  tipo           varchar(30) NOT NULL,
  ruta           varchar(255) NOT NULL,
  PRIMARY KEY (id));
CREATE TABLE buzones (
  id              int(10) NOT NULL,
  id_config_buzon int(10) NOT NULL,
  carpeta         varchar(255) NOT NULL,
  PRIMARY KEY (id));
CREATE TABLE companias (
  id           int(10) NOT NULL AUTO_INCREMENT,
  razon_social varchar(255) NOT NULL,
  cod_erp      varchar(3) NOT NULL,
  PRIMARY KEY (id));
CREATE TABLE config_buzon_fe (
  id          int(10) NOT NULL,
  id_cia      int(10) NOT NULL,
  descripcion varchar(255) NOT NULL,
  protocolo   varchar(255) NOT NULL,
  servidor    varchar(255) NOT NULL,
  puerto      int(10) NOT NULL,
  cifrado     varchar(255) NOT NULL,
  usuario     varchar(255) NOT NULL,
  clave       varchar(255) NOT NULL,
  PRIMARY KEY (id));
CREATE TABLE correos (
  id            int(10) NOT NULL,
  id_buzon      int(10) NOT NULL,
  remitentes    varchar(255) NOT NULL,
  destinatarios varchar(255) NOT NULL,
  asunto        varchar(255),
  mensaje       varchar(255),
  PRIMARY KEY (id));
CREATE TABLE detalles_entrada_almacen (
  id                 int(10) NOT NULL,
  id_entrada_almacen int(10) NOT NULL,
  cod_erp_item       int(10) NOT NULL,
  cod_erp_um         varchar(4) NOT NULL,
  cod_erp_um_precio  varchar(4) NOT NULL,
  cantidad           decimal(10, 3) NOT NULL,
  vlr_bruto          decimal(20, 2) NOT NULL comment 'cantidad*vlr_unitario',
  notas              varchar(255) NOT NULL,
  PRIMARY KEY (id));
CREATE TABLE detalles_facturas (
  id              int(10) NOT NULL,
  id_factura      int(10) NOT NULL,
  referencia_prov varchar(255) NOT NULL,
  descripcion     varchar(255) NOT NULL,
  cantidad        decimal(10, 3) NOT NULL,
  vlr_unitario    decimal(20, 2) NOT NULL,
  porc_descuento  decimal(4, 2),
  vlr_descuento   decimal(20, 2) NOT NULL,
  porc_impuesto   decimal(4, 2),
  vlr_impuestos   decimal(20, 2) NOT NULL,
  vlr_neto        decimal(20, 2) NOT NULL,
  notas           varchar(255),
  PRIMARY KEY (id));
CREATE TABLE detalles_ordenes_compras (
  id                int(10) NOT NULL,
  id_orden_compra   int(10) NOT NULL,
  cod_erp_item      int(10) NOT NULL,
  cod_erp_um        varchar(4) NOT NULL,
  cod_erp_um_precio varchar(4) NOT NULL,
  cantidad          decimal(10, 3) NOT NULL,
  vlr_unitario      decimal(20, 2) NOT NULL,
  vlr_bruto         decimal(20, 2) NOT NULL,
  vlr_descuento     decimal(20, 2) NOT NULL,
  vlr_impuestos     decimal(20, 2) NOT NULL,
  vlr_neto          decimal(20, 2) NOT NULL,
  PRIMARY KEY (id));
CREATE TABLE entradas_almacen (
  id                     int(10) NOT NULL,
  id_cia                 int(10) NOT NULL,
  id_factura             int(10) NOT NULL,
  id_proveedor           int(10) NOT NULL,
  cod_erp_co             varchar(3),
  cod_erp_tipo_docto     varchar(3),
  cod_erp_consec_docto   int(10),
  id_estado              int(10) NOT NULL,
  notas                  varchar(255),
  cod_erp_tipo_docto_oc  varchar(3) NOT NULL,
  cod_erp_consecutivo_oc int(10) NOT NULL,
  PRIMARY KEY (id)) comment='al momento de cargar debe usarse el documento eac';
CREATE TABLE equivalencias_proveedores (
  id                int(10) NOT NULL,
  id_proveedor      int(10) NOT NULL,
  referencia_prov   varchar(255) NOT NULL,
  cod_erp_item      int(10) NOT NULL,
  cod_erp_um        varchar(4) NOT NULL,
  cod_erp_um_precio varchar(4) NOT NULL,
  PRIMARY KEY (id));
CREATE TABLE estados_documentos (
  id                  int(10) NOT NULL,
  descripcion         varchar(100) NOT NULL,
  id_estado_siguiente int(10),
  PRIMARY KEY (id));
CREATE TABLE facturas (
  id                int(10) NOT NULL,
  id_cia            int(10) NOT NULL,
  id_proveedor      int(10) NOT NULL,
  prefijo_fe        varchar(10) NOT NULL,
  consecutivo_fe    int(10) NOT NULL,
  fecha_fe          date NOT NULL,
  fecha_vencimiento date,
  referencia_oc     varchar(50),
  id_correo         int(10) NOT NULL,
  valor_neto_fe     decimal(20, 2) NOT NULL,
  -- CORREGIDO: notas_fe es un campo de notas de texto libre (no un FK); estaba tipado int(10) en el script original
  notas_fe          varchar(255),
  id_estado         int(10) NOT NULL,
  vlr_bruto         decimal(20, 2) NOT NULL,
  vlr_descuentos    decimal(20, 2) NOT NULL,
  vlr_impuestos     decimal(20, 2) NOT NULL,
  vlr_neto          decimal(20, 2) NOT NULL comment 'Valor antes de retenciones',
  vlr_retenciones   decimal(20, 2) NOT NULL,
  vlr_total         decimal(20, 2) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT ct_clave_dian
    UNIQUE (id_cia, id_proveedor, prefijo_fe, consecutivo_fe)) comment='al momento de importar se debe cargar el documento cpp';
CREATE TABLE facturas_dian (
  id              int(10) NOT NULL,
  id_cia          int(10) NOT NULL,
  nombre_emisor   varchar(255) NOT NULL,
  nit_emisor      varchar(30) NOT NULL,
  prefijo_fe      varchar(10) NOT NULL,
  consecutivo_fe  int(10) NOT NULL,
  fecha_emision   date NOT NULL,
  fecha_recepcion date NOT NULL,
  nit_receptor    varchar(30) NOT NULL,
  nombre_receptor varchar(255) NOT NULL,
  vlr_iva         decimal(20, 2) NOT NULL,
  vlr_ica         decimal(20, 2) NOT NULL,
  vlr_ic          decimal(20, 2) NOT NULL,
  vlr_inc         decimal(20, 2) NOT NULL,
  vlr_total       decimal(20, 2) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT ct_clave_dian1
    UNIQUE (id_cia, nit_emisor, prefijo_fe, consecutivo_fe));
CREATE TABLE facturas_erp (
  id                        int(10) NOT NULL,
  id_cia                    int(10) NOT NULL,
  id_proveedor              int(10) NOT NULL,
  fecha                     date NOT NULL,
  cod_erp_co                varchar(3) NOT NULL,
  cod_erp_tipo_docto        varchar(4) NOT NULL,
  cod_erp_consecutivo_docto int(10) NOT NULL,
  prefijo_fe_prov           varchar(10) NOT NULL,
  consecutivo_fe_prov       int(10) NOT NULL,
  vlr_bruto                 decimal(20, 2) NOT NULL,
  vlr_descuentos            decimal(20, 2) NOT NULL,
  vlr_impuestos             decimal(20, 2) NOT NULL,
  vlr_neto                  decimal(20, 2) NOT NULL,
  vlr_retencion             decimal(20, 2) NOT NULL,
  vlr_total                 decimal(20, 2) NOT NULL,
  PRIMARY KEY (id));
CREATE TABLE ordenes_compras (
  id                  int(10) NOT NULL,
  id_cia              int(10) NOT NULL,
  id_proveedor        int(10) NOT NULL,
  fecha               date NOT NULL,
  cod_erp_co          varchar(3) NOT NULL,
  cod_erp_tipo_docto  varchar(4) NOT NULL,
  cod_erp_consecutivo int(10) NOT NULL,
  -- CORREGIDO: id_factura ahora nullable — una OC puede existir antes de que llegue la factura asociada
  id_factura          int(10) NULL,
  vlr_bruto           decimal(20, 2) NOT NULL,
  vlr_descuento       decimal(20, 2) NOT NULL,
  vlr_impuestos       decimal(20, 2) NOT NULL,
  vlr_neto            decimal(20, 2) NOT NULL,
  vlr_retencion       decimal(20, 2) NOT NULL,
  vlr_total           decimal(20, 2) NOT NULL,
  PRIMARY KEY (id));
CREATE TABLE parametros (
  id          int(10) NOT NULL,
  id_cia      int(10) NOT NULL,
  clave       varchar(100) NOT NULL,
  descripcion varchar(255) NOT NULL,
  valor       varchar(255) NOT NULL,
  PRIMARY KEY (id));
CREATE TABLE permisos (
  id          int(10) NOT NULL AUTO_INCREMENT,
  descripcion varchar(255) NOT NULL,
  PRIMARY KEY (id));
CREATE TABLE proveedores (
  id                int(10) NOT NULL AUTO_INCREMENT,
  id_cia            int(10) NOT NULL,
  cod_erp           varchar(50) NOT NULL,
  razon_social      varchar(255) NOT NULL,
  cod_erp_sucursal  varchar(3) NOT NULL,
  cod_erp_tipo_prov varchar(10),
  cod_erp_cond_pago varchar(3),
  PRIMARY KEY (id));
CREATE TABLE roles (
  id          int(10) NOT NULL,
  id_cia      int(10) NOT NULL,
  descripcion varchar(255) NOT NULL,
  PRIMARY KEY (id,
  id_cia));
CREATE TABLE roles_permisos (
  id_rol     int(10) NOT NULL,
  id_permiso int(10) NOT NULL,
  id_cia     int(10) NOT NULL,
  PRIMARY KEY (id_rol,
  id_permiso,
  id_cia));
CREATE TABLE usuarios (
  id      int(10) NOT NULL,
  usuario varchar(100) NOT NULL,
  clave   varchar(255) NOT NULL,
  PRIMARY KEY (id));
CREATE TABLE usuarios_roles (
  id_usuario int(10) NOT NULL,
  id_rol     int(10) NOT NULL,
  id_cia     int(10) NOT NULL,
  PRIMARY KEY (id_usuario,
  id_rol,
  id_cia));
ALTER TABLE buzones ADD CONSTRAINT FKbuzones394340 FOREIGN KEY (id_config_buzon) REFERENCES config_buzon_fe (id);
ALTER TABLE correos ADD CONSTRAINT FKcorreos339969 FOREIGN KEY (id_buzon) REFERENCES buzones (id);
ALTER TABLE facturas ADD CONSTRAINT FKfacturas746488 FOREIGN KEY (id_correo) REFERENCES correos (id);
ALTER TABLE detalles_facturas ADD CONSTRAINT FKdetalles_f886243 FOREIGN KEY (id_factura) REFERENCES facturas (id);
ALTER TABLE parametros ADD CONSTRAINT FKparametros262670 FOREIGN KEY (id_cia) REFERENCES companias (id);
ALTER TABLE config_buzon_fe ADD CONSTRAINT FKconfig_buz932205 FOREIGN KEY (id_cia) REFERENCES companias (id);
ALTER TABLE proveedores ADD CONSTRAINT FKproveedore833923 FOREIGN KEY (id_cia) REFERENCES companias (id);
ALTER TABLE facturas ADD CONSTRAINT FKfacturas1660 FOREIGN KEY (id_proveedor) REFERENCES proveedores (id);
ALTER TABLE entradas_almacen ADD CONSTRAINT FKentradas_a376665 FOREIGN KEY (id_factura) REFERENCES facturas (id);
ALTER TABLE detalles_entrada_almacen ADD CONSTRAINT FKdetalles_e411003 FOREIGN KEY (id_entrada_almacen) REFERENCES entradas_almacen (id);
ALTER TABLE equivalencias_proveedores ADD CONSTRAINT FKequivalenc320787 FOREIGN KEY (id_proveedor) REFERENCES proveedores (id);
ALTER TABLE roles ADD CONSTRAINT FKroles209043 FOREIGN KEY (id_cia) REFERENCES companias (id);
ALTER TABLE roles_permisos ADD CONSTRAINT FKroles_perm21533 FOREIGN KEY (id_rol, id_cia) REFERENCES roles (id, id_cia);
ALTER TABLE roles_permisos ADD CONSTRAINT FKroles_perm370664 FOREIGN KEY (id_permiso) REFERENCES permisos (id);
ALTER TABLE usuarios_roles ADD CONSTRAINT FKusuarios_r787468 FOREIGN KEY (id_usuario) REFERENCES usuarios (id);
ALTER TABLE usuarios_roles ADD CONSTRAINT FKusuarios_r673019 FOREIGN KEY (id_rol, id_cia) REFERENCES roles (id, id_cia);
ALTER TABLE adjuntos_correos ADD CONSTRAINT FKadjuntos_c956881 FOREIGN KEY (id_correo) REFERENCES correos (id);
ALTER TABLE facturas_erp ADD CONSTRAINT FKfacturas_e884701 FOREIGN KEY (id_cia) REFERENCES companias (id);
ALTER TABLE facturas ADD CONSTRAINT FKfacturas905890 FOREIGN KEY (id_cia) REFERENCES companias (id);
ALTER TABLE entradas_almacen ADD CONSTRAINT FKentradas_a887106 FOREIGN KEY (id_cia) REFERENCES companias (id);
ALTER TABLE entradas_almacen ADD CONSTRAINT FKentradas_a791337 FOREIGN KEY (id_proveedor) REFERENCES proveedores (id);
ALTER TABLE facturas_dian ADD CONSTRAINT FKfacturas_d833752 FOREIGN KEY (id_cia) REFERENCES companias (id);
ALTER TABLE detalles_ordenes_compras ADD CONSTRAINT FKdetalles_o183273 FOREIGN KEY (id_orden_compra) REFERENCES ordenes_compras (id);
ALTER TABLE ordenes_compras ADD CONSTRAINT FKordenes_co404714 FOREIGN KEY (id_cia) REFERENCES companias (id);
ALTER TABLE estados_documentos ADD CONSTRAINT FKestados_do763939 FOREIGN KEY (id_estado_siguiente) REFERENCES estados_documentos (id);
ALTER TABLE facturas ADD CONSTRAINT FKfacturas291443 FOREIGN KEY (id_estado) REFERENCES estados_documentos (id);
ALTER TABLE entradas_almacen ADD CONSTRAINT FKentradas_a887149 FOREIGN KEY (id_estado) REFERENCES estados_documentos (id);
ALTER TABLE facturas_erp ADD CONSTRAINT FKfacturas_e788932 FOREIGN KEY (id_proveedor) REFERENCES proveedores (id);
-- CORREGIDO: la FK apuntaba a facturas_erp(id); la relación correcta de ordenes_compras.id_proveedor es hacia proveedores(id)
ALTER TABLE ordenes_compras ADD CONSTRAINT FKordenes_co550294 FOREIGN KEY (id_proveedor) REFERENCES proveedores (id);
ALTER TABLE ordenes_compras ADD CONSTRAINT FKordenes_co84844 FOREIGN KEY (id_factura) REFERENCES facturas (id);
