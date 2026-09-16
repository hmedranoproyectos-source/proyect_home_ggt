'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { colores } from '@/lib/tema'
import { guardarSesion, sesionDesdeLoginOk } from '@/lib/sesion'
import { login, selectCompany } from '@/lib/servicios/authApi'
import { primeraRutaPermitida } from '@/lib/permisos-rutas'

const RADIO_CUADRO = '20px'

interface CompaniaPreSesion {
	id: number
	razon_social: string
}

export default function LoginPage() {
	const router = useRouter()
	const [usuario, setUsuario] = useState('')
	const [clave, setClave] = useState('')
	const [error, setError] = useState('')
	const [aviso, setAviso] = useState('')
	const [montado, setMontado] = useState(false)
	const [enviando, setEnviando] = useState(false)
	const [paso, setPaso] = useState<'credenciales' | 'seleccion-cia'>(
		'credenciales',
	)
	const [preToken, setPreToken] = useState('')
	const [companiasPre, setCompaniasPre] = useState<CompaniaPreSesion[]>(
		[],
	)

	useEffect(() => {
		setMontado(true)
	}, [])

	if (!montado) {
		return null
	}

	async function handleSubmit(
		event: React.FormEvent<HTMLFormElement>,
	) {
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
		setError('')
		setEnviando(true)
		let resultado: Awaited<ReturnType<typeof login>> | null = null
		try {
			resultado = await login(usuarioForm, claveForm)
		} catch (err) {
			if (axios.isAxiosError(err) && err.response?.status === 403) {
				setError('Usuario sin compañías asignadas')
			} else {
				setError('Credenciales inválidas')
			}
			setEnviando(false)
			return
		}

		if (resultado.requiereSeleccionCompania) {
			setUsuario(usuarioForm)
			setPreToken(resultado.token)
			setCompaniasPre(resultado.companias)
			setPaso('seleccion-cia')
			setEnviando(false)
			return
		}

		try {
			const sesion = await sesionDesdeLoginOk({
				usuario: usuarioForm,
				token: resultado.token,
				id_cia: resultado.id_cia,
				roles: resultado.roles,
				permisos: resultado.permisos,
			})
			guardarSesion(sesion)
			router.replace(primeraRutaPermitida(sesion.permisos) ?? '/dashboard')
		} catch {
			setError(
				'Ingresaste correctamente, pero no se pudo cargar tu información de compañía. Intenta de nuevo.',
			)
		} finally {
			setEnviando(false)
		}
	}

	async function handleSeleccionCia(idCia: number) {
		setError('')
		setEnviando(true)
		let resultado: Awaited<ReturnType<typeof selectCompany>> | null =
			null
		try {
			resultado = await selectCompany(idCia, preToken)
		} catch {
			setError('No se pudo seleccionar la compañía')
			setEnviando(false)
			return
		}

		try {
			const sesion = await sesionDesdeLoginOk({
				usuario,
				token: resultado.token,
				id_cia: resultado.id_cia,
				roles: resultado.roles,
				permisos: resultado.permisos,
			})
			guardarSesion(sesion)
			router.replace(primeraRutaPermitida(sesion.permisos) ?? '/dashboard')
		} catch {
			setError(
				'Se seleccionó la compañía, pero no se pudo cargar tu sesión. Intenta de nuevo.',
			)
		} finally {
			setEnviando(false)
		}
	}

	if (paso === 'seleccion-cia') {
		return (
			<Box
				sx={{
					minHeight: '100vh',
					display: 'grid',
					placeItems: 'center',
					backgroundColor: '#fff',
					px: { xs: 2, md: 3 },
				}}
			>
				<Box sx={{ width: 'min(420px, 100%)' }}>
					<Typography
						sx={{
							fontSize: 24,
							fontWeight: 700,
							color: colores.navy,
							mb: 1,
						}}
					>
						Elige una compañía
					</Typography>
					<Typography
						sx={{
							fontSize: 13,
							color: colores.textoSecundario,
							mb: 3,
						}}
					>
						Tu usuario tiene acceso a varias compañías.
					</Typography>
					{error ? (
						<Alert severity="error" sx={{ mb: 2 }}>
							{error}
						</Alert>
					) : null}
					<Stack spacing={1.5}>
						{companiasPre.map((cia) => (
							<Button
								key={cia.id}
								variant="outlined"
								disabled={enviando}
								onClick={() => handleSeleccionCia(cia.id)}
								sx={{
									justifyContent: 'flex-start',
									borderRadius: '8px',
									py: 1.2,
								}}
							>
								{cia.razon_social}
							</Button>
						))}
					</Stack>
				</Box>
			</Box>
		)
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
							disabled={enviando}
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
							{enviando ? 'INGRESANDO...' : 'INICIAR SESIÓN'}
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
