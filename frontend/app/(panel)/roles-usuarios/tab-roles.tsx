'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useState } from 'react'
import { listarPermisos } from '@/lib/servicios/permisosApi'
import { listarRoles, permisosDeRol } from '@/lib/servicios/rolesApi'
import { sxBotonAzul, sxBotonVerde, sxEncabezadoTabla } from '@/lib/estilos-ui'
import { useSesion } from '@/lib/sesion-contexto'
import { colores, RADIO_CARD } from '@/lib/tema'
import type { PermisoCatalogo, RolApp } from '@/lib/tipos'

export function TabRoles() {
	const { sesion } = useSesion()
	const idCia = sesion?.idCia
	const [roles, setRoles] = useState<RolApp[]>([])
	const [catalogoPermisos, setCatalogoPermisos] = useState<
		PermisoCatalogo[]
	>([])
	const [rolActivo, setRolActivo] = useState<RolApp | null>(null)
	const [permisosDelRol, setPermisosDelRol] = useState<Set<number>>(
		new Set(),
	)
	const [error, setError] = useState('')

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

	useEffect(() => {
		if (!rolActivo) {
			setPermisosDelRol(new Set())
			return
		}
		let cancelado = false
		permisosDeRol(rolActivo.id)
			.then((permisos) => {
				if (!cancelado) {
					setPermisosDelRol(new Set(permisos.map((p) => p.id)))
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
				<Tooltip title="Disponible próximamente">
					<span>
						<Button variant="contained" disabled sx={sxBotonVerde}>
							CREAR
						</Button>
					</span>
				</Tooltip>
			</Stack>

			{error ? (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			) : null}

			<Paper
				sx={{ borderRadius: RADIO_CARD, overflow: 'hidden', mb: 2 }}
			>
				<Table>
					<TableHead sx={sxEncabezadoTabla}>
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
									<Button
										size="small"
										variant="outlined"
										onClick={() => setRolActivo(rolItem)}
									>
										Ver permisos
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Paper>

			{rolActivo ? (
				<Paper sx={{ p: 3, borderRadius: RADIO_CARD }}>
					<Typography variant="h3" sx={{ mb: 2 }}>
						Permisos de {rolActivo.descripcion} (
						{permisosDelRol.size} de {totalPermisos})
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
							{catalogoPermisos.map((permiso) => (
								<TableRow key={permiso.id}>
									<TableCell>
										{permiso.descripcion}
									</TableCell>
									<TableCell align="center">
										<Checkbox
											checked={permisosDelRol.has(
												permiso.id,
											)}
											disabled
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
					<Typography
						variant="body2"
						sx={{ mt: 2, color: colores.textoSecundario }}
					>
						La edición de permisos estará disponible
						próximamente.
					</Typography>
				</Paper>
			) : null}
		</Box>
	)
}
