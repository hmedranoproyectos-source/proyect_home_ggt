# Plano SIESA/UnoEE — Documento de Entradas y Devoluciones de Almacén

Estructura de archivo plano (ancho fijo) usada por SIESA/UnoEE para la
importación de **Entradas de Almacén** (clase 408) y **Devoluciones**
(clase 420, desde registro tipo 1215). Se transporta vía el mismo WS SOAP
ya adaptado en `backend/src/adapters/siesa/siesaService.js`
(`ImportarXMLAsync`, método `importarXML({ idCia, lineas })`) — cada
"línea" del array es un registro de este plano (451 o 470) serializado por
`xml2js` dentro de `<Datos><Linea>...`.

**Confirmado con negocio (2026-09-30):** el flujo de creación son **dos
llamadas separadas** a `ImportarXML`, no una sola con ambos registros en
el mismo lote:

1. Se envía **solo el registro 451** (documento). Se espera la respuesta
   de SIESA, que confirma el documento creado (consecutivo de documento,
   `f350_consec_docto`, entre otros datos de confirmación — pendiente
   confirmar exactamente qué trae `ImportarXMLResult`/`printTipoError` en
   este caso de uso específico, hoy solo se ve el shape de errores en
   `parseErrorDataSet`).
2. Solo tras esa respuesta exitosa, se arma y envía una **segunda
   llamada** con los registros **470** (uno por línea de detalle),
   referenciando el consecutivo de documento confirmado en el paso 1.

En MySQL aplica el mismo orden en dos pasos separados: insertar primero
la fila en `entradas_almacen` (tras éxito del paso 1 con SIESA), y solo
después insertar las filas en `detalles_entrada_almacen` (tras éxito del
paso 2).

## Registro tipo 451 — Documento (versión 02)

| Campo | Descripción | Tipo | Observaciones | Obl | Inicio | Tamaño | Total |
|---|---|---|---|---|---|---|---|
| `F_NUMERO-REG` | Número de registro | Numérico | Número consecutivo | Sí | 1 | 7 | 7 |
| `F_TIPO-REG` | Tipo de registro | Numérico | Valor fijo = 451 | Sí | 8 | 4 | 11 |
| `F_SUBTIPO-REG` | Subtipo de registro | Numérico | Valor fijo = 00 | Sí | 12 | 2 | 13 |
| `F_VERSION-REG` | Versión del tipo de registro | Numérico | Versión = 02 | Sí | 14 | 2 | 15 |
| `F_CIA` | Compañía | Numérico | Valida en maestro, código de la compañía a la cual pertenece la información del registro | Sí | 16 | 3 | 18 |
| `F_LIQUIDA_IMPUESTO` | Indicador para liquidar impuestos | Numérico | 0=No liquida impuestos, respeta los que están en el plano registro tipo 472. 1=Liquida impuestos con los parámetros del sistema (ítem y proveedor) en el momento de la importación; no tiene en cuenta los registros tipo 472 de este movimiento | Sí | 19 | 1 | 19 |
| `F_CONSEC_AUTO_REG` | Indica si el número consecutivo de documento es manual o automático | Numérico | 0=Manual, respeta el consecutivo asignado en el plano. 1=Automático, el consecutivo es recalculado con base en la tabla de consecutivos de documento | Sí | 20 | 1 | 20 |
| `f350_id_co` | Centro de operación | Alfanumérico | Valida en maestro, código de centro de operación del documento | Sí | 21 | 3 | 23 |
| `f350_id_tipo_docto` | Tipo de documento | Alfanumérico | Valida en maestro, código de tipo de documento | Sí | 24 | 3 | 26 |
| `f350_consec_docto` | Consecutivo de documento | Numérico | Número de documento | Sí | 27 | 8 | 34 |
| `f350_fecha` | Fecha del documento | Alfanumérico | Formato AAAAMMDD | Sí | 35 | 8 | 42 |
| `f350_id_tercero` | Tercero | Alfanumérico | Valida en maestro de terceros, debe ser proveedor | Sí | 43 | 15 | 57 |
| `f350_id_clase_docto` | Clase de documento | Numérico | Entradas Directas = 408, Devoluciones = 420 | Sí | 58 | 3 | 60 |
| `f350_ind_estado` | Estado del documento | Numérico | 0=En elaboración, 1=Aprobado/Contabilizado, 2=Anulado | Sí | 61 | 1 | 61 |
| `f350_ind_impresión` | Estado de impresión | Numérico | 0=No, 1=Sí | Sí | 62 | 1 | 62 |
| `f350_notas` | Notas | Alfanumérico | Notas del documento | No | 63 | 255 | 317 |
| `f451_id_concepto` | Concepto | Numérico | Valor fijo: 401 si clase 408, 402 si clase 420 | Sí | 318 | 3 | 320 |
| `f451_id_grupo_clase_docto` | Grupo de clase de documento | Numérico | Valor fijo: 403 | Sí | 321 | 3 | 323 |
| `f451_id_sucursal_prov` | Sucursal del proveedor | Alfanumérico | Valida en maestro, proveedor | Sí | 324 | 3 | 326 |
| `f451_id_tercero_comprador` | Tercero comprador | Alfanumérico | Valida en maestro; código de tercero con que se identifica el comprador | Sí | 327 | 15 | 341 |
| `f451_num_docto_referencia` | Documento referencia | Alfanumérico | Documento referencia | No | 342 | 12 | 353 |
| `f451_id_moneda_docto` | Moneda del documento | Alfanumérico | Valida en maestro, código de moneda del documento | Dep | 354 | 3 | 356 |
| `f451_id_moneda_conv` | Moneda base de conversión | Alfanumérico | Valida en maestro, código de moneda base definida en la compañía | Dep | 357 | 3 | 359 |
| `f451_tasa_conv` | Tasa de conversión | Numérico | Coloque 1 si la moneda del documento es igual a la moneda local o a la moneda base de conversión; de lo contrario coloque la tasa de conversión. Formato: 8 enteros + punto + 4 decimales | Sí | 360 | 13 | 372 |
| `f451_id_moneda_local` | Moneda local | Alfanumérico | Valida en maestro, código de moneda local definida en la compañía | Dep | 373 | 3 | 375 |
| `f451_tasa_local` | Tasa local | Numérico | Coloque 1 si la moneda del documento es igual a la moneda local; de lo contrario coloque la tasa de cambio. Formato: 8 enteros + punto + 4 decimales (00000000.0000), obligatorio | Sí | 376 | 13 | 388 |
| `f451_tasa_dscto_global1` | Descuento global 1 | Numérico | Tasa de descuento global. Formato: 3 enteros + punto + 4 decimales (000.0000) | No | 389 | 8 | 396 |
| `f451_tasa_dscto_global2` | Descuento global 2 | Numérico | Tasa de descuento global. Formato: 3 enteros + punto + 4 decimales (000.0000) | No | 397 | 8 | 404 |
| `f462_id_vehiculo` | Código de vehículo | Alfanumérico | Valida en maestro de vehículos; obligatorio si graban información del transportador | Dep | 405 | 10 | 414 |
| `f462_id_tercero_transp` | Código transportador | Alfanumérico | Código del transportador; obligatorio si graban información del transportador y existe vehículo | Dep | 415 | 15 | 429 |
| `f462_id_sucursal_transp` | Código sucursal transportador | Alfanumérico | Sucursal del transportador; obligatorio si graban información del transportador y existe vehículo | Dep | 430 | 3 | 432 |
| `f462_id_tercero_conductor` | Código conductor | Alfanumérico | Código del conductor; obligatorio si graban información del transportador y existe vehículo | Dep | 433 | 15 | 447 |
| `f462_nombre_conductor` | Nombre conductor | Alfanumérico | Nombre del conductor; obligatorio si graban información del transportador y existe vehículo | Dep | 448 | 50 | 497 |
| `f462_identif_conductor` | Identificación del conductor | Alfanumérico | Identificación del conductor; obligatorio si graban información del transportador y existe vehículo | Dep | 498 | 15 | 512 |
| `f462_numero_guia` | Número de guía | Alfanumérico | Número de guía; obligatoria si graban información del transportador y existe vehículo | Dep | 513 | 30 | 542 |
| `f462_cajas` | Cajas/Bultos | Numérico | Formato: 10 enteros + punto + 4 decimales (0000000000.0000) | No | 543 | 15 | 557 |
| `f462_peso` | Peso | Numérico | Formato: 15 enteros + punto + 4 decimales (000000000000000.0000). Número de decimales según configuración de la unidad de peso del sistema | No | 558 | 20 | 577 |
| `f462_volumen` | Volumen | Numérico | Formato: 15 enteros + punto + 4 decimales (000000000000000.0000). Número de decimales según configuración de la unidad de volumen del sistema | No | 578 | 20 | 597 |
| `f462_valor_seguros` | Valor asegurado | Numérico | Formato: 15 enteros + punto + 4 decimales (000000000000000.0000). Número de decimales según configuración de la moneda (decimales unidades) | No | 598 | 20 | 617 |
| `f462_notas` | Notas | Alfanumérico | Notas del transportador | No | 618 | 255 | 872 |
| `f451_ind_consignacion` | Indicador de consignación | Numérico | Indicador de consignación | No | 873 | 1 | 873 |

**Notas generales:** los campos que no son requeridos deben dejarse en
blanco o en ceros según el tipo de dato, para conservar la posición
inicial/final de cada campo en el archivo.

## Origen de cada campo del registro 451 (confirmado 2026-09-30, caso `referencia_oc` nulo)

| Campo | Origen |
|---|---|
| `F_CIA` | `compania.cod_erp` |
| `F_LIQUIDA_IMPUESTO` | fijo `1` (liquida impuestos con parámetros del sistema) |
| `F_CONSEC_AUTO_REG` | fijo `1` (automático — consistente con que SIESA confirma el consecutivo en la respuesta) |
| `f350_id_co` | **Formulario** — parámetro `centro_operacion` |
| `f350_id_tipo_docto` | **Formulario** — parámetro `tipo_documento` |
| `f350_consec_docto` | `1` (placeholder/no aplica cuando `F_CONSEC_AUTO_REG=1`; SIESA lo recalcula) |
| `f350_fecha` | `sysdate` (fecha del envío, no fecha de la factura) |
| `f350_id_tercero` | `proveedores.cod_erp` |
| `f350_id_clase_docto` | fijo `408` (Entrada Directa) |
| `f350_ind_estado` | fijo `0` (En Elaboración) |
| `f350_ind_impresión` | fijo `0` |
| `f350_notas` | `entradas_almacen.notas` |
| `f451_id_concepto` | fijo `401` |
| `f451_id_grupo_clase_docto` | fijo `403` |
| `f451_id_sucursal_prov` | `proveedores.cod_erp_sucursal` |
| `f451_id_tercero_comprador` | **Formulario** — parámetro `tercero_comprador` |
| `f451_num_docto_referencia` | `facturas.prefijo_fe` + `facturas.consecutivo_fe` — **solo para el caso `referencia_oc` nulo** (ver pendiente abajo) |
| `f451_id_moneda_docto` | **Formulario** — parámetro `moneda` |
| `f451_id_moneda_local` | **Formulario** — parámetro `moneda` |
| `f451_tasa_conv` | fijo `1` |
| `f451_tasa_local` | fijo `1` |
| `f451_tasa_dscto_global1`/`2` | fijo `0` |
| `f462_*` (bloque transportador) | todo vacío/`0` — no se captura transportador en este flujo |
| `f451_ind_consignacion` | fijo `0` |

**Alcance confirmado (2026-09-30):** por ahora el servicio solo cubre el
caso `referencia_oc` nulo (mapeo de arriba). El caso `referencia_oc` NO
nulo (factura con Orden de Compra asociada — afecta al menos
`f451_num_docto_referencia`, posiblemente otros campos) queda **fuera de
alcance explícitamente** hasta que se comparta ese segundo mapeo; no se
debe asumir ni codificar esa rama mientras tanto. El código del servicio
debe lanzar un error claro (no silencioso) si se invoca con una factura
que sí tiene `referencia_oc`, en vez de aplicar el mapeo sin OC por
defecto.

## Registro tipo 470 — Movimiento de Entradas de Almacén (versión 01)

Un documento (registro 451) tiene una o más líneas de movimiento (registro
470) — relación análoga a `entradas_almacen` → `detalles_entrada_almacen`
en el esquema MySQL del proyecto.

| Campo | Descripción | Tipo | Observaciones | Obl | Inicio | Tamaño | Total |
|---|---|---|---|---|---|---|---|
| `F_NUMERO-REG` | Número de registro | Numérico | Número consecutivo | Sí | 1 | 7 | 7 |
| `F_TIPO-REG` | Tipo de registro | Numérico | Valor fijo = 470 | Sí | 8 | 4 | 11 |
| `F_SUBTIPO-REG` | Subtipo de registro | Numérico | Valor fijo = 01 | Sí | 12 | 2 | 13 |
| `F_VERSION-REG` | Versión del tipo de registro | Numérico | Versión = 01 | Sí | 14 | 2 | 15 |
| `F_CIA` | Compañía | Numérico | Valida en maestro, código de la compañía a la cual pertenece la información del registro | Sí | 16 | 3 | 18 |
| `f470_id_co` | Centro de operación | Alfanumérico | Valida en maestro, código de centro de operación del documento | Sí | 19 | 3 | 21 |
| `f470_id_tipo_docto` | Tipo de documento | Alfanumérico | Valida en maestro, código de tipo de documento | Sí | 22 | 3 | 24 |
| `f470_consec_docto` | Consecutivo de documento | Numérico | Número de documento | Sí | 25 | 8 | 32 |
| `f470_nro_registro` | Número de registro | Numérico | Número de registro del movimiento | Sí | 33 | 10 | 42 |
| `f470_id_item` | Ítem | Numérico | Código; obligatorio si no va referencia ni código de barras | Dep | 43 | 7 | 49 |
| `f470_referencia_item` | Referencia ítem | Alfanumérico | Código; obligatorio si no va código de ítem ni código de barras | Dep | 50 | 20 | 69 |
| `f470_codigo_barras` | Código de barras | Alfanumérico | Código; obligatorio si no va código de ítem ni referencia | Dep | 70 | 20 | 89 |
| `f470_id_ext1_detalle` | Extensión 1 | Alfanumérico | Obligatorio si el ítem maneja extensión 1 | Dep | 90 | 4 | 93 |
| `f470_id_ext2_detalle` | Extensión 2 | Alfanumérico | Obligatorio si el ítem maneja extensión 2 | Dep | 94 | 4 | 97 |
| `f470_id_bodega` | Bodega | Alfanumérico | Valida en maestro, código de bodega | Sí | 98 | 5 | 102 |
| `f470_id_ubicacion_aux` | Ubicación | Alfanumérico | Valida en maestro; obligatorio si la bodega maneja ubicaciones | Dep | 103 | 10 | 112 |
| `f470_id_lote` | Lote | Alfanumérico | Valida en maestro; obligatorio si el ítem y la bodega manejan lotes | Dep | 113 | 15 | 127 |
| `f470_id_concepto` | Concepto | Numérico | Valor fijo: 401 si clase 408, 402 si clase 413 | Sí | 128 | 3 | 130 |
| `f470_id_motivo` | Motivo | Alfanumérico | Valida en maestro, código de motivo | Sí | 131 | 2 | 132 |
| `f470_ind_obsequio` | Indicador de obsequio | Numérico | 0=No, 1=Sí | Sí | 133 | 1 | 133 |
| `f470_id_co_movto` | Centro de operación movimiento | Alfanumérico | Valida en maestro, código de centro de operación del movimiento | Sí | 134 | 3 | 136 |
| `f470_id_un_movto` | Unidad de negocio movimiento | Alfanumérico | Valida en maestro, código de unidad de negocio del movimiento | Sí | 137 | 2 | 138 |
| `f470_id_ccosto_movto` | Centro de costo movimiento | Alfanumérico | Obligatorio si la cuenta contable exige centro de costo. Valida en maestro | Dep | 139 | 15 | 153 |
| `f470_id_proyecto` | Proyecto | Alfanumérico | Valida en maestro, código de proyecto del movimiento | No | 154 | 15 | 168 |
| `f470_id_lista_precio` | Lista de precio | Alfanumérico | Debe ser vacío | No | 169 | 3 | 171 |
| `f470_id_unidad_precio` | Unidad de medida (precio) | Alfanumérico | Valida en maestro; código de unidad de medida en que se encuentra el precio. Normalmente es la misma unidad de captura, pero con unidad adicional hay que definir en cuál de las dos está el precio | Dep | 172 | 4 | 175 |
| `f470_id_unidad_medida` | Unidad de medida | Alfanumérico | Valida en maestro, código de unidad de medida del movimiento | Sí | 176 | 4 | 179 |
| `f470_cant_base` | Cantidad base | Numérico | Cantidad en unidad de captura. Formato: 15 enteros + punto + 4 decimales (000000000000000.0000), decimales según configuración de la unidad de medida | Sí | 180 | 20 | 199 |
| `f470_cant_2` | Cantidad adicional | Numérico | Obligatorio si el ítem maneja unidad adicional. Formato: 15 enteros + punto + 4 decimales (000000000000000.0000) | Dep | 200 | 20 | 219 |
| `f470_vlr_bruto` | Valor bruto | Numérico | Formato: 15 enteros + punto + 4 decimales, decimales según configuración de la moneda (compra/venta). Valor bruto sin impuestos. Solo para versión 2 de documento: puede ser cero si se liquidan impuestos con los parámetros del sistema (ítem y proveedor) — se toma el precio del sistema | Dep | 220 | 20 | 239 |
| `f470_ind_naturaleza` | Naturaleza de la transacción | Numérico | Se valida con el indicador de naturaleza del motivo. 1=Entrada, 2=Salida (Devolución) | Sí | 240 | 1 | 240 |
| `f470_ind_solo_valor` | Solo valor | Numérico | No aplica, poner en 0 | Sí | 241 | 1 | 241 |
| `f470_ind_impto_asumido` | Impuestos asumidos | Numérico | No aplica, poner en 0 | Sí | 242 | 1 | 242 |
| `f470_notas` | Notas | Alfanumérico | Notas del movimiento | No | 243 | 255 | 497 |
| `f470_desc_variable` | Descripción | Alfanumérico | Descripción del movimiento | No | 498 | 2000 | 2497 |
| `F_DESC_ITEM` | Descripción del ítem | Alfanumérico | Si trae valor, el sistema valida al importar que la descripción del ítem coincida con la de la base de datos | No | 2498 | 40 | 2537 |
| `F_ID_UM_INVENTARIO` | Unidad de medida de inventario del ítem | Alfanumérico | Si trae valor, el sistema valida al importar que la unidad de inventario del ítem coincida con la de la base de datos | No | 2538 | 4 | 2541 |

**Notas generales:** los campos que no son requeridos deben dejarse en
blanco o en ceros según el tipo de dato, para conservar la posición
inicial/final de cada campo en el archivo.

## Origen de cada campo del registro 470 (confirmado 2026-09-30)

| Campo | Origen |
|---|---|
| `F_CIA` | `compania.cod_erp` |
| `f470_id_co` | **Formulario de ingreso a almacén** — parámetro `centro_operacion` |
| `f470_id_tipo_docto` | **Formulario** — parámetro `tipo_documento` |
| `f470_consec_docto` | consecutivo de documento confirmado por SIESA en la 1ª llamada (registro 451) |
| `f470_nro_registro` | autonumérico (1, 2, 3, … por línea dentro del documento) |
| `f470_id_item` | `equivalencias_proveedores.cod_erp_item` |
| `f470_id_bodega` | **Formulario** — parámetro `bodega` |
| `f470_id_concepto` | fijo `401` (clase 408) |
| `f470_id_motivo` | **Formulario** — parámetro `motivo` |
| `f470_id_co_movto` | **Formulario** — parámetro `centro_operacion_movto` |
| `f470_id_un_movto` | **Formulario** — parámetro `unidad_negocio` |
| `f470_id_ccosto_movto` | **Formulario** — parámetro `centro_costo` |
| `f470_id_unidad_precio` | `detalles_entrada_almacen.cod_erp_um_precio` |
| `f470_id_unidad_medida` | `detalles_entrada_almacen.cod_erp_um` |
| `f470_cant_base` | `detalles_entrada_almacen.cantidad` |
| `f470_cant_2` | fijo `0` |
| `f470_vlr_bruto` | `detalles_entrada_almacen.vlr_bruto` |
| `f470_ind_naturaleza` | fijo `1` (Entrada) |
| `f470_ind_solo_valor` | fijo `0` |
| `f470_ind_impto_asumido` | fijo `0` |
| `f470_notas` | `detalles_entrada_almacen.notas` |

**Confirmado (2026-09-30):** los campos marcados "Formulario" (`centro_operacion`,
`tipo_documento`, `bodega`, `motivo`, `centro_operacion_movto`,
`unidad_negocio`, `centro_costo`) **no son configuración fija del
backend** (no van en `.env` ni en una tabla de config) — los captura el
usuario en el formulario de ingreso a almacén al momento de procesar la
factura, antes de disparar el envío síncrono a SIESA. El frontend debe
exponer estos campos como inputs/selects en esa pantalla (candidatos a
poblarse con las consultas de solo lectura ya existentes en
`siesaConsultasService.js`: `bodegasPorCo`, `centrosOperacion`,
`unidadesNegocios`, `motivosPorConcepto`, `centrosCostos`).

## Relación con el esquema del proyecto

- `f350_id_clase_docto` (408/420) es el campo que distingue Entrada
  Directa de Devolución — no hay columna equivalente explícita en
  `entradas_almacen` (`mysql-init/01_schema.sql`); a confirmar si
  `cod_erp_tipo_docto`/`cod_erp_tipo_docto_oc` lo cubre o si falta mapear.
- `f350_ind_estado` (0=En elaboración, 1=Aprobado/Contabilizado,
  2=Anulado) es consistente con la regla ya documentada en
  `backend/CLAUDE.md` de que la Entrada de Almacén se crea en estado
  `'0'` (En Elaboración) — ahí descrita en términos del envío SOAP
  (`Tipo_Documento: 'COM'`, `Estado: '0'`), no de este archivo plano.
- `f350_notas` es candidato a mapear con `entradas_almacen.notas`
  (columna usada hoy para poblar "Novedades" del dashboard, ver
  `ESPECIFICACIONES.md` §7.5).
- El registro 470 (Movimiento) corresponde línea a línea a
  `detalles_entrada_almacen`: `f470_id_item` ≈ `cod_erp_item`,
  `f470_id_unidad_medida` ≈ `cod_erp_um`, `f470_id_unidad_precio` ≈
  `cod_erp_um_precio`, `f470_cant_base` ≈ `cantidad`, `f470_vlr_bruto` ≈
  `vlr_bruto`, `f470_notas` ≈ `notas`. Campos del plano sin columna
  equivalente hoy en `detalles_entrada_almacen` (bodega, ubicación, lote,
  motivo, centro de costo/proyecto del movimiento, naturaleza, etc.) —
  confirmar si deben agregarse a la tabla o si se resuelven en el momento
  del envío con valores por defecto/configuración.
- `f470_ind_naturaleza` (1=Entrada, 2=Salida/Devolución) es otro posible
  punto de cruce con `f350_id_clase_docto` (408/420) del registro 451.
- **Confirmado:** el mecanismo de creación es el WS SOAP ya adaptado
  (`backend/src/adapters/siesa/siesaService.js`, método
  `importarXML({ idCia, lineas })` → `ImportarXMLAsync`), no un archivo
  plano real en disco — cada "línea" del array es un registro de este
  plano (451 o 470) serializado como XML. El catálogo de solo lectura en
  `siesaConsultasService.js` (`EjecutarConsultaXMLAsync`) es un adaptador
  distinto, usado solo para poblar combos/selects del frontend.

## Checklist antes de escribir código (nuevo servicio de dominio)

Confirmado:
- [x] Mecanismo de transporte: WS SOAP `ImportarXML` (`siesaService.js`),
      no archivo plano en disco.
- [x] Flujo de 2 llamadas separadas: 1ª solo el 451 (documento) → espera
      respuesta de SIESA con el consecutivo autogenerado → 2ª llamada con
      los registros 470 (detalle), referenciando ese consecutivo.
- [x] MySQL en 2 pasos separados: insert en `entradas_almacen` tras éxito
      de la 1ª llamada; insert en `detalles_entrada_almacen` tras éxito
      de la 2ª llamada.
- [x] Origen de cada campo del registro 470 (tabla arriba): mezcla de
      datos de `detalles_entrada_almacen`/`equivalencias_proveedores` y
      parámetros capturados en el formulario de ingreso a almacén.
- [x] Ubicación del nuevo código: nuevo servicio de dominio (no extender
      el controller genérico `siesa.controller.js`/`POST
      /api/siesa/importar`, que queda como paso crudo de líneas para
      debug).

Pendiente (bloquea escribir el parseo de la respuesta y el mapeo del
registro 451):
- [ ] **Shape de la respuesta exitosa de `ImportarXMLResult`** cuando
      `printTipoError=0` en el caso de uso de creación de documento (de
      dónde sale el consecutivo autogenerado). Hoy `parseErrorDataSet` en
      `siesaService.js` solo cubre el shape de error. Se deja como TODO
      explícito en el código hasta tener un ejemplo real (log de prueba
      contra SIESA o WSDL) — no se debe inventar el nombre del campo.
- [x] Origen de los campos del **registro 451** (documento) — confirmado
      para el caso `referencia_oc` nulo (tabla arriba).
- [x] Alcance: **fuera de alcance por ahora** el caso `referencia_oc` NO
      nulo (factura con Orden de Compra asociada) — el servicio debe
      rechazar explícitamente ese caso (error claro), no asumir el mapeo
      sin OC por defecto. Retomar cuando se comparta ese mapeo.
- [ ] Campos del formulario de ingreso a almacén: falta definir el
      contrato exacto (nombres, validaciones, de qué combo/consulta
      SIESA se puebla cada uno) entre frontend y el nuevo servicio de
      backend.

## Código escrito (2026-09-30)

Estructura implementada, cubriendo solo el caso `referencia_oc` nulo:

- `mysql-init/02_autoincrement_pipeline.sql` — `AUTO_INCREMENT` agregado
  para `entradas_almacen`/`detalles_entrada_almacen`.
- `backend/src/constants/estadosEntradaAlmacen.js` — catálogo de estados
  separado de `constants/estados.js` (facturas): ids 6/7/8
  (`EN_ELABORACION`/`APROBADO_CONTABILIZADO`/`ANULADO`).
- `backend/src/seeds/seedPipeline.js` — `ESTADOS` ampliado con esos 3 ids
  (necesario porque el seed borra cualquier fila de `estados_documentos`
  fuera de la lista).
- `backend/src/adapters/siesa/entradaAlmacenBuilder.js` — `buildLinea451`,
  `buildLinea470`, `assertSinOrdenCompra` (arma los objetos que
  `importarXML` serializa como XML).
- `backend/src/adapters/siesa/siesaService.js` — sin cambios de
  comportamiento; `importarXML` ahora devuelve también `resultadoCrudo`
  en el caso de éxito, con un TODO explícito sobre el shape pendiente de
  confirmar.
- `backend/src/services/entradaAlmacenService.js` — `crearEntradaAlmacen`:
  orquesta las 2 llamadas/2 inserts, con auditoría tras cada paso exitoso
  (`auditoriaService.registrarAccion`, acciones `creacion`/
  `ingreso_detalles`). **Hoy el paso 2 siempre falla explícitamente**
  (`cod_erp_consec_docto` queda `NULL` tras el paso 1) hasta resolver el
  TODO del consecutivo — comportamiento intencional, no hay fallback
  silencioso.
- `backend/src/api/entradas-almacen/` (`entradasAlmacen.controller.js` +
  `.routes.js`) — `POST /api/entradas-almacen`, protegido con
  `requireAuth` + `requirePermission('gestionar_siesa')` (mismo permiso
  que `/api/siesa/*`; no se sembró un permiso nuevo).
- `backend/src/index.js` — monta la ruta nueva.

Sin probar contra SIESA real ni con pruebas automatizadas — bloqueado por
el TODO del consecutivo (no se puede completar el flujo de punta a punta
sin eso) y por el contrato aún no definido del formulario de ingreso a
almacén.
