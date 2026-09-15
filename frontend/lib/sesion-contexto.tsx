'use client'

import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react'
import {
	cerrarSesion as cerrarSesionStorage,
	leerSesion,
	seleccionarCiaEnSesion,
} from '@/lib/sesion'
import type { SesionUsuario } from '@/lib/tipos'

interface ValorSesion {
	sesion: SesionUsuario | null
	seleccionarCia: (idCia: number) => Promise<void>
	cerrarSesion: () => void
}

const SesionContexto = createContext<ValorSesion>({
	sesion: null,
	seleccionarCia: async () => undefined,
	cerrarSesion: () => undefined,
})

export function SesionProveedor({
	children,
}: {
	children: React.ReactNode
}) {
	const [sesion, setSesion] = useState<SesionUsuario | null>(null)

	useEffect(() => {
		setSesion(leerSesion())
	}, [])

	const valor = useMemo<ValorSesion>(
		() => ({
			sesion,
			seleccionarCia: async (idCia: number) => {
				const siguiente = await seleccionarCiaEnSesion(idCia)
				setSesion(siguiente)
			},
			cerrarSesion: () => {
				cerrarSesionStorage()
				setSesion(null)
			},
		}),
		[sesion],
	)

	return (
		<SesionContexto.Provider value={valor}>
			{children}
		</SesionContexto.Provider>
	)
}

export function useSesion(): ValorSesion {
	return useContext(SesionContexto)
}
