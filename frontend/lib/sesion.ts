import { COMPANIAS } from './datos-mock'
import type { CompaniaApp, SesionUsuario } from './tipos'

const CLAVE = 'ggt-sesion'
let sesionMemoria: SesionUsuario | null = null

function normalizar(sesion: SesionUsuario): SesionUsuario {
	const companias =
		sesion.companias?.length > 0 ? sesion.companias : COMPANIAS
	const idCia = sesion.idCia ?? companias[0].id
	const actual =
		companias.find((cia) => cia.id === idCia) ?? companias[0]
	return {
		...sesion,
		idCia: actual.id,
		razonSocial: actual.razonSocial,
		companias,
	}
}

export function leerSesion(): SesionUsuario | null {
	if (sesionMemoria) {
		return normalizar(sesionMemoria)
	}
	if (typeof window === 'undefined') {
		return null
	}
	const crudo = window.localStorage.getItem(CLAVE)
	if (!crudo) {
		return null
	}
	try {
		sesionMemoria = normalizar(
			JSON.parse(crudo) as SesionUsuario,
		)
		return sesionMemoria
	} catch {
		return null
	}
}

export function guardarSesion(sesion: SesionUsuario): void {
	sesionMemoria = normalizar(sesion)
	if (typeof window === 'undefined') {
		return
	}
	window.localStorage.setItem(
		CLAVE,
		JSON.stringify(sesionMemoria),
	)
}

export function cerrarSesion(): void {
	sesionMemoria = null
	if (typeof window === 'undefined') {
		return
	}
	window.localStorage.removeItem(CLAVE)
}

export function sesionDesdeUsuario(usuario: string): SesionUsuario {
	const principal = COMPANIAS[0]
	return {
		usuario,
		nombre: 'Coordinador de procesos',
		rol: 'Administrador',
		iniciales: 'CP',
		idCia: principal.id,
		razonSocial: principal.razonSocial,
		companias: COMPANIAS,
	}
}

export function agregarCompaniaASesion(
	cia: CompaniaApp,
): SesionUsuario | null {
	const actual = leerSesion()
	if (!actual) {
		return null
	}
	if (actual.companias.some((item) => item.id === cia.id)) {
		return actual
	}
	const siguiente = {
		...actual,
		companias: [...actual.companias, cia],
	}
	guardarSesion(siguiente)
	return siguiente
}

export function seleccionarCiaEnSesion(
	idCia: number,
): SesionUsuario | null {
	const actual = leerSesion()
	if (!actual) {
		return null
	}
	const cia = actual.companias.find((item) => item.id === idCia)
	if (!cia) {
		return actual
	}
	const siguiente = {
		...actual,
		idCia: cia.id,
		razonSocial: cia.razonSocial,
	}
	guardarSesion(siguiente)
	return siguiente
}
