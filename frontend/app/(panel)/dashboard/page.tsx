'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChipEstado, ChipSiesa } from '@/componentes/chip-estado'
import { EncabezadoPagina } from '@/componentes/encabezado-pagina'
import { GraficoBarras } from '@/componentes/grafico-barras'
import { RECIBIDAS_7_DIAS, REGISTRO_SIESA } from '@/lib/datos-mock'
import { obtenerResumenDashboard } from '@/lib/servicios/dashboardApi'
import { colores, RADIO_CARD } from '@/lib/tema'
import type { ResumenDashboardApp } from '@/lib/tipos'

// `real`: tarjetas con dato real (etapa 1). Las demás siguen sin definir /
// dependen del flujo Entrada -> Causación, ver informe del Dashboard.
const KPI = [
	{
		clave: 'porIngresar' as const,
		real: true,
		label: 'Por ingresar',
		punto: colores.ingresarBg,
		colorNumero: colores.ingresarFg,
	},
	{
		clave: 'conNovedad' as const,
		real: true,
		label: 'Con novedad',
		punto: colores.novedadBg,
		colorNumero: colores.novedadFg,
	},
	{
		clave: 'conciliadas' as const,
		real: false,
		label: 'Conciliadas',
		punto: colores.okBg,
		colorNumero: colores.okFg,
	},
	{
		clave: 'enErp' as const,
		real: false,
		label: 'En ERP',
		punto: colores.erpBg,
		colorNumero: colores.erpFg,
	},
]

export default function DashboardPage() {
	const router = useRouter()
	const [resumen, setResumen] = useState<ResumenDashboardApp | null>(null)
	const [cargando, setCargando] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		let cancelado = false
		obtenerResumenDashboard()
			.then((data) => {
				if (!cancelado) setResumen(data)
			})
			.catch((err) => {
				if (cancelado) return
				setError(
					axios.isAxiosError(err) && err.response?.data?.error
						? err.response.data.error
						: 'No se pudo cargar el resumen del dashboard.',
				)
			})
			.finally(() => {
				if (!cancelado) setCargando(false)
			})
		return () => {
			cancelado = true
		}
	}, [])

	const atencion = resumen?.atencion ?? []
	const maxSiesa = Math.max(
		REGISTRO_SIESA.entradaPendiente,
		REGISTRO_SIESA.causacionPendiente,
		REGISTRO_SIESA.registroCompleto,
	)

	return (
		<Box>
			<EncabezadoPagina titulo="Dashboard de facturación" />
			{error ? (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			) : null}
			<Stack
				direction={{ xs: 'column', md: 'row' }}
				spacing={2}
				sx={{ mb: 3 }}
			>
				{KPI.map((item) => (
					<Paper
						key={item.clave}
						sx={{
							flex: 1,
							p: 2.5,
							borderRadius: RADIO_CARD,
						}}
					>
						<Stack
							direction="row"
							spacing={1.5}
							sx={{ alignItems: 'center' }}
						>
							<Box
								sx={{
									width: 22,
									height: 22,
									borderRadius: '50%',
									backgroundColor: item.punto,
								}}
							/>
							<Box>
								<Typography
									sx={{
										fontSize: 30,
										fontWeight: 800,
										color: item.colorNumero,
									}}
								>
									{item.real
										? cargando
											? '…'
											: (resumen?.kpis[
													item.clave as keyof ResumenDashboardApp['kpis']
											] ?? '—')
										: '—'}
								</Typography>
								<Typography variant="body2">
									{item.label}
									{item.real ? '' : ' (por definir)'}
								</Typography>
							</Box>
						</Stack>
					</Paper>
				))}
			</Stack>

			<Stack
				direction={{ xs: 'column', lg: 'row' }}
				spacing={2}
				sx={{ mb: 3 }}
			>
				<Paper sx={{ flex: 2, p: 3, borderRadius: RADIO_CARD }}>
					<Typography variant="h3" sx={{ mb: 2 }}>
						Facturas recibidas - últimos 7 días
						<ChipEjemplo />
					</Typography>
					<GraficoBarras datos={RECIBIDAS_7_DIAS} />
				</Paper>
				<Paper sx={{ flex: 1, p: 3, borderRadius: RADIO_CARD }}>
					<Typography variant="h3" sx={{ mb: 3 }}>
						Registro en Siesa
						<ChipEjemplo />
					</Typography>
					<BarraSiesa
						label="Entrada pendiente"
						valor={REGISTRO_SIESA.entradaPendiente}
						color={colores.ingresarFg}
						maximo={maxSiesa}
					/>
					<BarraSiesa
						label="Causación pendiente"
						valor={REGISTRO_SIESA.causacionPendiente}
						color={colores.novedadFg}
						maximo={maxSiesa}
					/>
					<BarraSiesa
						label="Registro completo"
						valor={REGISTRO_SIESA.registroCompleto}
						color={colores.okFg}
						maximo={maxSiesa}
					/>
				</Paper>
			</Stack>

			<Typography variant="h3" sx={{ mb: 1.5 }}>
				Facturas que requieren atención
			</Typography>
			<Paper sx={{ borderRadius: RADIO_CARD, overflow: 'hidden' }}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Factura</TableCell>
							<TableCell>Proveedor</TableCell>
							<TableCell>Estado</TableCell>
							<TableCell>Entrada Siesa</TableCell>
							<TableCell>Causación</TableCell>
							<TableCell>Acción</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{cargando ? (
							<TableRow>
								<TableCell colSpan={6} align="center">
									<CircularProgress size={24} sx={{ my: 2 }} />
								</TableCell>
							</TableRow>
						) : null}
						{!cargando && atencion.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} align="center">
									<Typography variant="body2" sx={{ py: 3 }}>
										No hay facturas que requieran atención.
									</Typography>
								</TableCell>
							</TableRow>
						) : null}
						{atencion.map((factura) => (
							<TableRow key={factura.id}>
								<TableCell>{factura.numeroFactura}</TableCell>
								<TableCell>{factura.proveedor}</TableCell>
								<TableCell>
									<ChipEstado estado={factura.estado} />
								</TableCell>
								<TableCell>
									<ChipSiesa valor={factura.entradaSiesa} />
								</TableCell>
								<TableCell>
									<ChipSiesa
										valor={factura.causacionSiesa}
									/>
								</TableCell>
								<TableCell>
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
					</TableBody>
				</Table>
			</Paper>
		</Box>
	)
}

// Bloques que aún leen datos-mock (etapas siguientes del Dashboard).
function ChipEjemplo() {
	return (
		<Chip
			label="Datos de ejemplo"
			size="small"
			sx={{
				ml: 1,
				backgroundColor: colores.pendienteBg,
				color: colores.pendienteFg,
				fontWeight: 600,
			}}
		/>
	)
}

function BarraSiesa({
	label,
	valor,
	color,
	maximo,
}: {
	label: string
	valor: number
	color: string
	maximo: number
}) {
	return (
		<Box sx={{ mb: 2 }}>
			<Stack
				direction="row"
				sx={{ mb: 0.5, justifyContent: 'space-between' }}
			>
				<Typography variant="body2">{label}</Typography>
				<Typography sx={{ fontWeight: 700 }}>{valor}</Typography>
			</Stack>
			<Box
				sx={{
					height: 8,
					borderRadius: 99,
					backgroundColor: colores.pendienteBg,
					overflow: 'hidden',
				}}
			>
				<Box
					sx={{
						width: `${(valor / maximo) * 100}%`,
						height: '100%',
						backgroundColor: color,
					}}
				/>
			</Box>
		</Box>
	)
}
