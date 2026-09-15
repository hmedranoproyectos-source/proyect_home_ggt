'use client'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { leerSesion } from '@/lib/sesion'

interface Props {
	children: React.ReactNode
}

export function GuardarRuta({ children }: Props) {
	const router = useRouter()
	const pathname = usePathname()
	const [listo, setListo] = useState(false)

	useEffect(() => {
		const sesion = leerSesion()
		if (!sesion) {
			router.replace('/login')
			return
		}
		setListo(true)
	}, [pathname, router])

	if (!listo) {
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

	return children
}
