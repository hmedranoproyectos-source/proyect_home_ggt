'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'
import { CampoFiltro } from '@/componentes/campo-filtro'
import {
	contarCorreosBuzon,
	guardarConfigBuzon,
	obtenerConfigBuzon,
	probarConexionBuzon,
} from '@/lib/servicios/configBuzonApi'
import { sxBotonAzul, sxBotonVerde } from '@/lib/estilos-ui'
import { useSesion } from '@/lib/sesion-contexto'
import { colores, RADIO_CARD } from '@/lib/tema'
import {
	PERMISO_GESTIONAR_CONFIG_EMAIL,
	tienePermiso,
} from '@/lib/permisos-rutas'

const CIFRADOS = ['TLS', 'SSL', 'NONE'] as const

function mensajeErrorBuzon(crudo: unknown, respaldo: string): string {
	const texto = String(crudo || '').toLowerCase()
	if (texto.includes('no supported authentication method')) {
		return (
			'No hay un método de autenticación compatible. ' +
			'No se pudo iniciar sesión. Revisa usuario, clave y que el ' +
			'servidor permita acceso por contraseña.'
		)
	}
	if (texto.includes('timed out') || texto.includes('timeout')) {
		return 'Se agotó el tiempo de espera al conectar con el buzón.'
	}
	if (
		texto.includes('authentication failed') ||
		texto.includes('invalid credentials') ||
		texto.includes('invalid login')
	) {
		return 'Usuario o clave incorrectos. No se pudo iniciar sesión.'
	}
	if (typeof crudo === 'string' && crudo.trim()) {
		return crudo
	}
	return respaldo
}

export function TabBuzon() {
	const { sesion } = useSesion()
	const idCia = sesion?.idCia
	const puedeGestionar = tienePermiso(
		sesion?.permisos ?? [],
		PERMISO_GESTIONAR_CONFIG_EMAIL,
	)

	const [descripcion, setDescripcion] = useState('')
	const [servidor, setServidor] = useState('')
	const [puerto, setPuerto] = useState('993')
	const [cifrado, setCifrado] = useState('TLS')
	const [usuario, setUsuario] = useState('')
	const [clave, setClave] = useState('')
	const [carpeta, setCarpeta] = useState('INBOX')
	const [rutaDescargas, setRutaDescargas] = useState('')
	const [tieneClave, setTieneClave] = useState(false)
	const [cargando, setCargando] = useState(false)
	const [guardando, setGuardando] = useState(false)
	const [probando, setProbando] = useState(false)
	const [contando, setContando] = useState(false)
	const [error, setError] = useState('')
	const [ok, setOk] = useState('')
	const [conteo, setConteo] = useState<{
		total: number
		noLeidos: number
		mailbox: string
	} | null>(null)

	useEffect(() => {
		if (!idCia) {
			return
		}
		let cancelado = false
		setCargando(true)
		setError('')
		setOk('')
		setConteo(null)
		setClave('')
		obtenerConfigBuzon()
			.then((config) => {
				if (cancelado) return
				setDescripcion(config.descripcion)
				setServidor(config.servidor)
				setPuerto(String(config.puerto))
				setCifrado(config.cifrado)
				setUsuario(config.usuario)
				setCarpeta(config.carpeta)
				setRutaDescargas(config.rutaDescargas || '')
				setTieneClave(config.tieneClave)
			})
			.catch((err: any) => {
				if (cancelado) return
				setError(
					mensajeErrorBuzon(
						err?.response?.data?.error,
						'No se pudo cargar la configuración del buzón.',
					),
				)
			})
			.finally(() => {
				if (!cancelado) setCargando(false)
			})
		return () => {
			cancelado = true
		}
	}, [idCia])

	async function handleGuardar() {
		setGuardando(true)
		setError('')
		setOk('')
		try {
			const guardada = await guardarConfigBuzon({
				descripcion: descripcion.trim(),
				protocolo: 'IMAP',
				servidor: servidor.trim(),
				puerto: Number(puerto),
				cifrado,
				usuario: usuario.trim(),
				clave: clave.trim() || undefined,
				carpeta: carpeta.trim() || 'INBOX',
				rutaDescargas: rutaDescargas.trim(),
			})
			setTieneClave(guardada.tieneClave)
			setClave('')
			setOk('Configuración del buzón guardada.')
		} catch (err: any) {
			setError(
				mensajeErrorBuzon(
					err?.response?.data?.error,
					'No se pudo guardar la configuración.',
				),
			)
		} finally {
			setGuardando(false)
		}
	}

	async function handleProbar() {
		setProbando(true)
		setError('')
		setOk('')
		try {
			const resultado = await probarConexionBuzon({
				servidor: servidor.trim(),
				puerto: Number(puerto),
				cifrado,
				usuario: usuario.trim(),
				clave: clave.trim() || undefined,
			})
			if (resultado.ok) {
				setOk('Conexión IMAP correcta.')
			} else {
				setError(
					mensajeErrorBuzon(
						resultado.error,
						'No se pudo conectar al buzón.',
					),
				)
			}
		} catch (err: any) {
			setError(
				mensajeErrorBuzon(
					err?.response?.data?.error,
					'No se pudo conectar al buzón.',
				),
			)
		} finally {
			setProbando(false)
		}
	}

	async function handleContar() {
		setContando(true)
		setError('')
		setOk('')
		try {
			const resultado = await contarCorreosBuzon()
			setConteo(resultado)
			setOk(
				`${resultado.mailbox}: ${resultado.total} correos, ${resultado.noLeidos} no leídos.`,
			)
		} catch (err: any) {
			setError(
				mensajeErrorBuzon(
					err?.response?.data?.error,
					'No se pudo consultar el buzón.',
				),
			)
		} finally {
			setContando(false)
		}
	}

	const ocupado = cargando || guardando || probando || contando

	return (
		<Box>
			<Paper sx={{ p: 3, borderRadius: RADIO_CARD }}>
				<Stack spacing={2}>
					{!puedeGestionar ? (
						<Alert severity="info">
							No tienes permiso para guardar o probar el
							buzón (gestionar_config_email).
						</Alert>
					) : null}
					{error ? <Alert severity="error">{error}</Alert> : null}
					{ok ? <Alert severity="success">{ok}</Alert> : null}

					<CampoFiltro etiqueta="Descripción">
						<TextField
							fullWidth
							size="small"
							value={descripcion}
							onChange={(e) => setDescripcion(e.target.value)}
							disabled={ocupado || !puedeGestionar}
						/>
					</CampoFiltro>

					<Stack
						direction={{ xs: 'column', md: 'row' }}
						spacing={2}
					>
						<CampoFiltro etiqueta="Servidor IMAP" sx={{ flex: 1 }}>
							<TextField
								fullWidth
								size="small"
								value={servidor}
								onChange={(e) => setServidor(e.target.value)}
								disabled={ocupado || !puedeGestionar}
								placeholder="imap.gmail.com"
							/>
						</CampoFiltro>
						<CampoFiltro etiqueta="Puerto" sx={{ width: { md: 140 } }}>
							<TextField
								fullWidth
								size="small"
								value={puerto}
								onChange={(e) => setPuerto(e.target.value)}
								disabled={ocupado || !puedeGestionar}
							/>
						</CampoFiltro>
						<CampoFiltro etiqueta="Cifrado" sx={{ width: { md: 160 } }}>
							<TextField
								select
								fullWidth
								size="small"
								value={cifrado}
								onChange={(e) => setCifrado(e.target.value)}
								disabled={ocupado || !puedeGestionar}
							>
								{CIFRADOS.map((item) => (
									<MenuItem key={item} value={item}>
										{item}
									</MenuItem>
								))}
							</TextField>
						</CampoFiltro>
					</Stack>

					<Stack
						direction={{ xs: 'column', md: 'row' }}
						spacing={2}
					>
						<CampoFiltro etiqueta="Usuario" sx={{ flex: 1 }}>
							<TextField
								fullWidth
								size="small"
								value={usuario}
								onChange={(e) => setUsuario(e.target.value)}
								disabled={ocupado || !puedeGestionar}
							/>
						</CampoFiltro>
						<CampoFiltro etiqueta="Clave" sx={{ flex: 1 }}>
							<TextField
								fullWidth
								size="small"
								type="password"
								value={clave}
								onChange={(e) => setClave(e.target.value)}
								disabled={ocupado || !puedeGestionar}
								placeholder={
									tieneClave
										? 'Dejar vacío para no cambiarla'
										: 'Contraseña o clave de aplicación'
								}
								autoComplete="new-password"
							/>
						</CampoFiltro>
					</Stack>

					<CampoFiltro etiqueta="Carpeta IMAP">
						<TextField
							fullWidth
							size="small"
							value={carpeta}
							onChange={(e) => setCarpeta(e.target.value)}
							disabled={ocupado || !puedeGestionar}
							helperText="Carpeta que escanea el worker (INBOX por defecto)."
						/>
					</CampoFiltro>

					<CampoFiltro etiqueta="Ruta de descargas">
						<TextField
							fullWidth
							size="small"
							value={rutaDescargas}
							onChange={(e) => setRutaDescargas(e.target.value)}
							disabled={ocupado || !puedeGestionar}
							placeholder="duquin"
							helperText={
								'Subcarpeta dentro de C:\\Documentos\\DescargasFacturas ' +
								'(la carpeta base del servidor) donde se guardan los ' +
								'adjuntos de cada correo. Vacío = raíz de esa carpeta.'
							}
						/>
					</CampoFiltro>

					<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
						<Button
							variant="contained"
							onClick={handleGuardar}
							disabled={ocupado || !puedeGestionar}
							sx={sxBotonVerde}
						>
							GUARDAR
						</Button>
						<Button
							variant="contained"
							onClick={handleProbar}
							disabled={ocupado || !puedeGestionar}
							sx={sxBotonAzul}
						>
							PROBAR CONEXIÓN
						</Button>
						<Button
							variant="outlined"
							onClick={handleContar}
							disabled={ocupado || !puedeGestionar}
						>
							CONTAR CORREOS
						</Button>
					</Stack>
				</Stack>
			</Paper>

			<Box
				sx={{
					mt: 2,
					px: 3,
					py: 2,
					borderRadius: RADIO_CARD,
					backgroundColor: colores.azulSuave,
				}}
			>
				<Typography sx={{ mb: 0.5, fontWeight: 700 }}>
					Escaneo automático (RP-06)
				</Typography>
				<Typography variant="body2">
					El worker revisa este buzón cada 10 minutos, de 07:00 a
					19:00 (hora Colombia). La clave no se muestra. Si la dejas
					vacía al guardar, se conserva la actual.
					{conteo
						? ` Último conteo en ${conteo.mailbox}: ${conteo.total} / ${conteo.noLeidos} no leídos.`
						: ''}
				</Typography>
			</Box>
		</Box>
	)
}
