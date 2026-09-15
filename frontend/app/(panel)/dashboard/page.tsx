'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useRouter } from 'next/navigation'
import { ChipEstado, ChipSiesa } from '@/componentes/chip-estado'
import { EncabezadoPagina } from '@/componentes/encabezado-pagina'
import { GraficoBarras } from '@/componentes/grafico-barras'
import {
	ATENCION_IDS,
	FACTURAS,
	RECIBIDAS_7_DIAS,
	REGISTRO_SIESA,
	kpisFacturas,
} from '@/lib/datos-mock'
import { colores, RADIO_CARD } from '@/lib/tema'

const KPI = [
	{
		clave: 'porIngresar' as const,
		label: 'Por ingresar',
		punto: colores.ingresarBg,
		colorNumero: colores.ingresarFg,
	},
	{
		clave: 'conNovedad' as const,
		label: 'Con novedad',
		punto: colores.novedadBg,
		colorNumero: colores.novedadFg,
	},
	{
		clave: 'conciliadas' as const,
		label: 'Conciliadas',
		punto: colores.okBg,
		colorNumero: colores.okFg,
	},
	{
		clave: 'enErp' as const,
		label: 'En ERP',
		punto: colores.erpBg,
		colorNumero: colores.erpFg,
	},
]

export default function DashboardPage() {
	const router = useRouter()
	const kpis = kpisFacturas()
	const atencion = FACTURAS.filter((f) =>
		ATENCION_IDS.includes(f.id),
	)
	const maxSiesa = Math.max(
		REGISTRO_SIESA.entradaPendiente,
		REGISTRO_SIESA.causacionPendiente,
		REGISTRO_SIESA.registroCompleto,
	)

	return (
		<Box>
			<EncabezadoPagina titulo="Dashboard de facturación" />
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
									{kpis[item.clave]}
								</Typography>
								<Typography variant="body2">
									{item.label}
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
					</Typography>
					<GraficoBarras datos={RECIBIDAS_7_DIAS} />
				</Paper>
				<Paper sx={{ flex: 1, p: 3, borderRadius: RADIO_CARD }}>
					<Typography variant="h3" sx={{ mb: 3 }}>
						Registro en Siesa
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
						{atencion.map((factura) => (
							<TableRow key={factura.id}>
								<TableCell>{factura.id}</TableCell>
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
