'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
	BarChart3,
	FileSpreadsheet,
	LayoutDashboard,
	LogOut,
	Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { colores } from '@/lib/tema'
import { cerrarSesion } from '@/lib/sesion'
import { useSesion } from '@/lib/sesion-contexto'

const ITEMS = [
	{
		href: '/dashboard',
		label: 'Dashboard',
		icono: LayoutDashboard,
	},
	{
		href: '/bandeja',
		label: 'Bandeja de facturas',
		icono: FileSpreadsheet,
	},
	{ href: '/informes', label: 'Informes', icono: BarChart3 },
	{
		href: '/roles-usuarios',
		label: 'Roles y usuarios',
		icono: Users,
	},
]

function activo(pathname: string, href: string): boolean {
	if (href === '/dashboard') {
		return pathname === href
	}
	if (href === '/bandeja') {
		return (
			pathname === href || pathname.startsWith('/facturas/')
		)
	}
	return pathname === href || pathname.startsWith(`${href}/`)
}

export function BarraLateral() {
	const pathname = usePathname()
	const router = useRouter()
	const { sesion } = useSesion()

	function handleCerrar() {
		cerrarSesion()
		router.replace('/login')
	}

	return (
		<Box
			component="aside"
			sx={{
				width: 248,
				minHeight: '100vh',
				backgroundColor: colores.navy,
				color: '#fff',
				display: 'flex',
				flexDirection: 'column',
				px: 2,
				py: 3,
				flexShrink: 0,
			}}
		>
			<Box sx={{ px: 1.5, mb: 4 }}>
				<Typography
					sx={{
						fontSize: 11,
						fontWeight: 800,
						letterSpacing: 1.2,
						lineHeight: 1.3,
					}}
				>
					INVERSIONES
					<br />
					DUQUIN
				</Typography>
			</Box>

			<Stack spacing={0.75} sx={{ flex: 1 }}>
				{ITEMS.map((item) => {
					const Icono = item.icono
					const estaActivo = activo(pathname, item.href)
					return (
						<Button
							key={item.href}
							component={Link}
							href={item.href}
							startIcon={<Icono size={16} />}
							sx={{
								justifyContent: 'flex-start',
								position: 'relative',
								overflow: 'hidden',
								color: estaActivo
									? '#fff'
									: 'rgba(255,255,255,0.72)',
								backgroundColor: estaActivo
									? 'rgba(100, 181, 232, 0.28)'
									: 'transparent',
								borderRadius: '6px',
								px: 2,
								py: 1,
								fontWeight: 600,
								'&::before': {
									content: '""',
									position: 'absolute',
									left: 0,
									top: 0,
									bottom: 0,
									width: 4,
									backgroundColor: estaActivo
										? colores.chart
										: 'transparent',
								},
								'&:hover': {
									backgroundColor:
										'rgba(100, 181, 232, 0.28)',
									color: '#fff',
								},
							}}
						>
							{item.label}
						</Button>
					)
				})}
			</Stack>

			<Box sx={{ px: 1.5, pb: 1 }}>
				<Typography sx={{ fontSize: 13, fontWeight: 700 }}>
					{sesion?.iniciales ?? 'CP'}{' '}
					{sesion?.rol ?? 'Administrador'}
				</Typography>
				<Typography
					sx={{
						fontSize: 11,
						color: 'rgba(255,255,255,0.65)',
						mt: 0.25,
					}}
				>
					{sesion?.razonSocial ?? 'Inversiones Duquin'}
				</Typography>
				<Button
					onClick={handleCerrar}
					startIcon={<LogOut size={14} />}
					sx={{
						mt: 0.5,
						px: 0,
						color: 'rgba(255,255,255,0.7)',
						justifyContent: 'flex-start',
						minWidth: 0,
						'&:hover': { color: '#fff' },
					}}
				>
					Cerrar sesión
				</Button>
			</Box>
		</Box>
	)
}
