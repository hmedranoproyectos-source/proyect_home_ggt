import { api } from '../api'
import type { UsuarioApp } from '../tipos'

export async function listarUsuarios(): Promise<UsuarioApp[]> {
	const { data } = await api.get<UsuarioApp[]>('/usuarios')
	return data
}
