# ESPECIFICACIONES.md
## Aplicativo de Conciliación DIAN - SIESA — El Gigante del Hogar

Consolidado a partir de: REQ-002 (Formato Levantamiento de Requerimiento,
v001, 23/02/2026), DER v3.0, DET (Fase 2), DDT (Fase 2 - Normalización
Total) y el diagrama entidad-relación entregado. Este documento es la
fuente de verdad funcional; el código y las decisiones técnicas deben
poder trazarse a un ID de requisito de aquí (RP-xx, RI-xx, RC-xx, RA-xx,
RR-xx).

> **Actualización — esquema oficial confirmado.** `Recibo_FE_Create.sql`
> (script DDL real) y su diagrama ER correspondiente son ahora la **fuente
> de verdad del modelo de datos**, reemplazando el diagrama preliminar y
> las tablas propuestas en el DDT "Fase 2 - Normalización Total"
> (`proc_facturas_entrantes`, `proc_factura_items`,
> `sys_auditoria_acciones`), que **no existen** en el script oficial y se
> consideran descartadas salvo decisión explícita en contrario. La
> sección 7 se reescribió sobre el script real.

---

## 1. Objetivo y alcance (REQ-002)

Prioridad: **Media** · Impacto: **Alto** · Proyecto nuevo (no aplicativo
existente).

Problema actual: dispersión de canales (correo, portal DIAN, físico, ERP)
sin integración, registro manual, traslado físico de documentos, sin
metodología de conciliación estandarizada, ~6.000 documentos/mes con
riesgo de errores/duplicidad.

Áreas de impacto: Compras comercial, Costos, Contabilidad, Proveedores
(como fuente de información).

Fuentes de datos iniciales: buzón de correo electrónico, **UnoE Siesa**
(ERP).

---

## 2. Requisitos del Proceso (RP)

| ID | Requisito |
|---|---|
| RP-01 | Recepción centralizada. Se desactiva cualquier carga manual dispersa; solo el buzón oficial y la carga de Excel autorizada alimentan el sistema. |
| RP-02 | Reducción de intervención manual. Registro en SIESA automático tras validar la OC; el usuario solo "Aprueba" o "Corrige". |
| RP-03 | Trazabilidad punta a punta: ID del mensaje de correo, XML extraído, ID de transacción en SIESA, ID de causación final. |
| RP-04 | Integración obligatoria vía Web Services de SIESA (módulos Compras y Contabilidad). |
| RP-05 | Insumos Excel para canales alternos excepcionales, con las mismas reglas de validación que el XML. |
| RP-06 | Escaneo del buzón cada **10 minutos**, entre **07:00 y 19:00**. |
| RP-07 | Un documento debe verse en el aplicativo ≤ **2 minutos** después de detectado en el buzón. |
| RP-08 | Tras validación en el aplicativo, el envío a SIESA es **inmediato/síncrono**. |

---

## 3. Requisitos de Información (RI)

**RI-01 — Extracción UBL 2.1 del XML de factura electrónica:**

| Tag UBL 2.1 | Dato |
|---|---|
| `cac:AccountingSupplierParty` | NIT y nombre del proveedor |
| `cbc:ID` | Número de factura |
| `cac:InvoiceLine` | Descripción, cantidad, valor unitario (por línea/ítem) |
| `cac:TaxTotal` | IVA e ICA |
| `cac:OrderReference` | ID de la Orden de Compra referenciada |

- RI-02: la base de datos del aplicativo es la **única fuente permitida**
  para auditoría de conciliación (no Excel sueltos, no ERP directo).
- RI-03/04: carga de Excel — columnas obligatorias mínimas:
  `NIT_PROVEEDOR`, `FACTURA`, `VALOR_TOTAL`, `CANTIDAD_TOTAL`. Si faltan,
  el sistema **rechaza el archivo**. Si el nombre de columna no coincide
  exactamente, el sistema debe permitir **mapeo manual** (ej.
  `Num_Fact` → `numero_factura`), vía librería `xlsx`/SheetJS.

---

## 4. Requisitos de Control y Validación (RC)

| ID | Requisito |
|---|---|
| RC-01 | Comparar `InvoiceLine` del XML vs. ítem de la OC en SIESA. |
| RC-02 | Alertas visuales: **Rojo** = diferencia > 0.01% en valor total; **Amarillo** = diferencia en cantidades pero valor total coincide. |
| RC-03 | Botón "Validar" habilitado solo si el sistema no detecta inconsistencias críticas. |
| RC-04 | Duplicidad: comparar `NIT + Prefijo + Número` contra histórico; si existe, mover a carpeta "Duplicados" + alerta. |
| RC-05 | Conciliación Excel: cruce manual por número de factura + NIT contra la tabla de Facturas Recibidas. |
| RC-06 | Log de auditoría de toda acción: usuario, fecha, tipo de operación (creación/modificación/validación/contabilización), IP, `data_before`/`data_after`. |

**Condiciones operativas adicionales (REQ-002):**
- Si la FE **tiene** OC → validación automática con desviaciones mostradas.
- Si la FE **no tiene** OC → se muestra en el listado sin comparación, pero
  se marca "Sin Validación de Compra" y requiere **aprobación manual de un
  supervisor** (regla DER §6).
- En todos los casos se garantiza trazabilidad del estado, tenga o no OC.

---

## 5. Requisitos de Automatización (RA)

| ID | Requisito |
|---|---|
| RA-01 | Parser automático XML → JSON. |
| RA-02/03 | Al validar, disparar el WS de SIESA para crear "Entrada de Almacén". |
| RA-04 | Tras Entrada de Almacén exitosa, generar la causación contable automáticamente en SIESA. |

Algoritmo de conciliación (`validateInvoice(invoiceId)`, DET §2), sobre el
esquema oficial:
1. Cargar `detalles_facturas` (líneas de la FE, `id_factura`) + la OC
   correspondiente (`detalles_ordenes_compras`, vía
   `ordenes_compras.id_factura`) desde el WS de SIESA.
2. Iterar ítems del XML (`detalles_facturas.referencia_prov`), buscar
   coincidencia en SIESA por `cod_erp_item` (usando
   `equivalencias_proveedores` para traducir `referencia_prov` →
   `cod_erp_item`/`cod_erp_um`) o por descripción.
3. `if (detalles_facturas.cantidad > detalles_ordenes_compras.cantidad) → triggerAlert('CANTIDAD_EXCEDIDA')`
4. `if (detalles_facturas.vlr_unitario != detalles_ordenes_compras.vlr_unitario) → triggerAlert('PRECIO_DIFERENTE')`
5. Actualizar `facturas.id_estado` según el resultado, avanzando sobre la
   cadena definida en `estados_documentos` (ver §7.1) — no existe un ENUM
   de estado en texto libre; el estado es una FK a `estados_documentos.id`.

---

## 6. Requisitos de Reportes (RR)

| ID | Requisito |
|---|---|
| RR-01 | Consolidado tipo rejilla con filtros dinámicos: facturas recibidas, registradas, con novedades, detalle de inconsistencias, pendientes/faltantes. |
| RR-02 | Exportación a Excel con la misma estructura del reporte visual. |
| RR-03/04 | Datos "en línea" vía **WebSockets (Socket.io)** o Long Polling. |
| RR-05 | Línea de tiempo por factura: Correo Recibido → XML Parseado → OC Validada → En Elaboración SIESA → Contabilizado. |
| — | Reportes actualizados diariamente como mínimo; disponibilidad "cercana al real". |

---

## 7. Modelo de datos (oficial — `Recibo_FE_Create.sql`)

Fuente: script DDL `Recibo_FE_Create.sql` + diagrama ER oficial. Este es
el esquema real a migrar en `mysql-init/`; sustituye por completo al
diagrama preliminar y a las tablas propuestas en el DDT "Fase 2" de una
iteración anterior de este documento.

### 7.1 Catálogo y seguridad multiempresa
- **companias** (`id` PK autoincrement, `razon_social`, `cod_erp` varchar(3))
  — ancla multiempresa; ahora incluye su propio `cod_erp` de compañía en
  SIESA.
- **usuarios** (`id`, `usuario`, `clave`) — **sin `id_cia` propio**; el
  acceso multiempresa vive en `usuarios_roles`.
- **usuarios_roles** (PK compuesta `id_usuario, id_rol, id_cia`) — un
  usuario puede tener distintos roles por compañía.
- **roles** (PK compuesta `id, id_cia`, `descripcion`) — el rol está
  scopeado a compañía, no es global.
- **roles_permisos** (PK compuesta `id_rol, id_permiso, id_cia`).
- **permisos** (`id` autoincrement, `descripcion`) — catálogo global, sin
  `id_cia`.
- **parametros** (`id`, `id_cia` FK, `clave`, `descripcion`, `valor`).

### 7.2 Buzón / ingesta de correo
- **config_buzon_fe** (`id`, `id_cia` FK, `descripcion`, `protocolo`,
  `servidor`, `puerto`, `cifrado`, `usuario`, `clave`).
- **buzones** (`id`, `id_config_buzon` FK) → **correos** (`id`, `id_buzon`
  FK, `remitentes`, `destinatarios`, `asunto`, `mensaje`) →
  **adjuntos_correos** (`id`, `id_correo` FK, `nombre_archivo`,
  `extension`, `tipo`, `ruta`).

### 7.3 Proveedores
- **proveedores** (`id`, `id_cia` FK, `cod_erp`, `razon_social`,
  `cod_erp_sucursal`, `cod_erp_tipo_prov`, `cod_erp_cond_pago`).
- **equivalencias_proveedores** (`id`, `id_proveedor` FK,
  `referencia_prov`, `cod_erp_item`, `cod_erp_um`, `cod_erp_um_precio`) —
  mapea la referencia/unidad del proveedor (como viene en la FE) al
  ítem/UM del ERP. **Clave para el algoritmo de conciliación** (RC-01):
  el cruce por SKU descrito en el DET debe pasar por esta tabla, no
  comparar `referencia_prov` directo contra `cod_erp_item`.

### 7.4 Facturas — 3 tablas separadas por origen del dato
El esquema oficial **no unifica** la factura en una sola tabla; separa el
dato tal como llega de cada fuente:

- **facturas** (`id`, `id_cia`, `id_proveedor` FK, `prefijo_fe`,
  `consecutivo_fe`, `fecha_fe`, `fecha_vencimiento`, `referencia_oc`,
  `id_correo` FK, `valor_neto_fe`, `notas_fe`, `id_estado` FK →
  `estados_documentos`, `vlr_bruto`, `vlr_descuentos`, `vlr_impuestos`,
  `vlr_neto`, `vlr_retenciones`, `vlr_total`).
  `UNIQUE(id_cia, id_proveedor, prefijo_fe, consecutivo_fe)` — esta es la
  llave de negocio para **RC-04 (duplicidad)**, más estricta que "NIT +
  Prefijo + Número" (usa `id_proveedor` en vez de NIT crudo, y añade
  `id_cia`). Comentario del script: *"al momento de importar se debe
  cargar el documento cpp"* (documento SIESA de causación/cuenta por
  pagar).
- **facturas_dian** (`id`, `id_cia`, `nombre_emisor`, `nit_emisor`,
  `prefijo_fe`, `consecutivo_fe`, `fecha_emision`, `fecha_recepcion`,
  `nit_receptor`, `nombre_receptor`, `vlr_iva`, `vlr_ica`, `vlr_ic`,
  `vlr_inc`, `vlr_total`). `UNIQUE(id_cia, nit_emisor, prefijo_fe,
  consecutivo_fe)`. Este es el **espejo fiel de lo que trae el XML UBL
  2.1** (RI-01: NIT/nombre emisor y receptor, impuestos IVA/ICA/IC/INC).
  No tiene FK hacia `facturas` en el script — la relación entre ambas
  debe hacerse por la llave de negocio (`nit_emisor`≈`proveedor`,
  `prefijo_fe`, `consecutivo_fe`), a resolver en la capa de servicio.
- **facturas_erp** (`id`, `id_cia`, `id_proveedor` FK, `fecha`,
  `cod_erp_co`, `cod_erp_tipo_docto`, `cod_erp_consecutivo_docto`,
  `prefijo_fe_prov`, `consecutivo_fe_prov`, `vlr_bruto`,
  `vlr_descuentos`, `vlr_impuestos`, `vlr_neto`, `vlr_retencion`,
  `vlr_total`) — espejo de lo que **SIESA reporta** una vez causado el
  documento (consecutivo ERP, tipo de documento).
- **detalles_facturas** (`id`, `id_factura` FK → `facturas`,
  `referencia_prov`, `descripcion`, `cantidad`, `vlr_unitario`,
  `porc_descuento`, `vlr_descuento`, `porc_impuesto`, `vlr_impuestos`,
  `vlr_neto`, `notas`) — líneas de la factura, cuelgan de `facturas`
  (no de `facturas_dian`).

> ⚠️ **A validar con el equipo**: `facturas.notas_fe` está tipado
> `int(10)` en el script (no `varchar`), lo que sugiere que podría ser un
> FK pendiente de nombrar en vez de un campo de texto libre. Confirmar
> antes de mapearlo en el ORM/modelos.

### 7.5 Órdenes de compra y entradas de almacén
- **ordenes_compras** (`id`, `id_cia`, `id_proveedor`, `fecha`,
  `cod_erp_co`, `cod_erp_tipo_docto`, `cod_erp_consecutivo`,
  `id_factura` FK → `facturas`, `vlr_bruto`, `vlr_descuento`,
  `vlr_impuestos`, `vlr_neto`, `vlr_retencion`, `vlr_total`) →
  **detalles_ordenes_compras** (`id`, `id_orden_compra` FK,
  `cod_erp_item`, `cod_erp_um`, `cod_erp_um_precio`, `cantidad`,
  `vlr_unitario`, `vlr_bruto`, `vlr_descuento`, `vlr_impuestos`,
  `vlr_neto`).
  > ⚠️ **Inconsistencia detectada en el script**: la FK
  > `ordenes_compras.id_proveedor` apunta a `facturas_erp(id)`, **no** a
  > `proveedores(id)` (`FKordenes_co550294`). Si esto no es intencional,
  > es un bug del DDL a corregir antes de generar el modelo ORM — de lo
  > contrario cualquier join "orden de compra → proveedor" quedará mal
  > resuelto. Señalarlo al responsable de la BD antes de programar el
  > adaptador SIESA.
  > ✅ **CORREGIDO**: `ordenes_compras.id_factura` pasó de `NOT NULL` a
  > nullable (la FK `FKordenes_co84844` sigue apuntando a `facturas(id)`,
  > ahora sobre una columna que admite `NULL`) — en el flujo real del
  > negocio la orden de compra suele registrarse antes de que llegue la
  > factura electrónica asociada, o de forma independiente a ella, así
  > que exigir `id_factura` desde el inicio bloqueaba la inserción de la
  > OC. Ver `mysql-init/01_schema.sql`.
- **entradas_almacen** (`id`, `id_cia`, `id_factura` FK → `facturas`,
  `id_proveedor` FK → `proveedores`, `cod_erp_co`, `cod_erp_tipo_docto`,
  `cod_erp_consec_docto`, `id_estado` FK → `estados_documentos`, `notas`,
  `cod_erp_tipo_docto_oc`, `cod_erp_consecutivo_oc`) — comentario del
  script: *"al momento de cargar debe usarse el documento eac"* (entrada
  de almacén SIESA). El campo **`notas`** de esta tabla es el candidato
  natural para poblar la columna **"Novedades"** del dashboard (RR-01,
  DET §3 — errores del WS de SIESA), ya que no existe una tabla
  `Novedades` separada en el script oficial.
- **detalles_entrada_almacen** (`id`, `id_entrada_almacen` FK,
  `cod_erp_item`, `cod_erp_um`, `cod_erp_um_precio`, `cantidad`,
  `vlr_bruto`, `notas`).

### 7.6 Estados (máquina de estados) y auditoría
- **estados_documentos** (`id`, `descripcion`, `id_estado_siguiente` FK
  a sí misma) — reemplaza el `ENUM estado_actual` que se había propuesto
  antes: el estado de `facturas.id_estado` y `entradas_almacen.id_estado`
  es una **FK a un catálogo encadenado** (cada estado apunta a su
  siguiente estado válido), no un texto libre. El flujo RR-05 ("Correo
  Recibido" → "XML Parseado" → "OC Validada" → "En Elaboración SIESA" →
  "Contabilizado") debe modelarse como filas de `estados_documentos`
  encadenadas por `id_estado_siguiente`; el estado `'0' = En Elaboración`
  de SIESA (regla de negocio, DER §6) debe existir como una fila aquí.

> ⚠️ **Vacío importante — RC-06 (log de auditoría) sin tabla en el
> script oficial.** No existe ninguna tabla `sys_log` / `auditoria` en
> `Recibo_FE_Create.sql`. RC-06 exige registrar usuario, fecha, tipo de
> operación, IP y `data_before`/`data_after` para cada acción sobre un
> documento — **esta tabla debe diseñarse y agregarse** a
> `mysql-init/` antes de implementar el middleware de auditoría en
> backend. Sugerencia mínima compatible con el resto del esquema:
> `auditoria_acciones(id, id_cia, id_usuario FK→usuarios, entidad,
> id_entidad, accion, ip_address, data_before JSON, data_after JSON,
> fecha DATETIME DEFAULT CURRENT_TIMESTAMP)`. Confirmar con el equipo de
> BD antes de crear el `CREATE TABLE` definitivo.

---

## 8. Arquitectura de ejecución (BullMQ / colas)

1. **Activación**: el Scheduler (cron Node.js) o el frontend emite un
   mensaje para iniciar la conciliación → cola BullMQ.
2. **Procesador (Worker)**: toma el job y ejecuta `validateInvoice()`.
3. **Reintento persistente**: si falla al consumir un WS (ej. timeout),
   BullMQ reintenta con **backoff exponencial** (ej. 30s, 1m, 2m...) hasta
   éxito o hasta alcanzar el **límite máximo configurable** de reintentos.

Manejo de errores por severidad:
- **No bloqueante** (ej. falla puntual de vectorización/parsing de un
  adjunto): log + continuar, no detiene el resto del batch.
- **Bloqueante / crítico** (falla de conexión SIESA o MySQL): detiene el
  flujo del documento afectado y dispara **alerta por email** (SMTP —
  credencial pendiente de configurar en el backend).

---

## 9. Reglas de negocio específicas (DER §6)

- Estado **"En Elaboración"** (`Estado: '0'` en SIESA) es obligatorio:
  permite que contabilidad revise antes del cierre definitivo.
- **Factura sin OC**: se permite el registro, se marca "Sin Validación de
  Compra", requiere **aprobación manual de un supervisor**.
- El buzón oficial de recepción de FE es el actualmente asignado al área
  de contabilidad (usado por el contador de la organización) —
  configurable vía `config_buzon_fe`, no hardcodeado.
- Documentos generados automáticamente vía integración ERP deben quedar en
  estado "elaboración", nunca contabilizados directamente sin validación.

---

## 10. Herramientas de Documentación (MCP)
- **Context7**: Utiliza siempre `query-docs` para verificar sintaxis de
  librerías externas (React, Next, Material UI, MySQL, Node.js) antes de
  proponer cambios en el código. No asumas conocimientos previos si la
  librería tiene documentación disponible en este MCP.

---

## 11. Fuera de alcance / pendiente de definición

- Prototipos de pantallas y fórmulas: **no incluidos en REQ-002** (secciones
  vacías en el formato original) — a definir en fase de diseño UI.
- Responsable del requerimiento y fechas de aprobación/entrega: pendientes
  de diligenciar en el formato original.
- **Tabla de auditoría (RC-06) inexistente** en el script oficial — diseñar
  y agregar antes de implementar trazabilidad (ver §7.6).
- **FK sospechosa** `ordenes_compras.id_proveedor → facturas_erp(id)` en
  vez de `proveedores(id)` — confirmar si es error del DDL (ver §7.5).
- **`facturas.notas_fe` tipado `int(10)`** — confirmar si es FK pendiente
  de nombrar o error de tipo (ver §7.4).
- Definir cómo se relacionan `facturas` ↔ `facturas_dian` ↔ `facturas_erp`
  a nivel de servicio, dado que el script no las une con FK directa
  (ver §7.4).
