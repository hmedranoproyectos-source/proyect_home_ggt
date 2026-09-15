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

export function sesionDesdeUsuario(usuario: string): SesionUsuario {
	return {
		usuario,
		nombre: 'Coordinador de procesos',
		rol: 'Coordinador de procesos',
		iniciales: 'CP',
	}
}
