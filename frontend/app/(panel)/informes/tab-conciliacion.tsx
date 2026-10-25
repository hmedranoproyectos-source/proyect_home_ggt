'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import axios from 'axios'
import { useMemo, useState } from 'react'
import { CampoFiltro } from '@/componentes/campo-filtro'
import { formatoMoneda, siNo } from '@/lib/formato'
import { obtenerConciliacionDianErp } from '@/lib/servicios/informesApi'
import { colores, RADIO_CARD } from '@/lib/tema'
import type {
	EstadoConciliacion,
	ResultadoConciliacionDianErp,
} from '@/lib/tipos'

const FILAS_POR_PAGINA = 10

const COLOR_ESTADO: Record<EstadoConciliacion, { bg: string; fg: string }> = {
	Coincide: { bg: colores.okBg, fg: colores.okFg },
	Diferencia: { bg: colores.novedadBg, fg: colores.novedadFg },
	'Duplicado ERP': { bg: colores.novedadBg, fg: colores.novedadFg },
	'Solo DIAN': { bg: colores.ingresarBg, fg: colores.ingresarFg },
	'Solo ERP': { bg: colores.erpBg, fg: colores.erpFg },
}

const ESTADOS: EstadoConciliacion[] = [
	'Coincide',
	'Diferencia',
	'Solo DIAN',
	'Solo ERP',
	'Duplicado ERP',
]

// El resultado vive solo en estado de React: no se guarda en BD ni en
// storage; recargar la página lo descarta.
export function TabConciliacion() {
	const [fechaDesde, setFechaDesde] = useState('')
	const [fechaHasta, setFechaHasta] = useState('')
	const [nit, setNit] = useState('')
	const [estado, setEstado] = useState('')
	const [pagina, setPagina] = useState(0)

	const [resultado, setResultado] =
		useState<ResultadoConciliacionDianErp | null>(null)
	const [cargando, setCargando] = useState(false)
	const [error, setError] = useState('')

	async function handleConciliar() {
		setCargando(true)
		setError('')
		try {
			const data = await obtenerConciliacionDianErp({
				fechaDesde,
				fechaHasta,
				nit,
			})
			setResultado(data)
			setEstado('')
			setPagina(0)
		} catch (err) {
			setError(
				axios.isAxiosError(err) && err.response?.data?.error
					? err.response.data.error
					: 'No se pudo generar la conciliación. Intenta nuevamente.',
			)
		} finally {
			setCargando(false)
		}
	}

	const filas = useMemo(() => {
		if (!resultado) return []
		return estado
			? resultado.filas.filter((f) => f.estado === estado)
			: resultado.filas
	}, [resultado, estado])

	const paginadas = useMemo(() => {
		const inicio = pagina * FILAS_POR_PAGINA
		return filas.slice(inicio, inicio + FILAS_POR_PAGINA)
	}, [filas, pagina])

	async function handleExportar() {
		if (!resultado) return
		// Import dinámico: xlsx solo se descarga si el usuario exporta.
		const XLSX = await import('xlsx')
		const hoja = XLSX.utils.json_to_sheet(
			filas.map((f) => ({
				NIT: f.nit,
				Proveedor: f.proveedor,
				'Nro factura': f.factura,
				Fecha: f.fecha ?? '',
				DIAN: siNo(f.enDian),
				ERP: siNo(f.enErp),
				'Valor DIAN': f.valorDian ?? '',
				'Valor ERP': f.valorErp ?? '',
				'Diferencia (DIAN - ERP)': f.diferencia ?? '',
				Estado: f.estado,
			})),
		)
		const libro = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(libro, hoja, 'Conciliación')
		const fecha = resultado.generadoEn.slice(0, 10)
		XLSX.writeFile(libro, `conciliacion-dian-erp-${fecha}.xlsx`)
	}

	return (
		<Box>
			<Alert severity="warning" sx={{ mb: 2 }}>
				Este proceso es pesado: cruza todas las facturas DIAN y ERP de
				la compañía y puede tardar. Usa los filtros para acotar el
				resultado. El resultado no se guarda; se pierde al salir o
				recargar, y solo se conserva si lo exportas.
			</Alert>

			<Stack
				direction={{ xs: 'column', md: 'row' }}
				spacing={1.5}
				sx={{ mb: 2, alignItems: { md: 'flex-end' } }}
			>
				<CampoFiltro etiqueta="Fecha desde" sx={{ minWidth: 170 }}>
					<TextField
						fullWidth
						size="small"
						type="date"
						value={fechaDesde}
						onChange={(e) => setFechaDesde(e.target.value)}
					/>
				</CampoFiltro>
				<CampoFiltro etiqueta="Fecha hasta" sx={{ minWidth: 170 }}>
					<TextField
						fullWidth
						size="small"
						type="date"
						value={fechaHasta}
						onChange={(e) => setFechaHasta(e.target.value)}
					/>
				</CampoFiltro>
				<CampoFiltro etiqueta="NIT" sx={{ minWidth: 180 }}>
					<TextField
						fullWidth
						size="small"
						placeholder="Todos"
						value={nit}
						onChange={(e) => setNit(e.target.value)}
					/>
				</CampoFiltro>
				<Button
					variant="contained"
					disabled={cargando}
					onClick={handleConciliar}
					startIcon={
						cargando ? (
							<CircularProgress size={16} color="inherit" />
						) : undefined
					}
					sx={{
						backgroundColor: colores.azul,
						borderRadius: RADIO_CARD,
						'&:hover': { backgroundColor: '#0C4E82' },
					}}
				>
					{cargando ? 'CONCILIANDO...' : 'CONCILIACIÓN DIAN - ERP'}
				</Button>
			</Stack>

			{error ? (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			) : null}

			{resultado ? (
				<>
					<Stack
						direction={{ xs: 'column', md: 'row' }}
						spacing={2}
						sx={{ mb: 2 }}
					>
						<Resumen valor={resultado.resumen.total} label="Total" />
						<Resumen
							valor={resultado.resumen.coincide}
							label="Coinciden"
						/>
						<Resumen
							valor={resultado.resumen.diferencia}
							label="Con diferencia"
						/>
						<Resumen
							valor={resultado.resumen.soloDian}
							label="Solo DIAN"
						/>
						<Resumen
							valor={resultado.resumen.soloErp}
							label="Solo ERP"
						/>
					</Stack>

					<Stack
						direction="row"
						spacing={1.5}
						sx={{ mb: 2, alignItems: 'flex-end' }}
					>
						<CampoFiltro etiqueta="Estado" sx={{ minWidth: 200 }}>
							<TextField
								select
								fullWidth
								size="small"
								value={estado}
								onChange={(e) => {
									setEstado(e.target.value)
									setPagina(0)
								}}
								slotProps={{ select: { displayEmpty: true } }}
							>
								<MenuItem value="">Todos</MenuItem>
								{ESTADOS.map((e) => (
									<MenuItem key={e} value={e}>
										{e}
									</MenuItem>
								))}
							</TextField>
						</CampoFiltro>
						<Button
							variant="outlined"
							disabled={filas.length === 0}
							onClick={handleExportar}
							sx={{ borderRadius: RADIO_CARD }}
						>
							EXPORTAR EXCEL
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
									<TableCell>NIT</TableCell>
									<TableCell>Nro factura</TableCell>
									<TableCell>DIAN</TableCell>
									<TableCell>ERP</TableCell>
									<TableCell align="right">
										Valor DIAN
									</TableCell>
									<TableCell align="right">
										Valor ERP
									</TableCell>
									<TableCell align="right">
										Diferencia
									</TableCell>
									<TableCell>Estado</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{paginadas.map((f) => (
									<TableRow
										key={`${f.nit}|${f.factura}|${f.enDian}`}
									>
										<TableCell>{f.nit}</TableCell>
										<TableCell>{f.factura}</TableCell>
										<TableCell>{siNo(f.enDian)}</TableCell>
										<TableCell>{siNo(f.enErp)}</TableCell>
										<TableCell align="right">
											{f.valorDian === null
												? '-'
												: formatoMoneda(f.valorDian)}
										</TableCell>
										<TableCell align="right">
											{f.valorErp === null
												? '-'
												: formatoMoneda(f.valorErp)}
										</TableCell>
										<TableCell align="right">
											{f.diferencia === null
												? '-'
												: formatoMoneda(f.diferencia)}
										</TableCell>
										<TableCell>
											<Chip
												size="small"
												label={f.estado}
												sx={{
													backgroundColor:
														COLOR_ESTADO[f.estado].bg,
													color: COLOR_ESTADO[f.estado]
														.fg,
													fontWeight: 600,
												}}
											/>
										</TableCell>
									</TableRow>
								))}
								{filas.length === 0 ? (
									<TableRow>
										<TableCell colSpan={8} align="center">
											<Typography
												variant="body2"
												sx={{ py: 3 }}
											>
												No hay resultados para los
												filtros seleccionados.
											</Typography>
										</TableCell>
									</TableRow>
								) : null}
							</TableBody>
						</Table>
						{filas.length > 0 ? (
							<TablePagination
								component="div"
								count={filas.length}
								page={pagina}
								onPageChange={(_e, nueva) => setPagina(nueva)}
								rowsPerPage={FILAS_POR_PAGINA}
								rowsPerPageOptions={[FILAS_POR_PAGINA]}
								labelDisplayedRows={({ from, to, count }) =>
									`${from}–${to} de ${count}`
								}
							/>
						) : null}
						<Box
							sx={{
								px: 3,
								py: 2,
								backgroundColor: colores.azulSuave,
							}}
						>
							<Typography variant="body2">
								Cruce por NIT + prefijo + consecutivo. Diferencia
								= Valor DIAN − Valor ERP (exacta a 2 decimales).
								Generado{' '}
								{new Date(resultado.generadoEn).toLocaleString(
									'es-CO',
								)}
								.
							</Typography>
						</Box>
					</Paper>
				</>
			) : null}
		</Box>
	)
}

function Resumen({ valor, label }: { valor: number; label: string }) {
	return (
		<Paper sx={{ flex: 1, p: 2, borderRadius: RADIO_CARD }}>
			<Typography sx={{ fontSize: 24, fontWeight: 700 }}>
				{valor.toLocaleString('es-CO')}
			</Typography>
			<Typography variant="body2">{label}</Typography>
		</Paper>
	)
}
