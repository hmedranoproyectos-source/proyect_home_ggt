export type EstadoFactura =
	| 'Por ingresar'
	| 'Con novedad'
	| 'Conciliada'
	| 'En ERP'

export type MarcaSiesa = string | 'Pendiente' | 'Periodo cerrado'

export interface LineaFactura {
	item: string
	descripcion: string
	cantidad: number
	valorUnitario: number
	subtotal: number
	impuesto: string
	valorImpuesto: number
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

