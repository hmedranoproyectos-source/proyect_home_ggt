import { api } from '../api'
import type { CompaniaApp } from '../tipos'

interface CompaniaApiDto {
	id: number
	razon_social: string
	cod_erp: string
}

// El parametro opcional `token` existe para el momento exacto en que se
// arma una sesion nueva (sesionDesdeLoginOk): ahi todavia no hay sesion
// guardada, asi que el interceptor de `api` no tiene de donde sacar el
// Authorization header -- sin esto la llamada sale sin token y el
// backend responde 401 antes de que el login termine de armarse.
export async function listarCompanias(
	token?: string,
): Promise<CompaniaApp[]> {
	const { data } = await api.get<CompaniaApiDto[]>('/companias', {
		headers: token ? { Authorization: `Bearer ${token}` } : undefined,
	})
	return data.map((item) => ({
		id: item.id,
		razonSocial: item.razon_social,
		codErp: item.cod_erp,
	}))
}

export interface NuevaCompania {
	razonSocial: string
	codErp: string
}

export async function crearCompania(
	payload: NuevaCompania,
): Promise<CompaniaApp> {
	const { data } = await api.post<CompaniaApp>('/companias', payload)
	return data
}

export async function eliminarCompania(id: number): Promise<void> {
	await api.delete(`/companias/${id}`)
}
