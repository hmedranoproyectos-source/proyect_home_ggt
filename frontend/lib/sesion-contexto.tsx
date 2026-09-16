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
	guardarSesion,
	leerSesion,
	seleccionarCiaEnSesion,
} from '@/lib/sesion'
import type { CompaniaApp, SesionUsuario } from '@/lib/tipos'

interface ValorSesion {
	sesion: SesionUsuario | null
	seleccionarCia: (idCia: number) => Promise<void>
	cerrarSesion: () => void
	agregarCompaniaCreada: (cia: CompaniaApp) => void
	quitarCompaniaEliminada: (idCia: number) => void
}

const SesionContexto = createContext<ValorSesion>({
	sesion: null,
	seleccionarCia: async () => undefined,
	cerrarSesion: () => undefined,
	agregarCompaniaCreada: () => undefined,
	quitarCompaniaEliminada: () => undefined,
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
			agregarCompaniaCreada: (cia: CompaniaApp) => {
				setSesion((prev) => {
					if (!prev) return prev
					const siguiente = {
						...prev,
						companias: [...prev.companias, cia],
					}
					guardarSesion(siguiente)
					return siguiente
				})
			},
			quitarCompaniaEliminada: (idCia: number) => {
				setSesion((prev) => {
					if (!prev) return prev
					const siguiente = {
						...prev,
						companias: prev.companias.filter((c) => c.id !== idCia),
					}
					guardarSesion(siguiente)
					return siguiente
				})
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
