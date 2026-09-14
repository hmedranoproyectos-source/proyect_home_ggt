'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { colores } from '@/lib/tema'
import { guardarSesion, sesionDesdeUsuario } from '@/lib/sesion'

const RADIO_CUADRO = '20px'

export default function LoginPage() {
	const router = useRouter()
	const [usuario, setUsuario] = useState('')
	const [clave, setClave] = useState('')
	const [error, setError] = useState('')
	const [aviso, setAviso] = useState('')
	const [montado, setMontado] = useState(false)

	useEffect(() => {
		setMontado(true)
	}, [])

	if (!montado) {
		return null
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const datos = new FormData(event.currentTarget)
		const usuarioForm = String(
			datos.get('usuario') ?? usuario,
		).trim()
		const claveForm = String(datos.get('clave') ?? clave).trim()
		if (!usuarioForm || !claveForm) {
			setError('Usuario y contraseña son requeridos')
			return
		}
		guardarSesion(sesionDesdeUsuario(usuarioForm))
		router.replace('/dashboard')
	}

	return (
		<Box
			sx={{
				minHeight: '100vh',
				display: 'grid',
				placeItems: 'center',
				backgroundColor: '#fff',
				px: { xs: 2, md: 3 },
				py: { xs: 4, md: 6 },
			}}
		>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
					width: 'min(860px, 100%)',
					alignItems: 'stretch',
				}}
			>
				<Box
					sx={{
						backgroundColor: colores.navy,
						color: '#fff',
						borderRadius: {
							md: `${RADIO_CUADRO} 0 0 ${RADIO_CUADRO}`,
						},
						px: { md: 6 },
						py: { md: 8 },
						minHeight: { md: 420 },
						display: { xs: 'none', md: 'flex' },
						flexDirection: 'column',
						justifyContent: 'center',
					}}
				>
					<Typography
						sx={{
							fontFamily: 'var(--font-sans), Inter, sans-serif',
							fontSize: 12,
							fontWeight: 800,
							letterSpacing: 1.4,
							mb: 4,
						}}
					>
						INVERSIONES DUQUIN
					</Typography>
					<Typography
						sx={{
							fontFamily: 'var(--font-sans), Inter, sans-serif',
							fontSize: { md: 32, lg: 34 },
							fontWeight: 700,
							lineHeight: 1.15,
							mb: 3,
							letterSpacing: -0.3,
						}}
					>
						Gestión de
						<br />
						facturación
						<br />
						electrónica
					</Typography>
					<Typography
						sx={{
							fontFamily: 'var(--font-sans), Inter, sans-serif',
							fontSize: 14,
							fontWeight: 400,
							lineHeight: 1.45,
							opacity: 0.78,
							maxWidth: 260,
						}}
					>
						Control desde la recepción hasta el registro
						en Siesa.
					</Typography>
				</Box>

				<Box
					component="form"
					onSubmit={handleSubmit}
					sx={{
						px: { xs: 3, md: 6 },
						py: { xs: 4, md: 8 },
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						border: `1px solid ${colores.borde}`,
						borderLeft: { md: 'none' },
						borderRadius: {
							xs: RADIO_CUADRO,
							md: `0 ${RADIO_CUADRO} ${RADIO_CUADRO} 0`,
						},
						backgroundColor: '#fff',
					}}
				>
					<Typography
						sx={{
							display: { xs: 'block', md: 'none' },
							fontSize: 12,
							fontWeight: 800,
							letterSpacing: 1.4,
							color: colores.navy,
							mb: 3,
						}}
					>
						INVERSIONES DUQUIN
					</Typography>
					<Typography
						sx={{
							fontFamily: 'var(--font-sans), Inter, sans-serif',
							fontSize: { xs: 24, md: 32 },
							fontWeight: 700,
							letterSpacing: -0.3,
							color: colores.navy,
							mb: 1,
							lineHeight: 1.15,
						}}
					>
						Bienvenido
					</Typography>
					<Typography
						sx={{
							fontSize: { xs: 13, md: 14 },
							fontWeight: 400,
							color: colores.textoSecundario,
							mb: 4,
						}}
					>
						Ingresa tus credenciales para continuar.
					</Typography>

					<Stack spacing={2.5}>
						{error ? (
							<Alert severity="error">{error}</Alert>
						) : null}
						{aviso ? (
							<Alert severity="info">{aviso}</Alert>
						) : null}
						<CampoExterno
							id="login-usuario"
							etiqueta="Usuario"
							required
						>
							<TextField
								id="login-usuario"
								name="usuario"
								fullWidth
								placeholder="nombre.apellido"
								value={usuario}
								onChange={(e) =>
									setUsuario(e.target.value)
								}
							/>
						</CampoExterno>
						<CampoExterno
							id="login-clave"
							etiqueta="Contraseña"
							required
						>
							<TextField
								id="login-clave"
								name="clave"
								type="password"
								fullWidth
								placeholder="••••••••••••"
								value={clave}
								onChange={(e) =>
									setClave(e.target.value)
								}
							/>
						</CampoExterno>
						<Button
							type="submit"
							variant="contained"
							fullWidth
							sx={{
								py: 1.2,
								fontSize: 14,
								fontWeight: 700,
								borderRadius: '8px',
								backgroundColor: colores.azul,
								'&:hover': {
									backgroundColor: '#0C4E82',
								},
							}}
						>
							INICIAR SESIÓN
						</Button>
						<Link
							component="button"
							type="button"
							underline="hover"
							color="secondary"
							onClick={() =>
								setAviso(
									'Solicita el restablecimiento al administrador.',
								)
							}
							sx={{
								alignSelf: 'center',
								color: `${colores.azul} !important`,
								fontSize: 13,
								fontWeight: 500,
							}}
						>
							¿Olvidaste tu contraseña?
						</Link>
					</Stack>
				</Box>
			</Box>
		</Box>
	)
}

function CampoExterno({
	id,
	etiqueta,
	required,
	children,
}: {
	id: string
	etiqueta: string
	required?: boolean
	children: React.ReactNode
}) {
	return (
		<Box>
			<Typography
				component="label"
				htmlFor={id}
				sx={{
					display: 'block',
					mb: 0.75,
					fontSize: 13,
					fontWeight: 600,
					color: colores.texto,
				}}
			>
				{etiqueta}
				{required ? ' *' : ''}
			</Typography>
			{children}
		</Box>
	)
}
