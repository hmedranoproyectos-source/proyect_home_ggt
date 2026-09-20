import type {
	EstadoFactura,
	EventoTrazabilidad,
	Factura,
	FilaComparativo,
	LineaFactura,
} from './tipos'

const LINEAS_BASE: LineaFactura[] = [
	{
		item: '1515',
		descripcion: 'Balde plástico 20 L',
		cantidad: 130,
		valorUnitario: 12000,
		subtotal: 1560000,
		impuesto: '19%',
		valorImpuesto: 296400,
	},
	{
		item: '2645',
		descripcion: 'Lámpara LED 12 W',
		cantidad: 50,
		valorUnitario: 45000,
		subtotal: 2250000,
		impuesto: '19%',
		valorImpuesto: 427500,
	},
	{
		item: '5000',
		descripcion: 'Ventilador X 16 in',
		cantidad: 10,
		valorUnitario: 110000,
		subtotal: 1100000,
		impuesto: '19%',
		valorImpuesto: 209000,
	},
	{
		item: '7120',
		descripcion: 'Extensión eléctrica',
		cantidad: 25,
		valorUnitario: 32000,
		subtotal: 800000,
		impuesto: '19%',
		valorImpuesto: 152000,
	},
]

function facturaBase(
	parcial: Omit<Factura, 'lineas' | 'subtotal' | 'impuestos' | 'iva'>,
): Factura {
	return {
		...parcial,
		lineas: LINEAS_BASE,
		subtotal: 5710000,
		impuestos: 1084900,
		iva: 1084900,
	}
}

export const FACTURAS: Factura[] = [
	facturaBase({
		id: 'FV-9820',
		proveedor: 'Proveedor Andino',
		nit: '800.453.126-1',
		oc: null,
		estado: 'NUEVA',
		entradaSiesa: 'Pendiente',
		causacionSiesa: 'Pendiente',
		emision: '08/09/2026',
		vencimiento: '08/10/2026',
		total: 6794900,
		retefuente: 0,
		reteIva: 0,
		otrosImpuestos: 0,
		fechaEstado: '08/09 12:14',
	}),
	facturaBase({
		id: 'FV-9815',
		proveedor: 'Proveedor Andino',
		nit: '800.453.126-1',
		oc: 'OC-45871',
		estado: 'ALERTA',
		entradaSiesa: 'Pendiente',
		causacionSiesa: 'Pendiente',
		emision: '08/09/2026',
		vencimiento: '08/10/2026',
		total: 18540000,
		retefuente: 0,
		reteIva: 0,
		otrosImpuestos: 0,
		fechaEstado: '08/09 12:17',
	}),
	facturaBase({
		id: 'FV-9818',
		proveedor: 'Plastihogar SAS',
		nit: '900.112.334-8',
		oc: 'OC-45880',
		estado: 'REGISTRADA_ERP',
		entradaSiesa: 'EAM-004591',
		causacionSiesa: 'Pendiente',
		emision: '08/09/2026',
		vencimiento: '08/10/2026',
		total: 6794900,
		retefuente: 0,
		reteIva: 0,
		otrosImpuestos: 0,
		fechaEstado: '08/09 11:02',
	}),
	facturaBase({
		id: 'FV-9814',
		proveedor: 'Industrias Nova',
		nit: '800.453.126-1',
		oc: 'OC-45865',
		estado: 'EN_VALIDACION',
		entradaSiesa: 'Pendiente',
		causacionSiesa: 'Pendiente',
		emision: '08/09/2026',
		vencimiento: '08/10/2026',
		total: 6794900,
		retefuente: 0,
		reteIva: 0,
		otrosImpuestos: 0,
		fechaEstado: '08/09 10:30',
	}),
	facturaBase({
		id: 'FV-9811',
		proveedor: 'Electro Caribe',
		nit: '890.221.009-4',
		oc: 'OC-45810',
		estado: 'CONTABILIZADA',
		entradaSiesa: 'EAM-004589',
		causacionSiesa: 'CXP-008721',
		emision: '07/09/2026',
		vencimiento: '07/10/2026',
		total: 7200000,
		retefuente: 0,
		reteIva: 0,
		otrosImpuestos: 0,
		fechaEstado: '08/09 10:13',
	}),
	facturaBase({
		id: 'FV-9809',
		proveedor: 'Comercial Norte',
		nit: '901.334.556-2',
		oc: null,
		estado: 'ALERTA',
		entradaSiesa: 'Pendiente',
		causacionSiesa: 'Periodo cerrado',
		emision: '06/09/2026',
		vencimiento: '06/10/2026',
		total: 9100000,
		retefuente: 0,
		reteIva: 0,
		otrosImpuestos: 0,
		fechaEstado: '08/09 09:50',
	}),
]

export const ATENCION_IDS = ['FV-9820', 'FV-9815', 'FV-9818']

export const RECIBIDAS_7_DIAS = [
	{ dia: 'L', valor: 28 },
	{ dia: 'M', valor: 42 },
	{ dia: 'M', valor: 30 },
	{ dia: 'J', valor: 55 },
	{ dia: 'V', valor: 40 },
	{ dia: 'S', valor: 62 },
	{ dia: 'D', valor: 48 },
]

export const REGISTRO_SIESA = {
	entradaPendiente: 14,
	causacionPendiente: 21,
	registroCompleto: 84,
}

export const COMPARATIVO: FilaComparativo[] = [
	{
		factura: 'FV-9815',
		proveedor: 'Proveedor Andino',
		enArchivo: true,
		enBuzon: true,
		enErp: false,
		valorArchivo: 18540000,
		valorErp: null,
		resultado: 'Falta ERP',
	},
	{
		factura: 'FV-9791',
		proveedor: 'Industrias Nova',
		enArchivo: true,
		enBuzon: false,
		enErp: false,
		valorArchivo: 4830000,
		valorErp: null,
		resultado: 'Falta buzón',
	},
	{
		factura: 'FV-9777',
		proveedor: 'Comercial Norte',
		enArchivo: true,
		enBuzon: true,
		enErp: true,
		valorArchivo: 9100000,
		valorErp: 8950000,
		resultado: 'Valor',
	},
	{
		factura: 'FV-9702',
		proveedor: 'Electro Caribe',
		enArchivo: true,
		enBuzon: true,
		enErp: true,
		valorArchivo: 7200000,
		valorErp: 7200000,
		resultado: 'Coincide',
	},
]

export const TRAZABILIDAD: Record<string, EventoTrazabilidad[]> = {
	'FV-9811': [
		{
			titulo: 'Factura recibida',
			fecha: '08/09 09:42',
			actor: 'servicio.buzon',
		},
		{
			titulo: 'Factura conciliada',
			fecha: '08/09 09:44',
			actor: 'motor.conciliacion',
		},
		{
			titulo: 'Entrada EAM-004589 registrada',
			fecha: '08/09 10:05',
			actor: 'servicio.siesa',
		},
		{
			titulo: 'Causación CXP-008721 registrada',
			fecha: '08/09 10:12',
			actor: 'servicio.siesa',
		},
		{
			titulo: 'Estado actualizado a En ERP',
			fecha: '08/09 10:13',
			actor: 'sistema',
		},
	],
}

export const ESTADOS: EstadoFactura[] = [
	'NUEVA',
	'EN_VALIDACION',
	'ALERTA',
	'REGISTRADA_ERP',
	'CONTABILIZADA',
]

export const PROVEEDORES = [
	...new Set(FACTURAS.map((factura) => factura.proveedor)),
]

export function buscarFactura(id: string): Factura | undefined {
	return FACTURAS.find((factura) => factura.id === id)
}

export function kpisFacturas() {
	return {
		porIngresar: FACTURAS.filter((f) => f.estado === 'NUEVA')
			.length + 17,
		conNovedad: FACTURAS.filter((f) => f.estado === 'ALERTA')
			.length + 10,
		conciliadas: 96,
		enErp: 84,
	}
}

export function trazabilidadDe(id: string): EventoTrazabilidad[] {
	if (TRAZABILIDAD[id]) {
		return TRAZABILIDAD[id]
	}
	const factura = buscarFactura(id)
	if (!factura) {
		return []
	}
	return [
		{
			titulo: 'Factura recibida',
			fecha: factura.fechaEstado,
			actor: 'servicio.buzon',
		},
		{
			titulo: `Estado actual: ${factura.estado}`,
			fecha: factura.fechaEstado,
			actor: 'sistema',
		},
	]
}
