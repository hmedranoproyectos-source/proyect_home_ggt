import { api } from '../api'
import type { PermisoCatalogo } from '../tipos'

export async function listarPermisos(): Promise<PermisoCatalogo[]> {
	const { data } = await api.get<PermisoCatalogo[]>('/permisos')
	return data
}
