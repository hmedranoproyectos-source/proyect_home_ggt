import { listarCompanias } from './servicios/companiasApi'
import { switchCompany } from './servicios/authApi'
import type { SesionUsuario } from './tipos'

const CLAVE = 'ggt-sesion'
let sesionMemoria: SesionUsuario | null = null

export function leerSesion(): SesionUsuario | null {
	if (sesionMemoria) {
		return sesionMemoria
	}
	if (typeof window === 'undefined') {
		return null
	}
	const crudo = window.localStorage.getItem(CLAVE)
	if (!crudo) {
		return null
	}
	try {
		sesionMemoria = JSON.parse(crudo) as SesionUsuario
		return sesionMemoria
	} catch {
		return null
	}
}

export function guardarSesion(sesion: SesionUsuario): void {
	sesionMemoria = sesion
	if (typeof window === 'undefined') {
		return
	}
	window.localStorage.setItem(CLAVE, JSON.stringify(sesion))
}

export function cerrarSesion(): void {
	sesionMemoria = null
	if (typeof window === 'undefined') {
		return
	}
	window.localStorage.removeItem(CLAVE)
}

interface DatosLoginOk {
	usuario: string
	token: string
	id_cia: number
	roles: { id_rol: number; descripcion: string }[]
	permisos: string[]
}

// Mapea la respuesta status:'ok' de POST /api/auth/login (o
// /api/auth/select-company) a la sesion que consume el frontend. Trae la
// lista de companias del usuario para poblar el selector.
export async function sesionDesdeLoginOk(
	datos: DatosLoginOk,
): Promise<SesionUsuario> {
	const companias = await listarCompanias(datos.token)
	const actual =
		companias.find((cia) => cia.id === datos.id_cia) ?? companias[0]
	const nombreRol = datos.roles.map((rol) => rol.descripcion).join(', ')

	return {
		usuario: datos.usuario,
		nombre: datos.usuario,
		rol: nombreRol || '-',
		iniciales: datos.usuario.slice(0, 2).toUpperCase(),
		idCia: actual?.id ?? datos.id_cia,
		razonSocial: actual?.razonSocial ?? '',
		companias,
		token: datos.token,
		permisos: datos.permisos,
	}
}

// Cambia la compania activa de una sesion ya logueada -- recalcula
// roles/permisos para la nueva compania (el backend los emite en el
// token final, no se pueden inferir en el cliente).
export async function seleccionarCiaEnSesion(
	idCia: number,
): Promise<SesionUsuario | null> {
	const actual = leerSesion()
	if (!actual) {
		return null
	}
	const resultado = await switchCompany(idCia)
	const siguiente = await sesionDesdeLoginOk({
		usuario: actual.usuario,
		token: resultado.token,
		id_cia: resultado.id_cia,
		roles: resultado.roles,
		permisos: resultado.permisos,
	})
	guardarSesion(siguiente)
	return siguiente
}
