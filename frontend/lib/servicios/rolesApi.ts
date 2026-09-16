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

export interface NuevoRol {
	descripcion: string
	permisos: number[]
}

export async function crearRol(payload: NuevoRol): Promise<RolApp> {
	const { data } = await api.post<RolApp>('/roles', payload)
	return data
}

export async function actualizarPermisosDeRol(
	idRol: number,
	permisos: number[],
): Promise<RolApp & { permisos: PermisoCatalogo[] }> {
	const { data } = await api.put<RolApp & { permisos: PermisoCatalogo[] }>(
		`/roles/${idRol}/permisos`,
		{ permisos },
	)
	return data
}

export async function eliminarRol(idRol: number): Promise<void> {
	await api.delete(`/roles/${idRol}`)
}
