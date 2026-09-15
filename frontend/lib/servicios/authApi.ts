import { api } from '../api'
import type { CompaniaApp } from '../tipos'

interface LoginOk {
	requiereSeleccionCompania?: false
	token: string
	id_cia: number
	roles: { id_rol: number; descripcion: string }[]
	permisos: string[]
}

interface LoginSeleccionCompania {
	requiereSeleccionCompania: true
	token: string
	companias: { id: number; razon_social: string }[]
}

export type LoginResultado = LoginOk | LoginSeleccionCompania

export async function login(
	usuario: string,
	clave: string,
): Promise<LoginResultado> {
	const { data } = await api.post<LoginResultado>('/auth/login', {
		usuario,
		clave,
	})
	return data
}

export async function selectCompany(
	idCia: number,
	preToken: string,
): Promise<LoginOk> {
	const { data } = await api.post<LoginOk>(
		'/auth/select-company',
		{ id_cia: idCia },
		{ headers: { Authorization: `Bearer ${preToken}` } },
	)
	return data
}

// A diferencia de selectCompany (paso 2 del login, requiere pre-token),
// switchCompany cambia la compania activa de una sesion YA logueada --
// usa el interceptor de axios, que ya manda el token final actual.
export async function switchCompany(idCia: number): Promise<LoginOk> {
	const { data } = await api.post<LoginOk>('/auth/switch-company', {
		id_cia: idCia,
	})
	return data
}

export function companiaDesdeLogin(item: {
	id: number
	razon_social: string
}): Pick<CompaniaApp, 'id' | 'razonSocial'> {
	return { id: item.id, razonSocial: item.razon_social }
}
