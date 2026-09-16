'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { leerSesion } from '@/lib/sesion'
import { primeraRutaPermitida } from '@/lib/permisos-rutas'

export default function HomePage() {
	const router = useRouter()

	useEffect(() => {
		const sesion = leerSesion()
		if (!sesion) {
			router.replace('/login')
			return
		}
		router.replace(primeraRutaPermitida(sesion.permisos) ?? '/dashboard')
	}, [router])

	return null
}
