'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
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
import { useEffect, useState } from 'react'
import { EncabezadoPagina } from '@/componentes/encabezado-pagina'
import { ModalOrdenCompra } from '@/componentes/modal-orden-compra'
import { ModalPreviewPdf } from '@/componentes/modal-preview-pdf'
import { obtenerFactura, obtenerPdfFactura } from '@/lib/servicios/facturasApi'
import { formatoMoneda } from '@/lib/formato'
import { colores, RADIO_CARD } from '@/lib/tema'
import type { FacturaDetalleApp } from '@/lib/tipos'

export default function FacturaPage() {
	const router = useRouter()
	const params = useParams<{ id: string }>()
	const idFactura = Number(decodeURIComponent(params.id))

	const [factura, setFactura] = useState<FacturaDetalleApp | null>(null)
	const [cargando, setCargando] = useState(true)
	const [error, setError] = useState('')
	const [ocAbierta, setOcAbierta] = useState<string | null>(null)
	const [aviso, setAviso] = useState('')
	const [pdfAbierto, setPdfAbierto] = useState(false)
	const [pdfUrl, setPdfUrl] = useState<string | null>(null)
	const [cargandoPdf, setCargandoPdf] = useState(false)

	useEffect(() => {
		if (!Number.isInteger(idFactura)) {
			setCargando(false)
			setError('Id de factura inválido.')
			return
		}
		let cancelado = false
		setCargando(true)
		setError('')
		obtenerFactura(idFactura)
			.then((data) => {
				if (cancelado) return
				setFactura(data)
			})
			.catch((err) => {
				if (cancelado) return
				setError(
					err?.response?.status === 404
						? `No se encontró la factura ${params.id}.`
						: err?.response?.data?.error ||
								'No se pudo cargar la factura.',
				)
			})
			.finally(() => {
				if (!cancelado) setCargando(false)
			})
		return () => {
			cancelado = true
		}
	}, [idFactura, params.id])

	if (cargando) {
		return (
			<Box>
				<EncabezadoPagina titulo="Visualización de factura" />
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
					<CircularProgress size={28} />
				</Box>
			</Box>
		)
	}

	if (error || !factura) {
		return (
			<Box>
				<EncabezadoPagina titulo="Visualización de factura" />
				<Alert severity="warning">
					{error || `No se encontró la factura ${params.id}.`}
				</Alert>
			</Box>
		)
	}

	const conOc = Boolean(factura.oc)

	async function handlePrevisualizarPdf() {
		setPdfAbierto(true)
		setPdfUrl(null)
		setCargandoPdf(true)
		try {
			const blob = await obtenerPdfFactura(idFactura)
			setPdfUrl(URL.createObjectURL(blob))
		} catch (err: any) {
			// responseType 'blob' hace que err.response.data tambien llegue
			// como Blob (no JSON parseado), aunque el backend haya respondido
			// con un cuerpo de error normal -- hay que leerlo a mano.
			let mensaje = 'No se pudo abrir el PDF.'
			const data = err?.response?.data
			if (data instanceof Blob) {
				try {
					const texto = await data.text()
					mensaje = JSON.parse(texto)?.error || mensaje
				} catch {
					// deja el mensaje por defecto si el cuerpo no es JSON
				}
			}
			setPdfAbierto(false)
			setAviso(mensaje)
		} finally {
			setCargandoPdf(false)
		}
	}

	function handleCerrarPdf() {
		setPdfAbierto(false)
		if (pdfUrl) {
			URL.revokeObjectURL(pdfUrl)
			setPdfUrl(null)
		}
	}

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
							{factura.numeroFactura} | {factura.proveedor} |
							NIT {factura.nit}
						</Typography>
						<Typography variant="body2" sx={{ mt: 1 }}>
							Emisión {factura.fechaEmision} | Vencimiento{' '}
							{factura.fechaVencimiento ?? 'N/A'} | Total{' '}
							{formatoMoneda(factura.vlrTotal)}
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
						onClick={handlePrevisualizarPdf}
						disabled={cargandoPdf}
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
							<TableRow key={linea.id}>
								<TableCell>{linea.item}</TableCell>
								<TableCell>{linea.descripcion}</TableCell>
								<TableCell>{linea.cantidad}</TableCell>
								<TableCell>
									{formatoMoneda(linea.valorUnitario)}
								</TableCell>
								<TableCell>
									{formatoMoneda(linea.subtotal)}
								</TableCell>
								<TableCell>
									{linea.porcImpuesto === null
										? 'N/A'
										: `${linea.porcImpuesto}%`}
								</TableCell>
								<TableCell>
									{formatoMoneda(linea.valorImpuesto)}
								</TableCell>
							</TableRow>
						))}
						{factura.lineas.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} align="center">
									<Typography
										variant="body2"
										sx={{ py: 3 }}
									>
										Esta factura no tiene ítems
										registrados.
									</Typography>
								</TableCell>
							</TableRow>
						) : null}
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
						Impuestos: {formatoMoneda(factura.vlrImpuestos)}
					</Typography>
					<Typography variant="body2" sx={{ mt: 1 }}>
						Retenciones: {formatoMoneda(factura.vlrRetenciones)}
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
							valor={factura.vlrBruto}
						/>
						<FilaResumen
							label="Descuentos"
							valor={factura.vlrDescuentos}
						/>
						<FilaResumen
							label="Impuestos"
							valor={factura.vlrImpuestos}
						/>
						<FilaResumen
							label="TOTAL FACTURA"
							valor={factura.vlrTotal}
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
						onClick={handlePrevisualizarPdf}
						disabled={cargandoPdf}
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
			<ModalPreviewPdf
				abierto={pdfAbierto}
				titulo={`PDF - ${factura.numeroFactura}`}
				url={pdfUrl}
				cargando={cargandoPdf}
				onClose={handleCerrarPdf}
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
