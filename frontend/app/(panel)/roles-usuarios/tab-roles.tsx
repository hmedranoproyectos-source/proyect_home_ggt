'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
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
import { listarPermisos } from '@/lib/servicios/permisosApi'
import {
	actualizarPermisosDeRol,
	crearRol,
	eliminarRol,
	listarRoles,
	permisosDeRol,
} from '@/lib/servicios/rolesApi'
import { sxBotonAzul, sxBotonVerde, sxEncabezadoTabla } from '@/lib/estilos-ui'
import { useSesion } from '@/lib/sesion-contexto'
import { colores, RADIO_CARD } from '@/lib/tema'
import { PERMISO_GESTIONAR_ROLES, tienePermiso } from '@/lib/permisos-rutas'
import type { PermisoCatalogo, RolApp } from '@/lib/tipos'

export function TabRoles() {
	const { sesion } = useSesion()
	const idCia = sesion?.idCia
	const puedeGestionar = tienePermiso(
		sesion?.permisos ?? [],
		PERMISO_GESTIONAR_ROLES,
	)
	const [roles, setRoles] = useState<RolApp[]>([])
	const [catalogoPermisos, setCatalogoPermisos] = useState<
		PermisoCatalogo[]
	>([])
	const [rolActivo, setRolActivo] = useState<RolApp | null>(null)
	const [permisosDelRol, setPermisosDelRol] = useState<Set<number>>(
		new Set(),
	)
	const [permisosEnEdicion, setPermisosEnEdicion] = useState<Set<number>>(
		new Set(),
	)
	const [errorPermisos, setErrorPermisos] = useState('')
	const [guardandoPermisos, setGuardandoPermisos] = useState(false)
	const [error, setError] = useState('')
	const [dialogoAbierto, setDialogoAbierto] = useState(false)
	const [nuevaDescripcion, setNuevaDescripcion] = useState('')
	const [nuevosPermisos, setNuevosPermisos] = useState<number[]>([])
	const [errorDialogo, setErrorDialogo] = useState('')
	const [guardando, setGuardando] = useState(false)
	const [rolEliminando, setRolEliminando] = useState<RolApp | null>(null)
	const [errorEliminar, setErrorEliminar] = useState('')
	const [eliminando, setEliminando] = useState(false)

	useEffect(() => {
		if (!idCia) {
			return
		}
		let cancelado = false
		setError('')
		Promise.all([listarRoles(), listarPermisos()])
			.then(([rolesApi, permisosApi]) => {
				if (cancelado) return
				setRoles(rolesApi)
				setCatalogoPermisos(permisosApi)
				setRolActivo(rolesApi[0] ?? null)
			})
			.catch(() => {
				if (!cancelado) {
					setError('No se pudieron cargar los roles.')
				}
			})
		return () => {
			cancelado = true
		}
	}, [idCia])

	function abrirDialogo() {
		setNuevaDescripcion('')
		setNuevosPermisos([])
		setErrorDialogo('')
		setDialogoAbierto(true)
	}

	function alternarPermisoNuevo(idPermiso: number) {
		setNuevosPermisos((prev) =>
			prev.includes(idPermiso)
				? prev.filter((id) => id !== idPermiso)
				: [...prev, idPermiso],
		)
	}

	async function guardarRol() {
		if (!nuevaDescripcion.trim()) {
			setErrorDialogo('La descripción del rol es obligatoria.')
			return
		}

		setGuardando(true)
		setErrorDialogo('')
		try {
			const creado = await crearRol({
				descripcion: nuevaDescripcion.trim(),
				permisos: nuevosPermisos,
			})
			setRoles((prev) =>
				[...prev, creado].sort((a, b) => a.descripcion.localeCompare(b.descripcion)),
			)
			setDialogoAbierto(false)
		} catch (err: any) {
			setErrorDialogo(
				err?.response?.data?.error || 'No se pudo crear el rol.',
			)
		} finally {
			setGuardando(false)
		}
	}

	useEffect(() => {
		if (!rolActivo) {
			setPermisosDelRol(new Set())
			setPermisosEnEdicion(new Set())
			return
		}
		let cancelado = false
		setErrorPermisos('')
		permisosDeRol(rolActivo.id)
			.then((permisos) => {
				if (!cancelado) {
					const ids = new Set(permisos.map((p) => p.id))
					setPermisosDelRol(ids)
					setPermisosEnEdicion(new Set(ids))
				}
			})
			.catch(() => {
				if (!cancelado) {
					setError('No se pudieron cargar los permisos del rol.')
				}
			})
		return () => {
			cancelado = true
		}
	}, [rolActivo])

	function alternarPermisoEdicion(idPermiso: number) {
		setPermisosEnEdicion((prev) => {
			const siguiente = new Set(prev)
			if (siguiente.has(idPermiso)) {
				siguiente.delete(idPermiso)
			} else {
				siguiente.add(idPermiso)
			}
			return siguiente
		})
	}

	const hayCambiosPermisos = useMemo(() => {
		if (permisosDelRol.size !== permisosEnEdicion.size) return true
		for (const id of permisosEnEdicion) {
			if (!permisosDelRol.has(id)) return true
		}
		return false
	}, [permisosDelRol, permisosEnEdicion])

	async function guardarPermisos() {
		if (!rolActivo) return

		setGuardandoPermisos(true)
		setErrorPermisos('')
		try {
			const idsPermisos = Array.from(permisosEnEdicion)
			await actualizarPermisosDeRol(rolActivo.id, idsPermisos)
			setPermisosDelRol(new Set(idsPermisos))
		} catch (err: any) {
			setErrorPermisos(
				err?.response?.data?.error || 'No se pudieron guardar los permisos.',
			)
		} finally {
			setGuardandoPermisos(false)
		}
	}

	function cancelarEdicionPermisos() {
		setPermisosEnEdicion(new Set(permisosDelRol))
		setErrorPermisos('')
	}

	async function confirmarEliminarRol() {
		if (!rolEliminando) return

		setEliminando(true)
		setErrorEliminar('')
		try {
			await eliminarRol(rolEliminando.id)
			setRoles((prev) => prev.filter((r) => r.id !== rolEliminando.id))
			if (rolActivo?.id === rolEliminando.id) {
				setRolActivo(null)
			}
			setRolEliminando(null)
		} catch (err: any) {
			setErrorEliminar(
				err?.response?.data?.error || 'No se pudo eliminar el rol.',
			)
		} finally {
			setEliminando(false)
		}
	}

	const totalPermisos = useMemo(
		() => catalogoPermisos.length,
		[catalogoPermisos],
	)

	return (
		<Box>
			<Stack
				direction="row"
				sx={{
					mb: 2,
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<Typography variant="body2">
					Roles de {sesion?.razonSocial}. Los permisos son
					del catálogo global; lo que cambia por compañía
					es qué rol los tiene.
				</Typography>
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

			<Paper
				sx={{ borderRadius: RADIO_CARD, overflow: 'hidden', mb: 2 }}
			>
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
							<TableCell>Rol</TableCell>
							<TableCell>Acción</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{roles.map((rolItem) => (
							<TableRow
								key={rolItem.id}
								selected={rolActivo?.id === rolItem.id}
							>
								<TableCell>{rolItem.descripcion}</TableCell>
								<TableCell>
									<Stack direction="row" spacing={1}>
										<Button
											size="small"
											variant="outlined"
											onClick={() => setRolActivo(rolItem)}
										>
											Ver permisos
										</Button>
										<Button
											size="small"
											variant="outlined"
											color="error"
											disabled={!puedeGestionar}
											onClick={() => {
												setRolEliminando(rolItem)
												setErrorEliminar('')
											}}
										>
											Eliminar
										</Button>
									</Stack>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Paper>

			{rolActivo ? (
				<Paper sx={{ p: 3, borderRadius: RADIO_CARD }}>
					<Stack
						direction="row"
						sx={{
							justifyContent: 'space-between',
							alignItems: 'center',
							mb: 2,
						}}
					>
						<Typography variant="h3">
							Permisos de {rolActivo.descripcion} (
							{permisosEnEdicion.size} de {totalPermisos})
						</Typography>
						{hayCambiosPermisos ? (
							<Stack direction="row" spacing={1}>
								<Button
									size="small"
									onClick={cancelarEdicionPermisos}
									disabled={guardandoPermisos}
								>
									Cancelar
								</Button>
								<Button
									size="small"
									variant="contained"
									onClick={guardarPermisos}
									disabled={guardandoPermisos}
									sx={sxBotonAzul}
								>
									Guardar
								</Button>
							</Stack>
						) : null}
					</Stack>

					{errorPermisos ? (
						<Alert severity="error" sx={{ mb: 2 }}>
							{errorPermisos}
						</Alert>
					) : null}

					<Table
						sx={{
							'& thead .MuiTableCell-root': { fontSize: 14 },
							'& tbody .MuiTableCell-root': {
								py: 0.5,
								fontSize: 13,
							},
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
								<TableCell>Permiso</TableCell>
								<TableCell align="center">
									Asignado
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{catalogoPermisos.map((permiso) => (
								<TableRow key={permiso.id}>
									<TableCell>
										{permiso.descripcion}
									</TableCell>
									<TableCell align="center">
										<Checkbox
											size="small"
											checked={permisosEnEdicion.has(
												permiso.id,
											)}
											onChange={() =>
												alternarPermisoEdicion(permiso.id)
											}
											disabled={guardandoPermisos || !puedeGestionar}
											sx={{
												p: 0.5,
												color: colores.okFg,
												'&.Mui-checked': {
													color: colores.okFg,
												},
											}}
										/>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</Paper>
			) : null}

			<Dialog
				open={dialogoAbierto}
				onClose={() => !guardando && setDialogoAbierto(false)}
				fullWidth
				maxWidth="xs"
			>
				<DialogTitle>Crear rol</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 0.5 }}>
						{errorDialogo ? (
							<Alert severity="error">{errorDialogo}</Alert>
						) : null}
						<TextField
							label="Descripción del rol"
							fullWidth
							size="small"
							value={nuevaDescripcion}
							onChange={(e) => setNuevaDescripcion(e.target.value)}
							disabled={guardando}
						/>
						<Box>
							<Typography variant="body2" sx={{ mb: 0.5, fontWeight: 700 }}>
								Permisos a asignar
							</Typography>
							<FormGroup>
								{catalogoPermisos.map((permiso) => (
									<FormControlLabel
										key={permiso.id}
										sx={{ my: 0, py: 0 }}
										control={
											<Checkbox
												size="small"
												checked={nuevosPermisos.includes(permiso.id)}
												onChange={() => alternarPermisoNuevo(permiso.id)}
												disabled={guardando}
												sx={{ py: 0.25 }}
											/>
										}
										label={permiso.descripcion}
									/>
								))}
								{catalogoPermisos.length === 0 ? (
									<Typography variant="body2" sx={{ color: colores.textoSecundario }}>
										No hay permisos en el catálogo.
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
						onClick={guardarRol}
						disabled={guardando}
						sx={sxBotonAzul}
					>
						Guardar
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={rolEliminando !== null}
				onClose={() => !eliminando && setRolEliminando(null)}
				fullWidth
				maxWidth="xs"
			>
				<DialogTitle>Eliminar rol</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 0.5 }}>
						{errorEliminar ? (
							<Alert severity="error">{errorEliminar}</Alert>
						) : null}
						<Typography variant="body2">
							¿Eliminar el rol <strong>{rolEliminando?.descripcion}</strong>?
							Solo se puede eliminar si ningún usuario activo lo tiene
							asignado.
						</Typography>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setRolEliminando(null)} disabled={eliminando}>
						Cancelar
					</Button>
					<Button
						variant="contained"
						color="error"
						onClick={confirmarEliminarRol}
						disabled={eliminando}
					>
						Eliminar
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	)
}
