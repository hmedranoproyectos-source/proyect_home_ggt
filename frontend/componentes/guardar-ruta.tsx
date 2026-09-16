'use client'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { leerSesion } from '@/lib/sesion'
import { permisoRequerido, primeraRutaPermitida, tienePermiso } from '@/lib/permisos-rutas'

interface Props {
	children: React.ReactNode
}

export function GuardarRuta({ children }: Props) {
	const router = useRouter()
	const pathname = usePathname()
	const [estado, setEstado] = useState<'cargando' | 'listo' | 'sin-acceso'>(
		'cargando',
	)

	useEffect(() => {
		setEstado('cargando')
		const sesion = leerSesion()
		if (!sesion) {
			router.replace('/login')
			return
		}

		const requerido = permisoRequerido(pathname)
		if (requerido && !tienePermiso(sesion.permisos, requerido)) {
			const alternativa = primeraRutaPermitida(sesion.permisos)
			if (alternativa && alternativa !== pathname) {
				router.replace(alternativa)
			} else {
				setEstado('sin-acceso')
			}
			return
		}

		setEstado('listo')
	}, [pathname, router])

	if (estado === 'cargando') {
		return (
			<Box
				sx={{
					minHeight: '100vh',
					display: 'grid',
					placeItems: 'center',
				}}
			>
				<CircularProgress />
			</Box>
		)
	}

	if (estado === 'sin-acceso') {
		return (
			<Box
				sx={{
					minHeight: '100vh',
					display: 'grid',
					placeItems: 'center',
					px: 2,
					textAlign: 'center',
				}}
			>
				<Typography variant="h3" sx={{ mb: 1 }}>
					No tienes acceso a esta sección
				</Typography>
				<Typography variant="body2">
					Tu usuario no tiene ningún permiso asignado. Contacta a un administrador.
				</Typography>
			</Box>
		)
	}

	return children
}
