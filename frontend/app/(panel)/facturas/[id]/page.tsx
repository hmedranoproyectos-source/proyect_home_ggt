'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { EncabezadoPagina } from '@/componentes/encabezado-pagina'
import { ModalOrdenCompra } from '@/componentes/modal-orden-compra'
import { buscarFactura } from '@/lib/datos-mock'
import { formatoMoneda } from '@/lib/formato'
import { colores, RADIO_CARD } from '@/lib/tema'

export default function FacturaPage() {
	const router = useRouter()
	const params = useParams<{ id: string }>()
	const factura = buscarFactura(decodeURIComponent(params.id))
	const [ocAbierta, setOcAbierta] = useState<string | null>(null)
	const [aviso, setAviso] = useState('')

	if (!factura) {
		return (
			<Box>
				<EncabezadoPagina titulo="Visualización de factura" />
				<Alert severity="warning">
					No se encontró la factura {params.id}.
				</Alert>
			</Box>
		)
	}

	const conOc = Boolean(factura.oc)

	return (
		<Box>
			<EncabezadoPagina titulo="Visualización de factura" />
			<Paper sx={{ p: 3, borderRadius: RADIO_CARD, mb: 2 }}>
				<Stack
					direction={{ xs: 'column', md: 'row' }}
					spacing={2}
					sx={{ justifyContent: 'space-between' }}
				>
					<Box>
						<Typography variant="h3">
							{factura.id} | {factura.proveedor} | NIT{' '}
							{factura.nit}
						</Typography>
						<Typography variant="body2" sx={{ mt: 1 }}>
							Emisión {factura.emision} | Vencimiento{' '}
							{factura.vencimiento} | Total{' '}
							{formatoMoneda(factura.total)}
						</Typography>
					</Box>
					<Chip
						label={conOc ? 'CON OC' : 'SIN OC'}
						sx={{
							alignSelf: 'flex-start',
							backgroundColor: conOc
								? colores.okBg
								: colores.ingresarBg,
							color: conOc
								? colores.okFg
								: colores.ingresarFg,
							fontWeight: 800,
							'& .MuiChip-label': {
								px: '26px',
							},
						}}
					/>
				</Stack>
			</Paper>

			<Stack
				direction="row"
				sx={{
					mb: 1.5,
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<Typography variant="h3">Detalle de ítems</Typography>
				{conOc ? (
					<Button
						variant="outlined"
						onClick={() => setOcAbierta(factura.oc)}
						sx={{ borderRadius: RADIO_CARD }}
					>
						VER ORDEN {factura.oc}
					</Button>
				) : (
					<Button
						variant="outlined"
						onClick={() =>
							setAviso('Previsualización PDF (mock)')
						}
						sx={{ borderRadius: RADIO_CARD }}
					>
						PREVISUALIZAR PDF
					</Button>
				)}
			</Stack>

			<Paper sx={{ borderRadius: RADIO_CARD, overflow: 'hidden', mb: 2 }}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Ítem</TableCell>
							<TableCell>Descripción</TableCell>
							<TableCell>Cant.</TableCell>
							<TableCell>V. unitario</TableCell>
							<TableCell>Subtotal</TableCell>
							<TableCell>Imp.</TableCell>
							<TableCell>V. impuesto</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{factura.lineas.map((linea) => (
							<TableRow key={linea.item}>
								<TableCell>{linea.item}</TableCell>
								<TableCell>{linea.descripcion}</TableCell>
								<TableCell>{linea.cantidad}</TableCell>
								<TableCell>
									{formatoMoneda(linea.valorUnitario)}
								</TableCell>
								<TableCell>
									{formatoMoneda(linea.subtotal)}
								</TableCell>
								<TableCell>{linea.impuesto}</TableCell>
								<TableCell>
									{formatoMoneda(linea.valorImpuesto)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Paper>

			<Stack
				direction={{ xs: 'column', md: 'row' }}
				spacing={2}
				sx={{ mb: 3 }}
			>
				<Paper sx={{ flex: 1, p: 3, borderRadius: RADIO_CARD }}>
					<Typography variant="h3" sx={{ mb: 2 }}>
						Impuestos y retenciones
					</Typography>
					<Typography variant="body2">
						IVA 19%: {formatoMoneda(factura.iva)}{' '}
						Retefuente: {formatoMoneda(factura.retefuente)}{' '}
						ReteIVA: {formatoMoneda(factura.reteIva)}
					</Typography>
					<Typography variant="body2" sx={{ mt: 1 }}>
						Otros impuestos:{' '}
						{formatoMoneda(factura.otrosImpuestos)}
					</Typography>
				</Paper>
				<Paper
					sx={{
						flex: 1,
						p: 3,
						borderRadius: RADIO_CARD,
						backgroundColor: colores.azulSuave,
					}}
				>
					<Typography variant="h3" sx={{ mb: 2 }}>
						Resumen
					</Typography>
					<Stack spacing={1}>
						<FilaResumen
							label="Subtotal"
							valor={factura.subtotal}
						/>
						<FilaResumen
							label="Impuestos"
							valor={factura.impuestos}
						/>
						<FilaResumen
							label="TOTAL FACTURA"
							valor={factura.total}
							negrita
						/>
					</Stack>
				</Paper>
			</Stack>

			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				spacing={1.5}
				sx={{ justifyContent: 'space-between' }}
			>
				<Button
					variant="outlined"
					onClick={() => router.push('/bandeja')}
				>
					VOLVER A LA BANDEJA
				</Button>
				{conOc ? (
					<Button
						variant="contained"
						onClick={() =>
							setAviso('Previsualización PDF (mock)')
						}
						sx={{
							backgroundColor: colores.azul,
							borderRadius: RADIO_CARD,
							'&:hover': { backgroundColor: '#0C4E82' },
						}}
					>
						PREVISUALIZAR PDF
					</Button>
				) : (
					<Button
						variant="contained"
						onClick={() =>
							setAviso(
								'Factura enviada a ingreso (mock).',
							)
						}
						sx={{
							backgroundColor: colores.okFg,
							borderRadius: RADIO_CARD,
							'&:hover': { backgroundColor: '#0C6A4B' },
						}}
					>
						INGRESAR FACTURA
					</Button>
				)}
			</Stack>

			<ModalOrdenCompra
				oc={ocAbierta}
				onClose={() => setOcAbierta(null)}
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

function FilaResumen({
	label,
	valor,
	negrita,
}: {
	label: string
	valor: number
	negrita?: boolean
}) {
	return (
		<Stack
			direction="row"
			sx={{ justifyContent: 'space-between' }}
		>
			<Typography sx={{ fontWeight: negrita ? 800 : 500 }}>
				{label}
			</Typography>
			<Typography sx={{ fontWeight: negrita ? 800 : 500 }}>
				{formatoMoneda(valor)}
			</Typography>
		</Stack>
	)
}
