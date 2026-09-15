import { api } from '../api'
import type { PermisoCatalogo, RolApp } from '../tipos'

export async function listarRoles(): Promise<RolApp[]> {
	const { data } = await api.get<RolApp[]>('/roles')
	return data
}

export async function permisosDeRol(
	idRol: number,
): Promise<PermisoCatalogo[]> {
	const { data } = await api.get<PermisoCatalogo[]>(
		`/roles/${idRol}/permisos`,
	)
	return data
}
