'use client'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useEffect, useMemo, useState } from 'react'
import { CampoFiltro } from '@/componentes/campo-filtro'
import { ChipUsuario } from '@/componentes/chip-estado'
import { USUARIOS, rolesDeCia } from '@/lib/datos-mock'
import {
	sxBotonAzul,
	sxBotonVerde,
	sxEncabezadoTabla,
} from '@/lib/estilos-ui'
import { useSesion } from '@/lib/sesion-contexto'
import { colores, RADIO_CARD } from '@/lib/tema'
import type { UsuarioApp } from '@/lib/tipos'

export function TabUsuarios() {
	const { sesion } = useSesion()
	const idCia = sesion?.idCia ?? 1
	const roles = useMemo(() => rolesDeCia(idCia), [idCia])
	const nombresRol = useMemo(
		() => roles.map((item) => item.descripcion),
		[roles],
	)
	const [busqueda, setBusqueda] = useState('')
	const [rol, setRol] = useState('Todos')
	const [estado, setEstado] = useState('Activos')
	const [lista, setLista] = useState<UsuarioApp[]>(USUARIOS)
	const [aplicado, setAplicado] = useState({
		busqueda: '',
		rol: 'Todos',
		estado: 'Activos',
	})
	const [editando, setEditando] = useState<UsuarioApp | null>(null)
	const [creando, setCreando] = useState(false)
	const [aviso, setAviso] = useState('')

	useEffect(() => {
		setRol('Todos')
		setAplicado((prev) => ({ ...prev, rol: 'Todos' }))
	}, [idCia])

	const filtrados = useMemo(() => {
		return lista.filter((usuario) => {
			if (
				aplicado.rol !== 'Todos' &&
				usuario.rol !== aplicado.rol
			) {
				return false
			}
			if (
				aplicado.estado === 'Activos' &&
				usuario.estado !== 'Activo'
			) {
				return false
			}
			if (
				aplicado.estado === 'Inactivos' &&
				usuario.estado !== 'Inactivo'
			) {
				return false
			}
			if (!aplicado.busqueda) {
				return true
			}
			const q = aplicado.busqueda.toLowerCase()
			return (
				usuario.usuario.toLowerCase().includes(q) ||
				usuario.nombre.toLowerCase().includes(q) ||
				usuario.rol.toLowerCase().includes(q)
			)
		})
	}, [lista, aplicado])

	function handleGuardar(usuario: UsuarioApp, esNuevo: boolean) {
		setLista((actual) => {
			if (esNuevo) {
				return [usuario, ...actual]
			}
			return actual.map((item) =>
				item.usuario === usuario.usuario ? usuario : item,
			)
		})
		setCreando(false)
		setEditando(null)
		setAviso(
			esNuevo
				? 'Usuario creado y asignado a esta compañía.'
				: 'Usuario actualizado.',
		)
	}

	return (
		<Box>
			<Stack
				direction={{ xs: 'column', md: 'row' }}
				spacing={1.5}
				sx={{ mb: 2, alignItems: { md: 'flex-end' } }}
			>
				<CampoFiltro
					etiqueta="Buscar usuario"
					sx={{ flex: 1, minWidth: 220 }}
				>
					<TextField
						fullWidth
						size="small"
						placeholder="Nombre, correo o rol"
						value={busqueda}
						onChange={(e) => setBusqueda(e.target.value)}
					/>
				</CampoFiltro>
				<CampoFiltro etiqueta="Rol" sx={{ minWidth: 160 }}>
					<TextField
						select
						fullWidth
						size="small"
						value={rol}
						onChange={(e) => setRol(e.target.value)}
					>
						<MenuItem value="Todos">Todos</MenuItem>
						{roles.map((item) => (
							<MenuItem
								key={item.id}
								value={item.descripcion}
							>
								{item.descripcion}
							</MenuItem>
						))}
					</TextField>
				</CampoFiltro>
				<CampoFiltro etiqueta="Estado" sx={{ minWidth: 140 }}>
					<TextField
						select
						fullWidth
						size="small"
						value={estado}
						onChange={(e) => setEstado(e.target.value)}
					>
						<MenuItem value="Todos">Todos</MenuItem>
						<MenuItem value="Activos">Activos</MenuItem>
						<MenuItem value="Inactivos">Inactivos</MenuItem>
					</TextField>
				</CampoFiltro>
				<Button
					variant="contained"
					onClick={() =>
						setAplicado({ busqueda, rol, estado })
					}
					sx={sxBotonAzul}
				>
					FILTRAR
				</Button>
				<Button
					variant="contained"
					onClick={() => setCreando(true)}
					sx={sxBotonVerde}
				>
					CREAR
				</Button>
			</Stack>

			<Paper sx={{ borderRadius: RADIO_CARD, overflow: 'hidden' }}>
				<Table>
					<TableHead sx={sxEncabezadoTabla}>
						<TableRow>
							<TableCell>Usuario</TableCell>
							<TableCell>Nombre</TableCell>
							<TableCell>Rol</TableCell>
							<TableCell>Estado</TableCell>
							<TableCell>Último acceso</TableCell>
							<TableCell>Acción</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{filtrados.map((usuario) => (
							<TableRow key={usuario.usuario}>
								<TableCell>{usuario.usuario}</TableCell>
								<TableCell>{usuario.nombre}</TableCell>
								<TableCell>{usuario.rol}</TableCell>
								<TableCell>
									<ChipUsuario estado={usuario.estado} />
								</TableCell>
								<TableCell>
									{usuario.ultimoAcceso}
								</TableCell>
								<TableCell>
									<Button
										size="small"
										variant="outlined"
										onClick={() => setEditando(usuario)}
									>
										Editar
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
				<Box
					sx={{
						px: 3,
						py: 2,
						backgroundColor: colores.novedadBg,
					}}
				>
					<Typography
						sx={{
							color: colores.novedadFg,
							mb: 0.5,
							fontWeight: 800,
						}}
					>
						CONTROL DE SEGURIDAD
					</Typography>
					<Typography variant="body2">
						No se visualizan contraseñas. El rol se asigna
						solo a la compañía activa vía usuarios_roles.
						Las acciones quedarán auditadas (RC-06).
					</Typography>
				</Box>
			</Paper>

			<DialogoUsuario
				abierto={creando}
				titulo="Crear usuario"
				roles={nombresRol}
				onClose={() => setCreando(false)}
				onGuardar={(usuario) => handleGuardar(usuario, true)}
			/>
			<DialogoUsuario
				abierto={Boolean(editando)}
				titulo="Editar usuario"
				inicial={editando ?? undefined}
				roles={nombresRol}
				onClose={() => setEditando(null)}
				onGuardar={(usuario) => handleGuardar(usuario, false)}
				onClaveCambiada={() =>
					setAviso('Clave actualizada (mock).')
				}
			/>
			<Snackbar
				open={Boolean(aviso)}
				autoHideDuration={3000}
				onClose={() => setAviso('')}
				message={aviso}
			/>
		</Box>
	)
}

function DialogoUsuario({
	abierto,
	titulo,
	inicial,
	roles,
	onClose,
	onGuardar,
	onClaveCambiada,
}: {
	abierto: boolean
	titulo: string
	inicial?: UsuarioApp
	roles: string[]
	onClose: () => void
	onGuardar: (usuario: UsuarioApp) => void
	onClaveCambiada?: () => void
}) {
	const [usuario, setUsuario] = useState('')
	const [nombre, setNombre] = useState('')
	const [rol, setRol] = useState(roles[0] ?? 'Recibidor')
	const [estado, setEstado] = useState<UsuarioApp['estado']>(
		'Activo',
	)
	const [clave, setClave] = useState('')
	const [confirmacion, setConfirmacion] = useState('')
	const [cambioClave, setCambioClave] = useState(false)
	const esNuevo = !inicial

	useEffect(() => {
		if (!abierto) {
			return
		}
		setUsuario(inicial?.usuario ?? '')
		setNombre(inicial?.nombre ?? '')
		setRol(inicial?.rol ?? roles[0] ?? 'Recibidor')
		setEstado(inicial?.estado ?? 'Activo')
		setClave('')
		setConfirmacion('')
		setCambioClave(false)
	}, [abierto, inicial])

	const claveOk =
		!esNuevo ||
		(clave.length > 0 && clave === confirmacion)

	return (
		<>
			<Dialog
				open={abierto}
				onClose={onClose}
				fullWidth
				slotProps={{
					paper: { sx: { borderRadius: RADIO_CARD } },
				}}
			>
				<DialogTitle>{titulo}</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<CampoFiltro etiqueta="Usuario *">
							<TextField
								fullWidth
								size="small"
								value={usuario}
								onChange={(e) =>
									setUsuario(e.target.value)
								}
								disabled={Boolean(inicial)}
							/>
						</CampoFiltro>
						<CampoFiltro etiqueta="Nombre *">
							<TextField
								fullWidth
								size="small"
								value={nombre}
								onChange={(e) =>
									setNombre(e.target.value)
								}
							/>
						</CampoFiltro>
						{esNuevo ? (
							<>
								<CampoFiltro etiqueta="Clave *">
									<TextField
										fullWidth
										size="small"
										type="password"
										value={clave}
										onChange={(e) =>
											setClave(e.target.value)
										}
									/>
								</CampoFiltro>
								<CampoFiltro etiqueta="Confirmar clave *">
									<TextField
										fullWidth
										size="small"
										type="password"
										value={confirmacion}
										onChange={(e) =>
											setConfirmacion(e.target.value)
										}
										error={
											confirmacion.length > 0 &&
											clave !== confirmacion
										}
										helperText={
											confirmacion.length > 0 &&
											clave !== confirmacion
												? 'Las claves no coinciden'
												: ' '
										}
									/>
								</CampoFiltro>
							</>
						) : (
							<Button
								variant="outlined"
								onClick={() => setCambioClave(true)}
								sx={{
									alignSelf: 'flex-start',
									borderRadius: RADIO_CARD,
								}}
							>
								Cambiar clave
							</Button>
						)}
						<CampoFiltro etiqueta="Rol *">
							<TextField
								select
								fullWidth
								size="small"
								value={rol}
								onChange={(e) => setRol(e.target.value)}
							>
								{roles.map((item) => (
									<MenuItem key={item} value={item}>
										{item}
									</MenuItem>
								))}
							</TextField>
						</CampoFiltro>
						<CampoFiltro etiqueta="Estado">
							<TextField
								select
								fullWidth
								size="small"
								value={estado}
								onChange={(e) =>
									setEstado(
										e.target.value as UsuarioApp['estado'],
									)
								}
							>
								<MenuItem value="Activo">Activo</MenuItem>
								<MenuItem value="Inactivo">
									Inactivo
								</MenuItem>
							</TextField>
						</CampoFiltro>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button
						variant="outlined"
						onClick={onClose}
						sx={{ borderRadius: RADIO_CARD }}
					>
						Cancelar
					</Button>
					<Button
						variant="contained"
						disabled={
							!usuario.trim() ||
							!nombre.trim() ||
							!claveOk
						}
						onClick={() =>
							onGuardar({
								usuario: usuario.trim(),
								nombre: nombre.trim(),
								rol,
								estado,
								ultimoAcceso:
									inicial?.ultimoAcceso ?? '-',
							})
						}
						sx={sxBotonAzul}
					>
						Guardar
					</Button>
				</DialogActions>
			</Dialog>
			<Dialog
				open={cambioClave}
				onClose={() => setCambioClave(false)}
				fullWidth
				slotProps={{
					paper: { sx: { borderRadius: RADIO_CARD } },
				}}
			>
				<DialogTitle>Cambiar clave</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<CampoFiltro etiqueta="Nueva clave *">
							<TextField
								fullWidth
								size="small"
								type="password"
								value={clave}
								onChange={(e) =>
									setClave(e.target.value)
								}
							/>
						</CampoFiltro>
						<CampoFiltro etiqueta="Confirmar clave *">
							<TextField
								fullWidth
								size="small"
								type="password"
								value={confirmacion}
								onChange={(e) =>
									setConfirmacion(e.target.value)
								}
							/>
						</CampoFiltro>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button
						variant="outlined"
						onClick={() => setCambioClave(false)}
						sx={{ borderRadius: RADIO_CARD }}
					>
						Cancelar
					</Button>
					<Button
						variant="contained"
						disabled={
							!clave || clave !== confirmacion
						}
						onClick={() => {
							setCambioClave(false)
							setClave('')
							setConfirmacion('')
							onClaveCambiada?.()
						}}
						sx={sxBotonAzul}
					>
						Guardar
					</Button>
				</DialogActions>
			</Dialog>
		</>
	)
}
