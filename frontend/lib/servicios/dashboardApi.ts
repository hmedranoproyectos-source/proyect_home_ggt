import { api } from '../api'
import type { ResumenDashboardApp } from '../tipos'

// GET /api/dashboard/resumen (KPIs Por ingresar / Con novedad y facturas
// que requieren atención, paginadas; pagina base 0).
export async function obtenerResumenDashboard(
	pagina = 0,
	limite = 10,
): Promise<ResumenDashboardApp> {
	const { data } = await api.get<ResumenDashboardApp>('/dashboard/resumen', {
		params: { pagina, limite },
	})
	return data
}
