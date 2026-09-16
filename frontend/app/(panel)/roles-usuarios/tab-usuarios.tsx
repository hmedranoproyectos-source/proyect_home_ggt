'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useState } from 'react'
import { CampoFiltro } from '@/componentes/campo-filtro'
import { listarRoles } from '@/lib/servicios/rolesApi'
import {
	actualizarUsuario,
	crearUsuario,
	eliminarUsuario,
	listarUsuarios,
} from '@/lib/servicios/usuariosApi'
import { sxBotonAzul, sxBotonVerde, sxEncabezadoTabla } from '@/lib/estilos-ui'
import { useSesion } from '@/lib/sesion-contexto'
import { colores, RADIO_CARD } from '@/lib/tema'
import { PERMISO_GESTIONAR_USUARIOS, tienePermiso } from '@/lib/permisos-rutas'
import type { RolApp, UsuarioApp } from '@/lib/tipos'

const CLAVE_MIN_LARGO = 8

export function TabUsuarios() {
	const { sesion } = useSesion()
	const idCia = sesion?.idCia
	const puedeGestionar = tienePermiso(
		sesion?.permisos ?? [],
		PERMISO_GESTIONAR_USUARIOS,
	)
	const [usuarios, setUsuarios] = useState<UsuarioApp[]>([])
	const [roles, setRoles] = useState<RolApp[]>([])
	const [cargando, setCargando] = useState(true)
	const [error, setError] = useState('')
	const [busqueda, setBusqueda] = useState('')
	const [rol, setRol] = useState('Todos')
	const [aplicado, setAplicado] = useState({ busqueda: '', rol: 'Todos' })
	const [dialogoAbierto, setDialogoAbierto] = useState(false)
	const [nuevoUsuario, setNuevoUsuario] = useState('')
	const [nuevaClave, setNuevaClave] = useState('')
	const [nuevosRoles, setNuevosRoles] = useState<number[]>([])
	const [errorDialogo, setErrorDialogo] = useState('')
	const [guardando, setGuardando] = useState(false)
	const [usuarioEditando, setUsuarioEditando] = useState<UsuarioApp | null>(null)
	const [claveEdicion, setClaveEdicion] = useState('')
	const [rolesEdicion, setRolesEdicion] = useState<number[]>([])
	const [errorEdicion, setErrorEdicion] = useState('')
	const [guardandoEdicion, setGuardandoEdicion] = useState(false)
	const [usuarioEliminando, setUsuarioEliminando] = useState<UsuarioApp | null>(null)
	const [errorEliminar, setErrorEliminar] = useState('')
	const [eliminando, setEliminando] = useState(false)

	useEffect(() => {
		if (!idCia) {
			return
		}
		let cancelado = false
		setCargando(true)
		setError('')
		Promise.all([listarUsuarios(), listarRoles()])
			.then(([usuariosApi, rolesApi]) => {
				if (cancelado) return
				setUsuarios(usuariosApi)
				setRoles(rolesApi)
			})
			.catch(() => {
				if (!cancelado) {
					setError('No se pudieron cargar los usuarios.')
				}
			})
			.finally(() => {
				if (!cancelado) setCargando(false)
			})
		return () => {
			cancelado = true
		}
	}, [idCia])

	function abrirDialogo() {
		setNuevoUsuario('')
		setNuevaClave('')
		setNuevosRoles([])
		setErrorDialogo('')
		setDialogoAbierto(true)
	}

	function alternarRolNuevo(idRol: number) {
		setNuevosRoles((prev) =>
			prev.includes(idRol)
				? prev.filter((id) => id !== idRol)
				: [...prev, idRol],
		)
	}

	async function guardarUsuario() {
		if (!nuevoUsuario.trim()) {
			setErrorDialogo('El nombre de usuario es obligatorio.')
			return
		}
		if (nuevaClave.length < CLAVE_MIN_LARGO) {
			setErrorDialogo(`La contraseña debe tener al menos ${CLAVE_MIN_LARGO} caracteres.`)
			return
		}
		if (nuevosRoles.length === 0) {
			setErrorDialogo('Seleccione al menos un rol.')
			return
		}

		setGuardando(true)
		setErrorDialogo('')
		try {
			const creado = await crearUsuario({
				usuario: nuevoUsuario.trim(),
				clave: nuevaClave,
				roles: nuevosRoles,
			})
			setUsuarios((prev) => [...prev, creado].sort((a, b) => a.usuario.localeCompare(b.usuario)))
			setDialogoAbierto(false)
		} catch (err: any) {
			setErrorDialogo(
				err?.response?.data?.error || 'No se pudo crear el usuario.',
			)
		} finally {
			setGuardando(false)
		}
	}

	function abrirEdicion(usuario: UsuarioApp) {
		setUsuarioEditando(usuario)
		setClaveEdicion('')
		setRolesEdicion(usuario.roles.map((r) => r.id))
		setErrorEdicion('')
	}

	function alternarRolEdicion(idRol: number) {
		setRolesEdicion((prev) =>
			prev.includes(idRol)
				? prev.filter((id) => id !== idRol)
				: [...prev, idRol],
		)
	}

	async function guardarEdicion() {
		if (!usuarioEditando) return
		if (claveEdicion && claveEdicion.length < CLAVE_MIN_LARGO) {
			setErrorEdicion(`La contraseña debe tener al menos ${CLAVE_MIN_LARGO} caracteres.`)
			return
		}
		if (rolesEdicion.length === 0) {
			setErrorEdicion('Seleccione al menos un rol.')
			return
		}

		setGuardandoEdicion(true)
		setErrorEdicion('')
		try {
			const actualizado = await actualizarUsuario(usuarioEditando.id, {
				clave: claveEdicion || undefined,
				roles: rolesEdicion,
			})
			setUsuarios((prev) =>
				prev.map((u) => (u.id === actualizado.id ? actualizado : u)),
			)
			setUsuarioEditando(null)
		} catch (err: any) {
			setErrorEdicion(
				err?.response?.data?.error || 'No se pudo actualizar el usuario.',
			)
		} finally {
			setGuardandoEdicion(false)
		}
	}

	async function confirmarEliminar() {
		if (!usuarioEliminando) return

		setEliminando(true)
		setErrorEliminar('')
		try {
			await eliminarUsuario(usuarioEliminando.id)
			setUsuarios((prev) => prev.filter((u) => u.id !== usuarioEliminando.id))
			setUsuarioEliminando(null)
		} catch (err: any) {
			setErrorEliminar(
				err?.response?.data?.error || 'No se pudo eliminar el usuario.',
			)
		} finally {
			setEliminando(false)
		}
	}

	useEffect(() => {
		setRol('Todos')
		setAplicado((prev) => ({ ...prev, rol: 'Todos' }))
	}, [idCia])

	const filtrados = useMemo(() => {
		return usuarios.filter((usuario) => {
			if (
				aplicado.rol !== 'Todos' &&
				!usuario.roles.some((r) => r.descripcion === aplicado.rol)
			) {
				return false
			}
			if (!aplicado.busqueda) {
				return true
			}
			const q = aplicado.busqueda.toLowerCase()
			return (
				usuario.usuario.toLowerCase().includes(q) ||
				usuario.roles.some((r) =>
					r.descripcion.toLowerCase().includes(q),
				)
			)
		})
	}, [usuarios, aplicado])

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
						placeholder="Nombre de usuario o rol"
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
							<MenuItem key={item.id} value={item.descripcion}>
								{item.descripcion}
							</MenuItem>
						))}
					</TextField>
				</CampoFiltro>
				<Button
					variant="contained"
					onClick={() => setAplicado({ busqueda, rol })}
					sx={sxBotonAzul}
				>
					FILTRAR
				</Button>
				<Button
					variant="contained"
					onClick={abrirDialogo}
					disabled={!puedeGestionar}
					sx={sxBotonVerde}
				>
					CREAR
				</Button>
			</Stack>

			{error ? (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			) : null}

			<Paper sx={{ borderRadius: RADIO_CARD, overflow: 'hidden' }}>
				<Table
					sx={{
						'& thead .MuiTableCell-root': { fontSize: 14 },
						'& tbody .MuiTableCell-root': {
							py: 0.75,
							fontSize: 13,
						},
						'& .MuiButton-sizeSmall': {
							fontSize: 13,
							py: 0.25,
							px: 1.25,
							minHeight: 28,
						},
						'& .MuiChip-label': { fontSize: 13 },
					}}
				>
					<TableHead
						sx={{
							...sxEncabezadoTabla,
							'& .MuiTableCell-root': {
								fontWeight: 800,
								fontSize: 14,
							},
						}}
					>
						<TableRow>
							<TableCell>Usuario</TableCell>
							<TableCell>Roles</TableCell>
							<TableCell>Acción</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{filtrados.map((usuario) => (
							<TableRow key={usuario.id}>
								<TableCell>{usuario.usuario}</TableCell>
								<TableCell>
									<Stack
										direction="row"
										spacing={0.5}
										sx={{ flexWrap: 'wrap', rowGap: 0.25 }}
									>
										{usuario.roles.map((r) => (
											<Chip
												key={r.id}
												label={r.descripcion}
												size="small"
											/>
										))}
									</Stack>
								</TableCell>
								<TableCell>
									<Stack direction="row" spacing={1}>
										<Button
											size="small"
											variant="outlined"
											disabled={!puedeGestionar}
											onClick={() => abrirEdicion(usuario)}
										>
											Editar
										</Button>
										<Button
											size="small"
											variant="outlined"
											color="error"
											disabled={!puedeGestionar}
											onClick={() => {
												setUsuarioEliminando(usuario)
												setErrorEliminar('')
											}}
										>
											Eliminar
										</Button>
									</Stack>
								</TableCell>
							</TableRow>
						))}
						{!cargando && filtrados.length === 0 ? (
							<TableRow>
								<TableCell colSpan={3}>
									<Typography
										variant="body2"
										sx={{ color: colores.textoSecundario }}
									>
										No hay usuarios para mostrar.
									</Typography>
								</TableCell>
							</TableRow>
						) : null}
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

			<Dialog
				open={dialogoAbierto}
				onClose={() => !guardando && setDialogoAbierto(false)}
				fullWidth
				maxWidth="xs"
			>
				<DialogTitle>Crear usuario</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 0.5 }}>
						{errorDialogo ? (
							<Alert severity="error">{errorDialogo}</Alert>
						) : null}
						<TextField
							label="Nombre de usuario"
							fullWidth
							size="small"
							value={nuevoUsuario}
							onChange={(e) => setNuevoUsuario(e.target.value)}
							disabled={guardando}
						/>
						<TextField
							label="Contraseña"
							type="password"
							fullWidth
							size="small"
							value={nuevaClave}
							onChange={(e) => setNuevaClave(e.target.value)}
							disabled={guardando}
							helperText={`Mínimo ${CLAVE_MIN_LARGO} caracteres`}
						/>
						<Box>
							<Typography variant="body2" sx={{ mb: 0.5, fontWeight: 700 }}>
								Roles en esta compañía
							</Typography>
							<FormGroup>
								{roles.map((item) => (
									<FormControlLabel
										key={item.id}
										control={
											<Checkbox
												checked={nuevosRoles.includes(item.id)}
												onChange={() => alternarRolNuevo(item.id)}
												disabled={guardando}
											/>
										}
										label={item.descripcion}
									/>
								))}
								{roles.length === 0 ? (
									<Typography variant="body2" sx={{ color: colores.textoSecundario }}>
										No hay roles definidos para esta compañía.
									</Typography>
								) : null}
							</FormGroup>
						</Box>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDialogoAbierto(false)} disabled={guardando}>
						Cancelar
					</Button>
					<Button
						variant="contained"
						onClick={guardarUsuario}
						disabled={guardando}
						sx={sxBotonAzul}
					>
						Guardar
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={usuarioEditando !== null}
				onClose={() => !guardandoEdicion && setUsuarioEditando(null)}
				fullWidth
				maxWidth="xs"
			>
				<DialogTitle>
					Editar usuario{usuarioEditando ? ` — ${usuarioEditando.usuario}` : ''}
				</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 0.5 }}>
						{errorEdicion ? (
							<Alert severity="error">{errorEdicion}</Alert>
						) : null}
						<TextField
							label="Nueva contraseña"
							type="password"
							fullWidth
							size="small"
							value={claveEdicion}
							onChange={(e) => setClaveEdicion(e.target.value)}
							disabled={guardandoEdicion}
							helperText={`Dejar en blanco para no cambiarla (mínimo ${CLAVE_MIN_LARGO} caracteres si se define)`}
						/>
						<Box>
							<Typography variant="body2" sx={{ mb: 0.5, fontWeight: 700 }}>
								Roles en esta compañía
							</Typography>
							<FormGroup>
								{roles.map((item) => (
									<FormControlLabel
										key={item.id}
										control={
											<Checkbox
												checked={rolesEdicion.includes(item.id)}
												onChange={() => alternarRolEdicion(item.id)}
												disabled={guardandoEdicion}
											/>
										}
										label={item.descripcion}
									/>
								))}
								{roles.length === 0 ? (
									<Typography variant="body2" sx={{ color: colores.textoSecundario }}>
										No hay roles definidos para esta compañía.
									</Typography>
								) : null}
							</FormGroup>
						</Box>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setUsuarioEditando(null)} disabled={guardandoEdicion}>
						Cancelar
					</Button>
					<Button
						variant="contained"
						onClick={guardarEdicion}
						disabled={guardandoEdicion}
						sx={sxBotonAzul}
					>
						Guardar
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={usuarioEliminando !== null}
				onClose={() => !eliminando && setUsuarioEliminando(null)}
				fullWidth
				maxWidth="xs"
			>
				<DialogTitle>Eliminar usuario</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 0.5 }}>
						{errorEliminar ? (
							<Alert severity="error">{errorEliminar}</Alert>
						) : null}
						<Typography variant="body2">
							¿Eliminar a <strong>{usuarioEliminando?.usuario}</strong>? El
							usuario quedará inactivo y no podrá iniciar sesión, pero su
							historial de auditoría se conserva.
						</Typography>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setUsuarioEliminando(null)} disabled={eliminando}>
						Cancelar
					</Button>
					<Button
						variant="contained"
						color="error"
						onClick={confirmarEliminar}
						disabled={eliminando}
					>
						Eliminar
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	)
}
