import { api } from '../api'
import type { ResumenDashboardApp } from '../tipos'

// GET /api/dashboard/resumen (KPIs Por ingresar / Con novedad y facturas
// que requieren atención).
export async function obtenerResumenDashboard(): Promise<ResumenDashboardApp> {
	const { data } = await api.get<ResumenDashboardApp>('/dashboard/resumen')
	return data
}
