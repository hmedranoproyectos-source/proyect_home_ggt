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

