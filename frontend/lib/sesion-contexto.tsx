'use client'

import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react'
import {
	agregarCompaniaASesion,
	leerSesion,
	seleccionarCiaEnSesion,
} from '@/lib/sesion'
import type { CompaniaApp, SesionUsuario } from '@/lib/tipos'

interface ValorSesion {
	sesion: SesionUsuario | null
	seleccionarCia: (idCia: number) => void
	agregarCompania: (cia: CompaniaApp) => void
}

const SesionContexto = createContext<ValorSesion>({
	sesion: null,
	seleccionarCia: () => undefined,
	agregarCompania: () => undefined,
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
			seleccionarCia: (idCia: number) => {
				setSesion(seleccionarCiaEnSesion(idCia))
			},
			agregarCompania: (cia: CompaniaApp) => {
				setSesion(agregarCompaniaASesion(cia))
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
