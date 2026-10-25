import { api } from '../api'
import type { ResultadoConciliacionDianErp } from '../tipos'

// GET /api/informes/conciliacion-dian-erp (proceso pesado: cruza completas
// facturas_dian y facturas_erp de la compañía). Fechas en YYYY-MM-DD.
export async function obtenerConciliacionDianErp(filtros: {
	fechaDesde?: string
	fechaHasta?: string
	nit?: string
}): Promise<ResultadoConciliacionDianErp> {
	const { data } = await api.get<ResultadoConciliacionDianErp>(
		'/informes/conciliacion-dian-erp',
		{
			params: {
				fecha_desde: filtros.fechaDesde || undefined,
				fecha_hasta: filtros.fechaHasta || undefined,
				nit: filtros.nit || undefined,
			},
			// Sin límite corto: con ~6.000 documentos/mes puede tardar.
			timeout: 0,
		},
	)
	return data
}
