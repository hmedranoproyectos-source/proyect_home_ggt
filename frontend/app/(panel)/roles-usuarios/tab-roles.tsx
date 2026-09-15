'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
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
import { useEffect, useMemo, useState } from 'react'
import { CampoFiltro } from '@/componentes/campo-filtro'
import {
	PERMISOS_CATALOGO,
	ROLES_PERMISOS,
	rolesDeCia,
} from '@/lib/datos-mock'
import {
	sxBotonAzul,
	sxBotonVerde,
	sxEncabezadoTabla,
} from '@/lib/estilos-ui'
import { useSesion } from '@/lib/sesion-contexto'
import { colores, RADIO_CARD } from '@/lib/tema'
import type { RolApp, RolPermisoApp } from '@/lib/tipos'

export function TabRoles() {
	const { sesion } = useSesion()
	const idCia = sesion?.idCia ?? 1
	const [roles, setRoles] = useState(() => rolesDeCia(idCia))
	const [asignaciones, setAsignaciones] = useState<
		RolPermisoApp[]
	>(ROLES_PERMISOS)
	const [rolActivo, setRolActivo] = useState<RolApp | null>(null)
	const [creando, setCreando] = useState(false)
	const [nombreRol, setNombreRol] = useState('')
	const [aviso, setAviso] = useState('')

	useEffect(() => {
		const deCia = rolesDeCia(idCia)
		setRoles(deCia)
		setRolActivo(deCia[0] ?? null)
	}, [idCia])

	const idsActivos = useMemo(() => {
		if (!rolActivo) {
			return new Set<number>()
		}
		return new Set(
			asignaciones
				.filter(
					(item) =>
						item.idRol === rolActivo.id &&
						item.idCia === idCia,
				)
				.map((item) => item.idPermiso),
		)
	}, [asignaciones, rolActivo, idCia])

	function handleCrear() {
		const descripcion = nombreRol.trim()
		if (!descripcion) {
			return
		}
		const nuevo: RolApp = {
			id: Date.now(),
			idCia,
			descripcion,
		}
		setRoles((actual) => [...actual, nuevo])
		setRolActivo(nuevo)
		setNombreRol('')
		setCreando(false)
		setAviso('Rol creado para esta compañía.')
	}

	function handleToggle(idPermiso: number) {
		if (!rolActivo) {
			return
		}
		setAsignaciones((actual) => {
			const existe = actual.some(
				(item) =>
					item.idRol === rolActivo.id &&
					item.idPermiso === idPermiso &&
					item.idCia === idCia,
			)
			if (existe) {
				return actual.filter(
					(item) =>
						!(
							item.idRol === rolActivo.id &&
							item.idPermiso === idPermiso &&
							item.idCia === idCia
						),
				)
			}
			return [
				...actual,
				{
					idRol: rolActivo.id,
					idPermiso,
					idCia,
				},
			]
		})
	}

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
					onClick={() => setCreando(true)}
					sx={sxBotonVerde}
				>
					CREAR
				</Button>
			</Stack>

			<Paper
				sx={{ borderRadius: RADIO_CARD, overflow: 'hidden', mb: 2 }}
			>
				<Table>
					<TableHead sx={sxEncabezadoTabla}>
						<TableRow>
							<TableCell>Rol</TableCell>
							<TableCell>Permisos</TableCell>
							<TableCell>Acción</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{roles.map((rol) => {
							const cantidad = asignaciones.filter(
								(item) =>
									item.idRol === rol.id &&
									item.idCia === idCia,
							).length
							return (
								<TableRow
									key={rol.id}
									selected={rolActivo?.id === rol.id}
								>
									<TableCell>{rol.descripcion}</TableCell>
									<TableCell>
										{cantidad} de{' '}
										{PERMISOS_CATALOGO.length}
									</TableCell>
									<TableCell>
										<Button
											size="small"
											variant="outlined"
											onClick={() => setRolActivo(rol)}
										>
											Editar permisos
										</Button>
									</TableCell>
								</TableRow>
							)
						})}
					</TableBody>
				</Table>
			</Paper>

			{rolActivo ? (
				<Paper sx={{ p: 3, borderRadius: RADIO_CARD }}>
					<Typography variant="h3" sx={{ mb: 2 }}>
						Permisos de {rolActivo.descripcion}
					</Typography>
					<Table>
						<TableHead sx={sxEncabezadoTabla}>
							<TableRow>
								<TableCell>Permiso</TableCell>
								<TableCell align="center">
									Asignado
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{PERMISOS_CATALOGO.map((permiso) => (
								<TableRow key={permiso.id}>
									<TableCell>
										{permiso.descripcion}
									</TableCell>
									<TableCell align="center">
										<Checkbox
											checked={idsActivos.has(
												permiso.id,
											)}
											onChange={() =>
												handleToggle(permiso.id)
											}
											sx={{
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
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'flex-end',
							mt: 2,
						}}
					>
						<Button
							variant="contained"
							onClick={() =>
								setAviso(
									'Permisos guardados para este rol (mock).',
								)
							}
							sx={sxBotonAzul}
						>
							GUARDAR
						</Button>
					</Box>
				</Paper>
			) : null}

			<Dialog
				open={creando}
				onClose={() => setCreando(false)}
				fullWidth
				slotProps={{
					paper: { sx: { borderRadius: RADIO_CARD } },
				}}
			>
				<DialogTitle>Crear rol</DialogTitle>
				<DialogContent>
					<Box sx={{ mt: 1 }}>
						<CampoFiltro etiqueta="Descripción *">
							<TextField
								fullWidth
								size="small"
								value={nombreRol}
								onChange={(e) =>
									setNombreRol(e.target.value)
								}
							/>
						</CampoFiltro>
					</Box>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button
						variant="outlined"
						onClick={() => setCreando(false)}
						sx={{ borderRadius: RADIO_CARD }}
					>
						Cancelar
					</Button>
					<Button
						variant="contained"
						disabled={!nombreRol.trim()}
						onClick={handleCrear}
						sx={sxBotonVerde}
					>
						Crear
					</Button>
				</DialogActions>
			</Dialog>
			<Snackbar
				open={Boolean(aviso)}
				autoHideDuration={3000}
				onClose={() => setAviso('')}
				message={aviso}
			/>
		</Box>
	)
}
