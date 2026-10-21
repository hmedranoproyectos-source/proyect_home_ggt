// Descripciones reales de estados_documentos (ver backend
// src/constants/estados.js) -- 5 estados fijos, sin ENUM de texto libre.
export type EstadoFactura =
	| 'NUEVA'
	| 'EN_VALIDACION'
	| 'ALERTA'
	| 'REGISTRADA_ERP'
	| 'CONTABILIZADA'

export type MarcaSiesa = string | 'Pendiente' | 'Periodo cerrado'

// Factura tal como la devuelve GET /api/facturas (facturasService.listarParaCia).
export interface FacturaApp {
	id: number
	numeroFactura: string
	proveedor: string
	nit: string
	oc: string | null
	idEstado: number
	estado: EstadoFactura
	entradaSiesa: MarcaSiesa
	causacionSiesa: MarcaSiesa
	fechaEmision: string
	fechaVencimiento: string | null
	vlrBruto: number
	vlrDescuentos: number
	vlrImpuestos: number
	vlrNeto: number
	vlrRetenciones: number
	vlrTotal: number
}

export interface LineaFactura {
	item: string
	descripcion: string
	cantidad: number
	valorUnitario: number
	subtotal: number
	impuesto: string
	valorImpuesto: number
}

// Linea tal como la devuelve GET /api/facturas/:id (detalles_facturas).
// porcImpuesto puede venir null (porc_impuesto es nullable en el esquema
// oficial); subtotal se calcula en el backend (cantidad * valorUnitario),
// no existe como columna propia.
export interface LineaFacturaApp {
	id: number
	item: string
	descripcion: string
	cantidad: number
	valorUnitario: number
	subtotal: number
	porcImpuesto: number | null
	valorImpuesto: number
	notas: string | null
}

// Detalle de factura tal como lo devuelve GET /api/facturas/:id
// (facturasService.obtenerDetalle): misma cabecera que FacturaApp + lineas.
export interface FacturaDetalleApp extends FacturaApp {
	lineas: LineaFacturaApp[]
}

// Linea de la OC tal como la devuelve GET /api/facturas/:id/orden-compra
// (detalles_ordenes_compras, copia local de lo que reporta SIESA).
export interface LineaOrdenCompraApp {
	id: number
	item: string
	unidadMedida: string
	cantidad: number
	valorUnitario: number
	vlrBruto: number
	vlrDescuento: number
	vlrImpuestos: number
	vlrNeto: number
}

export interface OrdenCompraApp {
	id: number
	documento: string
	centroOperacion: string
	fecha: string
	proveedor: string
	nit: string
	vlrBruto: number
	vlrDescuento: number
	vlrImpuestos: number
	vlrNeto: number
	vlrRetencion: number
	vlrTotal: number
	// Diferencia porcentual de total factura vs OC (RC-02); null si el total
	// de la factura es 0.
	diferenciaPct: number | null
	lineas: LineaOrdenCompraApp[]
}

// GET /api/facturas/:id/orden-compra. ordenCompra es null cuando la
// referencia del XML aun no tiene una OC persistida (no hallada en SIESA o
// factura sin conciliar).
export interface OrdenCompraFacturaApp {
	referencia: string | null
	vlrTotalFactura: number
	ordenCompra: OrdenCompraApp | null
}

export interface Factura {
	id: string
	proveedor: string
	nit: string
	oc: string | null
	estado: EstadoFactura
	entradaSiesa: MarcaSiesa
	causacionSiesa: MarcaSiesa
	emision: string
	vencimiento: string
	total: number
	subtotal: number
	impuestos: number
	iva: number
	retefuente: number
	reteIva: number
	otrosImpuestos: number
	lineas: LineaFactura[]
	fechaEstado: string
}

export interface EventoTrazabilidad {
	titulo: string
	fecha: string
	actor: string
}

export interface CompaniaApp {
	id: number
	razonSocial: string
	codErp: string
}

export interface RolApp {
	id: number
	descripcion: string
}

export interface PermisoCatalogo {
	id: number
	descripcion: string
}

export interface UsuarioApp {
	id: number
	usuario: string
	roles: { id: number; descripcion: string }[]
}

export interface ConfigBuzonApp {
	id: number | null
	idCia: number
	descripcion: string
	protocolo: string
	servidor: string
	puerto: number
	cifrado: string
	usuario: string
	tieneClave: boolean
	carpeta: string
	rutaDescargas: string
}

export interface SesionUsuario {
	usuario: string
	nombre: string
	rol: string
	iniciales: string
	idCia: number
	razonSocial: string
	companias: CompaniaApp[]
	token: string
	permisos: string[]
}

// Fila tal como la devuelve GET /api/facturas/dian
// (facturasDianImportService.listarParaCia) -- espejo fiel de facturas_dian,
// sin cruzar con facturas/proveedores.
export interface FacturaDianApp {
	id: number
	nit: string
	proveedor: string
	numeroFactura: string
	vlrTotal: number
	fechaEmision: string
}

// Fila tal como la devuelve GET /api/facturas/erp
// (facturasErpService.listarParaCia) -- facturas_erp cruzado con
// proveedores (facturas_erp solo guarda id_proveedor FK).
export interface FacturaErpApp {
	id: number
	nit: string
	proveedor: string
	codDocumento: string
	consecutivo: number
	prefijo: string
	vlrTotal: number
	fecha: string
}

// Fila cruda de una consulta de catalogo SIESA (GET /api/siesa/*, ver
// siesaConsultasService.js -- EjecutarConsultaXMLAsync). El shape exacto
// de columnas de cada consulta NO esta confirmado contra una respuesta
// real del WS (ggt-home-ws-unoee.md no existe en este checkout); se
// intenta leer varios nombres candidatos para id/descripcion. Ver
// componentes/modal-ingresar-factura.tsx (extraerOpcion) y
// docs/siesa-plano-entradas-almacen.md.
export interface FilaCatalogoSiesa {
	[campo: string]: unknown
}

// Body de POST /api/entradas-almacen (entradaAlmacenService.crearEntradaAlmacen
// en el backend). Alcance actual: solo facturas con oc === null (ver
// assertSinOrdenCompra). Los 8 campos son los que el usuario captura en el
// formulario de ingreso a almacen -- ver docs/siesa-plano-entradas-almacen.md,
// "Origen de cada campo del registro 470".
export interface ParametrosFormularioEntradaAlmacen {
	centro_operacion: string
	tipo_documento: string
	bodega: string
	motivo: string
	centro_operacion_movto: string
	unidad_negocio: string
	centro_costo: string
	tercero_comprador: string
	moneda: string
}

export interface CrearEntradaAlmacenResponse {
	idEntradaAlmacen: number
}

export interface FilaComparativo {
	factura: string
	proveedor: string
	enArchivo: boolean
	enBuzon: boolean
	enErp: boolean
	valorArchivo: number
	valorErp: number | null
	resultado: 'Falta ERP' | 'Falta buzón' | 'Valor' | 'Coincide'
}

