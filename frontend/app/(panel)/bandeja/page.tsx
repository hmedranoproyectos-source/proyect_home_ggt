'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
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
import { useRouter } from 'next/navigation'
import { ChipEstado, ChipSiesa } from '@/componentes/chip-estado'
import { EncabezadoPagina } from '@/componentes/encabezado-pagina'
import { obtenerFacturas } from '@/lib/servicios/facturasApi'
import { descargarCsv } from '@/lib/formato'
import { colores, RADIO_CARD } from '@/lib/tema'
import type { FacturaApp } from '@/lib/tipos'

const ESTADOS: FacturaApp['estado'][] = [
	'NUEVA',
	'EN_VALIDACION',
	'ALERTA',
	'REGISTRADA_ERP',
	'CONTABILIZADA',
]

export default function BandejaPage() {
	const router = useRouter()
	const [facturas, setFacturas] = useState<FacturaApp[]>([])
	const [cargando, setCargando] = useState(true)
	const [error, setError] = useState('')

	const [proveedor, setProveedor] = useState('Todos')
	const [estado, setEstado] = useState('Todos')
	const [busqueda, setBusqueda] = useState('')
	const [fecha, setFecha] = useState('01/09/2026 - 08/09/2026')
	const [aplicado, setAplicado] = useState({
		proveedor: 'Todos',
		estado: 'Todos',
		busqueda: '',
	})

	useEffect(() => {
		let cancelado = false
		setCargando(true)
		setError('')
		obtenerFacturas()
			.then((data) => {
				if (cancelado) return
				setFacturas(data)
			})
			.catch((err) => {
				if (cancelado) return
				setError(
					err?.response?.data?.error ||
						'No se pudieron cargar las facturas.',
				)
			})
			.finally(() => {
				if (!cancelado) setCargando(false)
			})
		return () => {
			cancelado = true
		}
	}, [])

	const proveedores = useMemo(
		() => [...new Set(facturas.map((f) => f.proveedor))],
		[facturas],
	)

	const filtradas = useMemo(() => {
		return facturas.filter((factura) => {
			if (
				aplicado.proveedor !== 'Todos' &&
				factura.proveedor !== aplicado.proveedor
			) {
				return false
			}
			if (
				aplicado.estado !== 'Todos' &&
				factura.estado !== aplicado.estado
			) {
				return false
			}
			if (!aplicado.busqueda) {
				return true
			}
			const q = aplicado.busqueda.toLowerCase()
			return (
				factura.numeroFactura.toLowerCase().includes(q) ||
				factura.nit.toLowerCase().includes(q) ||
				(factura.oc ?? '').toLowerCase().includes(q)
			)
		})
	}, [facturas, aplicado])

	function handleExportar() {
		descargarCsv(
			'bandeja-facturas.csv',
			[
				'Factura',
				'Proveedor',
				'OC',
				'Estado',
				'Entrada Siesa',
				'Causación Siesa',
			],
			filtradas.map((f) => [
				f.numeroFactura,
				f.proveedor,
				f.oc ?? 'Sin OC',
				f.estado,
				f.entradaSiesa,
				f.causacionSiesa,
			]),
		)
	}

	return (
		<Box>
			<EncabezadoPagina titulo="Bandeja de facturas" />
			<Stack
				direction={{ xs: 'column', lg: 'row' }}
				spacing={1.5}
				sx={{ mb: 2, alignItems: { lg: 'flex-end' } }}
			>
				<CampoFiltro etiqueta="Proveedor" sx={{ minWidth: 180, flex: 1 }}>
					<TextField
						select
						fullWidth
						size="small"
						value={proveedor}
						onChange={(e) => setProveedor(e.target.value)}
					>
						<MenuItem value="Todos">Seleccionar</MenuItem>
						{proveedores.map((nombre) => (
							<MenuItem key={nombre} value={nombre}>
								{nombre}
							</MenuItem>
						))}
					</TextField>
				</CampoFiltro>
				<CampoFiltro etiqueta="Fecha" sx={{ minWidth: 220, flex: 1 }}>
					<TextField
						fullWidth
						size="small"
						value={fecha}
						onChange={(e) => setFecha(e.target.value)}
					/>
				</CampoFiltro>
				<CampoFiltro etiqueta="Estado" sx={{ minWidth: 160 }}>
					<TextField
						select
						fullWidth
						size="small"
						value={estado}
						onChange={(e) => setEstado(e.target.value)}
					>
						<MenuItem value="Todos">Todos</MenuItem>
						{ESTADOS.map((item) => (
							<MenuItem key={item} value={item}>
								{item}
							</MenuItem>
						))}
					</TextField>
				</CampoFiltro>
				<CampoFiltro etiqueta="Buscar" sx={{ minWidth: 200, flex: 1 }}>
					<TextField
						fullWidth
						size="small"
						placeholder="Factura, NIT u OC"
						value={busqueda}
						onChange={(e) => setBusqueda(e.target.value)}
					/>
				</CampoFiltro>
				<Button
					variant="contained"
					onClick={() =>
						setAplicado({ proveedor, estado, busqueda })
					}
					sx={{
						backgroundColor: colores.azul,
						borderRadius: RADIO_CARD,
						'&:hover': { backgroundColor: '#0C4E82' },
					}}
				>
					FILTRAR
				</Button>
			</Stack>

			<Stack
				direction="row"
				sx={{
					mb: 1.5,
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<Typography variant="body2">
					{filtradas.length} resultados
				</Typography>
				<Button
					variant="outlined"
					onClick={handleExportar}
					sx={{ borderRadius: RADIO_CARD }}
				>
					EXPORTAR
				</Button>
			</Stack>

			{error ? (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			) : null}

			<Paper sx={{ borderRadius: RADIO_CARD, overflow: 'hidden' }}>
				{cargando ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
						<CircularProgress size={28} />
					</Box>
				) : (
					<Table
						sx={{
							'& tbody .MuiTableCell-root': {
								py: 0.75,
							},
						}}
					>
						<TableHead
							sx={{
								'& .MuiTableCell-root': {
									fontWeight: 800,
									fontSize: 12,
								},
							}}
						>
							<TableRow>
								<TableCell>Factura</TableCell>
								<TableCell>Proveedor</TableCell>
								<TableCell>OC</TableCell>
								<TableCell align="center">Estado</TableCell>
								<TableCell align="center">
									Entrada Siesa
								</TableCell>
								<TableCell align="center">
									Causación Siesa
								</TableCell>
								<TableCell align="center">Acción</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{filtradas.map((factura) => (
								<TableRow key={factura.id}>
									<TableCell>{factura.numeroFactura}</TableCell>
									<TableCell>{factura.proveedor}</TableCell>
									<TableCell>
										{factura.oc ?? 'Sin OC'}
									</TableCell>
									<TableCell align="center">
										<ChipEstado estado={factura.estado} />
									</TableCell>
									<TableCell align="center">
										<ChipSiesa valor={factura.entradaSiesa} />
									</TableCell>
									<TableCell align="center">
										<ChipSiesa
											valor={factura.causacionSiesa}
										/>
									</TableCell>
									<TableCell align="center">
										<Button
											size="small"
											variant="outlined"
											onClick={() =>
												router.push(
													`/facturas/${factura.id}`,
												)
											}
										>
											Ver factura
										</Button>
									</TableCell>
								</TableRow>
							))}
							{!cargando && filtradas.length === 0 ? (
								<TableRow>
									<TableCell colSpan={7} align="center">
										<Typography
											variant="body2"
											sx={{ py: 3 }}
										>
											No hay facturas que coincidan con
											los filtros.
										</Typography>
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				)}
				<Box
					sx={{
						px: 3,
						py: 2,
						backgroundColor: colores.azulSuave,
					}}
				>
					<Typography sx={{ mb: 0.5, fontWeight: 700 }}>
						La acción Ver factura abre el discriminado
						completo, independientemente de que tenga o no
						OC.
					</Typography>
					<Typography variant="body2">
						La entrada y la causación se muestran por
						separado dentro de la misma bandeja.
					</Typography>
				</Box>
			</Paper>
		</Box>
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
