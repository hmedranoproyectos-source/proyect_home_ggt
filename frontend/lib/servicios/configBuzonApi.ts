import { api } from '../api'
import type { ConfigBuzonApp } from '../tipos'

export async function obtenerConfigBuzon(): Promise<ConfigBuzonApp> {
	const { data } = await api.get<ConfigBuzonApp>('/config/email')
	return data
}

export interface GuardarConfigBuzon {
	descripcion: string
	protocolo: string
	servidor: string
	puerto: number
	cifrado: string
	usuario: string
	clave?: string
	carpeta: string
	rutaDescargas: string
}

export async function guardarConfigBuzon(
	payload: GuardarConfigBuzon,
): Promise<ConfigBuzonApp> {
	const { data } = await api.put<ConfigBuzonApp>('/config/email', payload)
	return data
}

export async function probarConexionBuzon(
	payload: Partial<GuardarConfigBuzon>,
): Promise<{ ok: boolean; error?: string }> {
	const { data } = await api.post<{ ok: boolean; error?: string }>(
		'/config/email/test-connection',
		payload,
	)
	return data
}

export interface ConteoBuzon {
	mailbox: string
	total: number
	noLeidos: number
}

export async function contarCorreosBuzon(): Promise<ConteoBuzon> {
	const { data } = await api.get<ConteoBuzon>('/config/email/count')
	return data
}
