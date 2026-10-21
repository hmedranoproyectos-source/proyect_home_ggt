import { api } from '../api'
import type { FacturaErpApp } from '../tipos'

// GET /api/facturas/erp (Informes -> tab "Facturas ERP").
export async function obtenerFacturasErp(): Promise<FacturaErpApp[]> {
	const { data } = await api.get<FacturaErpApp[]>('/facturas/erp')
	return data
}
