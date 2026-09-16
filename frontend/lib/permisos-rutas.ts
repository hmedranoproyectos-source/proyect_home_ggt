// Mapa ruta -> permiso de negocio requerido (descripciones del catalogo
// global de `permisos`, ver seedAuth.js PERMISOS_NEGOCIO). Una sola fuente
// de verdad para el menu lateral (que items mostrar) y GuardarRuta (que
// URLs bloquear si el usuario las escribe directo).
export const ITEMS_MENU = [
	{ href: '/dashboard', label: 'Dashboard', permiso: 'Dashboard' },
	{
		href: '/bandeja',
		label: 'Bandeja de facturas',
		permiso: 'Bandeja de facturas',
	},
	{ href: '/informes', label: 'Informes', permiso: 'Informes' },
	{
		href: '/roles-usuarios',
		label: 'Roles y usuarios',
		permiso: 'Roles y usuarios',
	},
] as const

// /facturas/[id] cuelga de la Bandeja, no tiene item propio en el menu
// pero necesita el mismo permiso para no quedar accesible por URL directa.
const RUTAS_ADICIONALES: { prefijo: string; permiso: string }[] = [
	{ prefijo: '/facturas/', permiso: 'Bandeja de facturas' },
]

export function permisoRequerido(pathname: string): string | null {
	const item = ITEMS_MENU.find(
		(i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
	)
	if (item) {
		return item.permiso
	}
	const adicional = RUTAS_ADICIONALES.find((r) =>
		pathname.startsWith(r.prefijo),
	)
	return adicional?.permiso ?? null
}

export function tienePermiso(permisos: string[], permiso: string): boolean {
	return permisos.includes(permiso)
}

// Permisos de accion (crear/editar/eliminar) dentro de la pantalla "Roles
// y usuarios" -- separados del permiso de acceso a la pantalla en si
// (ver ITEMS_MENU). Sin uno de estos, el usuario solo puede ver (GET).
export const PERMISO_GESTIONAR_USUARIOS = 'gestionar_usuarios'
export const PERMISO_GESTIONAR_ROLES = 'gestionar_roles'
export const PERMISO_GESTIONAR_COMPANIAS = 'gestionar_companias'

export function primeraRutaPermitida(permisos: string[]): string | null {
	const item = ITEMS_MENU.find((i) => tienePermiso(permisos, i.permiso))
	return item?.href ?? null
}
