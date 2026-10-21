'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'
import { formatoMoneda } from '@/lib/formato'
import { obtenerOrdenCompraFactura } from '@/lib/servicios/facturasApi'
import { colores } from '@/lib/tema'
import type { OrdenCompraFacturaApp } from '@/lib/tipos'

interface Props {
	abierto: boolean
	idFactura: number
	referencia: string | null
	onClose: () => void
}

// RC-02: diferencia de valor total > 0,01 % entre factura y OC es alerta.
const UMBRAL_DIFERENCIA_PCT = 0.01

// Vista de solo lectura de la OC ligada a la factura. Los datos salen de
// ordenes_compras / detalles_ordenes_compras (copia local que deja la
// conciliacion contra SIESA), no se consulta el ERP desde el navegador.
export function ModalOrdenCompra({
	abierto,
	idFactura,
	referencia,
	onClose,
}: Props) {
	const [datos, setDatos] = useState<OrdenCompraFacturaApp | null>(null)
	const [cargando, setCargando] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		if (!abierto) return
		let cancelado = false
		setDatos(null)
		setError('')
		setCargando(true)
		obtenerOrdenCompraFactura(idFactura)
			.then((data) => {
				if (!cancelado) setDatos(data)
			})
			.catch((err) => {
				if (cancelado) return
				setError(
					err?.response?.data?.error ||
						'No se pudo cargar la orden de compra.',
				)
			})
			.finally(() => {
				if (!cancelado) setCargando(false)
			})
		return () => {
			cancelado = true
		}
	}, [abierto, idFactura])

	const oc = datos?.ordenCompra ?? null
	const diferenciaPct = oc?.diferenciaPct ?? null
	const hayAlerta =
		diferenciaPct !== null && diferenciaPct > UMBRAL_DIFERENCIA_PCT

	return (
		<Dialog open={abierto} onClose={onClose} fullWidth maxWidth="md">
			<DialogTitle>
				Orden de compra {oc ? oc.documento : referencia}
			</DialogTitle>
			<DialogContent>
				{cargando ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
						<CircularProgress size={28} />
					</Box>
				) : null}

				{error ? <Alert severity="warning">{error}</Alert> : null}

				{datos && !oc ? (
					<Alert severity="info">
						La referencia {datos.referencia ?? '—'} no tiene una
						orden de compra registrada: no se encontró en SIESA o la
						factura aún no se ha conciliado.
					</Alert>
				) : null}

				{oc ? (
					<Stack spacing={2}>
						<Stack
							direction={{ xs: 'column', sm: 'row' }}
							spacing={2}
							sx={{ justifyContent: 'space-between' }}
						>
							<Box>
								<Typography variant="body1" sx={{ fontWeight: 700 }}>
									{oc.proveedor} | NIT {oc.nit}
								</Typography>
								<Typography variant="body2" sx={{ mt: 0.5 }}>
									Documento {oc.documento} | CO{' '}
									{oc.centroOperacion} | Fecha {oc.fecha.slice(0, 10)}
								</Typography>
							</Box>
							{diferenciaPct !== null ? (
								<Chip
									label={
										hayAlerta
											? `Difiere ${diferenciaPct.toFixed(2)} % de la factura`
											: 'Coincide con la factura'
									}
									sx={{
										alignSelf: 'flex-start',
										fontWeight: 700,
										backgroundColor: hayAlerta
											? colores.ingresarBg
											: colores.okBg,
										color: hayAlerta
											? colores.ingresarFg
											: colores.okFg,
									}}
								/>
							) : null}
						</Stack>

						<Box sx={{ overflowX: 'auto' }}>
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell>Ítem</TableCell>
										<TableCell>UM</TableCell>
										<TableCell align="right">Cant.</TableCell>
										<TableCell align="right">
											V. unitario
										</TableCell>
										<TableCell align="right">Bruto</TableCell>
										<TableCell align="right">Dscto.</TableCell>
										<TableCell align="right">Imp.</TableCell>
										<TableCell align="right">Neto</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{oc.lineas.map((linea) => (
										<TableRow key={linea.id}>
											<TableCell>{linea.item}</TableCell>
											<TableCell>
												{linea.unidadMedida}
											</TableCell>
											<TableCell align="right">
												{linea.cantidad}
											</TableCell>
											<TableCell align="right">
												{formatoMoneda(linea.valorUnitario)}
											</TableCell>
											<TableCell align="right">
												{formatoMoneda(linea.vlrBruto)}
											</TableCell>
											<TableCell align="right">
												{formatoMoneda(linea.vlrDescuento)}
											</TableCell>
											<TableCell align="right">
												{formatoMoneda(linea.vlrImpuestos)}
											</TableCell>
											<TableCell align="right">
												{formatoMoneda(linea.vlrNeto)}
											</TableCell>
										</TableRow>
									))}
									{oc.lineas.length === 0 ? (
										<TableRow>
											<TableCell colSpan={8} align="center">
												<Typography
													variant="body2"
													sx={{ py: 2 }}
												>
													La OC no tiene líneas
													registradas.
												</Typography>
											</TableCell>
										</TableRow>
									) : null}
								</TableBody>
							</Table>
						</Box>

						<Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
							<ResumenFila label="Bruto" valor={oc.vlrBruto} />
							<ResumenFila
								label="Descuentos"
								valor={oc.vlrDescuento}
							/>
							<ResumenFila
								label="Impuestos"
								valor={oc.vlrImpuestos}
							/>
							<ResumenFila
								label="TOTAL OC"
								valor={oc.vlrTotal}
								negrita
							/>
							<ResumenFila
								label="Total factura"
								valor={datos?.vlrTotalFactura ?? 0}
							/>
						</Stack>
					</Stack>
				) : null}
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button variant="outlined" onClick={onClose}>
					Cerrar
				</Button>
			</DialogActions>
		</Dialog>
	)
}

function ResumenFila({
	label,
	valor,
	negrita,
}: {
	label: string
	valor: number
	negrita?: boolean
}) {
	return (
		<Stack direction="row" spacing={3}>
			<Typography
				variant="body2"
				sx={{ fontWeight: negrita ? 800 : 500, minWidth: 110 }}
			>
				{label}
			</Typography>
			<Typography
				variant="body2"
				sx={{
					fontWeight: negrita ? 800 : 500,
					minWidth: 130,
					textAlign: 'right',
				}}
			>
				{formatoMoneda(valor)}
			</Typography>
		</Stack>
	)
}
