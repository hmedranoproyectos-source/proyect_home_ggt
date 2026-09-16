import { api } from '../api'
import type { UsuarioApp } from '../tipos'

export async function listarUsuarios(): Promise<UsuarioApp[]> {
	const { data } = await api.get<UsuarioApp[]>('/usuarios')
	return data
}

export interface NuevoUsuario {
	usuario: string
	clave: string
	roles: number[]
}

export async function crearUsuario(payload: NuevoUsuario): Promise<UsuarioApp> {
	const { data } = await api.post<UsuarioApp>('/usuarios', payload)
	return data
}

export interface EdicionUsuario {
	clave?: string
	roles: number[]
}

export async function actualizarUsuario(
	id: number,
	payload: EdicionUsuario,
): Promise<UsuarioApp> {
	const { data } = await api.put<UsuarioApp>(`/usuarios/${id}`, payload)
	return data
}

export async function eliminarUsuario(id: number): Promise<void> {
	await api.delete(`/usuarios/${id}`)
}
