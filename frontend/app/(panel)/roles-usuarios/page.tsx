'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useState } from 'react'
import { ChipUsuario } from '@/componentes/chip-estado'
import { EncabezadoPagina } from '@/componentes/encabezado-pagina'
import { PERMISOS, USUARIOS } from '@/lib/datos-mock'
import { colores, RADIO_CARD } from '@/lib/tema'
import type { UsuarioApp } from '@/lib/tipos'

const ROLES = [
	'Administrador',
	'Recibidor',
	'Costos',
	'Contabilidad',
]

export default function RolesUsuariosPage() {
	const [tab, setTab] = useState(0)

	return (
		<Box>
			<EncabezadoPagina titulo="Roles y usuarios" />
			<Tabs
				value={tab}
				onChange={(_, value: number) => setTab(value)}
				sx={{ mb: 3 }}
			>
				<Tab label="Usuarios" />
				<Tab label="Roles y permisos" />
			</Tabs>
			{tab === 0 ? <TabUsuarios /> : <TabPermisos />}
		</Box>
	)
}

function TabUsuarios() {
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
						{ROLES.map((item) => (
							<MenuItem key={item} value={item}>
								{item}
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
					sx={{
						backgroundColor: colores.azul,
						borderRadius: RADIO_CARD,
						'&:hover': { backgroundColor: '#0C4E82' },
					}}
				>
					FILTRAR
				</Button>
				<Button
					variant="contained"
					onClick={() => setCreando(true)}
					sx={{
						backgroundColor: colores.okFg,
						borderRadius: RADIO_CARD,
						'&:hover': { backgroundColor: '#0C6A4B' },
					}}
				>
					CREAR
				</Button>
			</Stack>

			<Paper sx={{ borderRadius: RADIO_CARD, overflow: 'hidden' }}>
				<Table>
					<TableHead
						sx={{
							'& .MuiTableCell-root': {
								fontWeight: 800,
								fontSize: 12,
							},
						}}
					>
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
						No se visualizan contraseñas. Los permisos se
						asignan por rol y las acciones quedan
						auditadas.
					</Typography>
				</Box>
			</Paper>

			<DialogoUsuario
				abierto={creando}
				titulo="Crear usuario"
				onClose={() => setCreando(false)}
				onGuardar={(usuario) => handleGuardar(usuario, true)}
			/>
			<DialogoUsuario
				abierto={Boolean(editando)}
				titulo="Editar usuario"
				inicial={editando ?? undefined}
				onClose={() => setEditando(null)}
				onGuardar={(usuario) => handleGuardar(usuario, false)}
			/>
		</Box>
	)
}

function TabPermisos() {
	return (
		<Paper sx={{ borderRadius: RADIO_CARD, overflow: 'hidden' }}>
			<Table>
				<TableHead>
					<TableRow>
						<TableCell>Módulo</TableCell>
						<TableCell>Administrador</TableCell>
						<TableCell>Recibidor</TableCell>
						<TableCell>Costos</TableCell>
						<TableCell>Contabilidad</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{PERMISOS.map((fila) => (
						<TableRow key={fila.modulo}>
							<TableCell>{fila.modulo}</TableCell>
							<TableCell>
								{fila.administrador ? 'Sí' : 'No'}
							</TableCell>
							<TableCell>
								{fila.recibidor ? 'Sí' : 'No'}
							</TableCell>
							<TableCell>
								{fila.costos ? 'Sí' : 'No'}
							</TableCell>
							<TableCell>
								{fila.contabilidad ? 'Sí' : 'No'}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</Paper>
	)
}

function DialogoUsuario({
	abierto,
	titulo,
	inicial,
	onClose,
	onGuardar,
}: {
	abierto: boolean
	titulo: string
	inicial?: UsuarioApp
	onClose: () => void
	onGuardar: (usuario: UsuarioApp) => void
}) {
	const [usuario, setUsuario] = useState('')
	const [nombre, setNombre] = useState('')
	const [rol, setRol] = useState('Recibidor')
	const [estado, setEstado] = useState<UsuarioApp['estado']>(
		'Activo',
	)

	useEffect(() => {
		if (!abierto) {
			return
		}
		setUsuario(inicial?.usuario ?? '')
		setNombre(inicial?.nombre ?? '')
		setRol(inicial?.rol ?? 'Recibidor')
		setEstado(inicial?.estado ?? 'Activo')
	}, [abierto, inicial])

	return (
		<Dialog open={abierto} onClose={onClose} fullWidth>

			<DialogTitle>{titulo}</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ mt: 1 }}>
					<TextField
						label="Usuario"
						value={usuario}
						onChange={(e) => setUsuario(e.target.value)}
						disabled={Boolean(inicial)}
					/>
					<TextField
						label="Nombre"
						value={nombre}
						onChange={(e) => setNombre(e.target.value)}
					/>
					<TextField
						select
						label="Rol"
						value={rol}
						onChange={(e) => setRol(e.target.value)}
					>
						{ROLES.map((item) => (
							<MenuItem key={item} value={item}>
								{item}
							</MenuItem>
						))}
					</TextField>
					<TextField
						select
						label="Estado"
						value={estado}
						onChange={(e) =>
							setEstado(
								e.target.value as UsuarioApp['estado'],
							)
						}
					>
						<MenuItem value="Activo">Activo</MenuItem>
						<MenuItem value="Inactivo">Inactivo</MenuItem>
					</TextField>
				</Stack>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button variant="outlined" onClick={onClose}>
					Cancelar
				</Button>
				<Button
					variant="contained"
					disabled={!usuario.trim() || !nombre.trim()}
					onClick={() =>
						onGuardar({
							usuario: usuario.trim(),
							nombre: nombre.trim(),
							rol,
							estado,
							ultimoAcceso: inicial?.ultimoAcceso ?? '-',
						})
					}
				>
					Guardar
				</Button>
			</DialogActions>
		</Dialog>
	)
}

function CampoFiltro({
	etiqueta,
	sx,
	children,
}: {
	etiqueta: string
	sx?: object
	children: React.ReactNode
}) {
	return (
		<Box sx={sx}>
			<Typography
				sx={{
					display: 'block',
					mb: 0.75,
					fontSize: 11,
					fontWeight: 600,
					color: colores.texto,
				}}
			>
				{etiqueta}
			</Typography>
			{children}
		</Box>
	)
}
