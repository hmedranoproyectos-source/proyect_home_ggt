'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useState } from 'react'
import { CampoFiltro } from '@/componentes/campo-filtro'
import { listarRoles } from '@/lib/servicios/rolesApi'
import { listarUsuarios } from '@/lib/servicios/usuariosApi'
import { sxBotonAzul, sxBotonVerde, sxEncabezadoTabla } from '@/lib/estilos-ui'
import { useSesion } from '@/lib/sesion-contexto'
import { colores, RADIO_CARD } from '@/lib/tema'
import type { RolApp, UsuarioApp } from '@/lib/tipos'

export function TabUsuarios() {
	const { sesion } = useSesion()
	const idCia = sesion?.idCia
	const [usuarios, setUsuarios] = useState<UsuarioApp[]>([])
	const [roles, setRoles] = useState<RolApp[]>([])
	const [cargando, setCargando] = useState(true)
	const [error, setError] = useState('')
	const [busqueda, setBusqueda] = useState('')
	const [rol, setRol] = useState('Todos')
	const [aplicado, setAplicado] = useState({ busqueda: '', rol: 'Todos' })

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

			<Paper sx={{ borderRadius: RADIO_CARD, overflow: 'hidden' }}>
				<Table>
					<TableHead sx={sxEncabezadoTabla}>
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
										sx={{ flexWrap: 'wrap', rowGap: 0.5 }}
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
									<Tooltip title="Disponible próximamente">
										<span>
											<Button
												size="small"
												variant="outlined"
												disabled
											>
												Editar
											</Button>
										</span>
									</Tooltip>
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
		</Box>
	)
}
