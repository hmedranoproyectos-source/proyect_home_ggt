'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import axios from 'axios'
import { useEffect, useMemo, useRef, useState } from 'react'
import { EncabezadoPagina } from '@/componentes/encabezado-pagina'
import { COMPARATIVO } from '@/lib/datos-mock'
import { descargarCsv, formatoMoneda, siNo } from '@/lib/formato'
import {
	importarFacturasDianExcel,
	obtenerFacturasDian,
	type ResumenImportacionDian,
} from '@/lib/servicios/facturasDianApi'
import { obtenerFacturasErp } from '@/lib/servicios/facturasErpApi'
import { colores, RADIO_CARD } from '@/lib/tema'
import type { FacturaDianApp, FacturaErpApp, FilaComparativo } from '@/lib/tipos'

const FILAS_POR_PAGINA = 10

function formatoFecha(iso: string): string {
	const fecha = new Date(iso)
	if (Number.isNaN(fecha.getTime())) {
		return iso
	}
	const dd = String(fecha.getUTCDate()).padStart(2, '0')
	const mm = String(fecha.getUTCMonth() + 1).padStart(2, '0')
	return `${dd}/${mm}/${fecha.getUTCFullYear()}`
}

export default function InformesPage() {
	const [tab, setTab] = useState(0)

	return (
		<Box>
			<EncabezadoPagina titulo="Informes" />
			<Tabs
				value={tab}
				onChange={(_, value: number) => setTab(value)}
				sx={{
					mb: 3,
					'& .MuiTabs-indicator': {
						backgroundColor: colores.azul,
					},
					'& .MuiTab-root.Mui-selected': {
						color: colores.azul,
					},
				}}
			>
				<Tab label="Cargar archivo y comparar" />
				<Tab label="Facturas Dian" />
				<Tab label="Facturas ERP" />
			</Tabs>
			{tab === 0 ? <TabComparativo /> : null}
			{tab === 1 ? <TabFacturasDian /> : null}
			{tab === 2 ? <TabFacturasErp /> : null}
		</Box>
	)
}

function TabComparativo() {
	const inputRef = useRef<HTMLInputElement>(null)
	const [archivo, setArchivo] = useState<File | null>(null)
	const [resultado, setResultado] = useState<
		FilaComparativo[] | null
	>(null)

	// Estado de la carga a facturas_dian (independiente del comparativo
	// mock de arriba): botón CARGAR nuevo, solo lee el Excel y lo inserta.
	const [cargando, setCargando] = useState(false)
	const [errorCarga, setErrorCarga] = useState<string | null>(null)
	const [resumenCarga, setResumenCarga] =
		useState<ResumenImportacionDian | null>(null)

	function handleArchivo(file: File | undefined) {
		if (!file) {
			return
		}
		if (!file.name.toLowerCase().endsWith('.xlsx')) {
			return
		}
		if (file.size > 20 * 1024 * 1024) {
			return
		}
		setArchivo(file)
		setResultado(null)
		setResumenCarga(null)
		setErrorCarga(null)
	}

	async function handleCargar() {
		if (!archivo) {
			return
		}
		setCargando(true)
		setErrorCarga(null)
		try {
			const resumen = await importarFacturasDianExcel(archivo)
			setResumenCarga(resumen)
		} catch (err) {
			const mensaje =
				axios.isAxiosError(err) && err.response?.data?.error
					? err.response.data.error
					: 'No se pudo procesar el archivo. Intenta nuevamente.'
			setErrorCarga(mensaje)
		} finally {
			setCargando(false)
		}
	}

	function handleExportar() {
		if (!resultado) {
			return
		}
		descargarCsv(
			'comparativo-dian.csv',
			[
				'Factura',
				'Proveedor',
				'Archivo',
				'Buzón',
				'ERP',
				'Valor archivo',
				'Valor ERP',
				'Resultado',
			],
			resultado.map((fila) => [
				fila.factura,
				fila.proveedor,
				siNo(fila.enArchivo),
				siNo(fila.enBuzon),
				siNo(fila.enErp),
				fila.valorArchivo,
				fila.valorErp ?? '-',
				fila.resultado,
			]),
		)
	}

	if (resultado) {
		return (
			<Box>
				<Stack
					direction={{ xs: 'column', md: 'row' }}
					spacing={1}
					sx={{ mb: 2, justifyContent: 'space-between' }}
				>
					<Typography>
						{archivo?.name} | 1.248 registros | Procesado
						08/09/2026 13:40
					</Typography>
					<Button
						variant="outlined"
						onClick={() => {
							setResultado(null)
							setArchivo(null)
						}}
					>
						CAMBIAR ARCHIVO
					</Button>
				</Stack>
				<Stack
					direction={{ xs: 'column', md: 'row' }}
					spacing={2}
					sx={{ mb: 2 }}
				>
					<KpiMini valor="1.248" label="Archivo" />
					<KpiMini valor="1.236" label="Buzón" />
					<KpiMini valor="1.211" label="ERP" />
					<KpiMini valor="37" label="Diferencias" />
				</Stack>
				<Paper sx={{ borderRadius: RADIO_CARD, overflow: 'hidden' }}>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>Factura</TableCell>
								<TableCell>Proveedor</TableCell>
								<TableCell>Archivo</TableCell>
								<TableCell>Buzón</TableCell>
								<TableCell>ERP</TableCell>
								<TableCell>Valor archivo</TableCell>
								<TableCell>Valor ERP</TableCell>
								<TableCell>Resultado</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{resultado.map((fila) => (
								<TableRow key={fila.factura}>
									<TableCell>{fila.factura}</TableCell>
									<TableCell>{fila.proveedor}</TableCell>
									<TableCell>
										{siNo(fila.enArchivo)}
									</TableCell>
									<TableCell>
										{siNo(fila.enBuzon)}
									</TableCell>
									<TableCell>
										{siNo(fila.enErp)}
									</TableCell>
									<TableCell>
										{formatoMoneda(fila.valorArchivo)}
									</TableCell>
									<TableCell>
										{fila.valorErp
											? formatoMoneda(fila.valorErp)
											: '-'}
									</TableCell>
									<TableCell>{fila.resultado}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					<Box
						sx={{
							px: 3,
							py: 2,
							backgroundColor: colores.azulSuave,
						}}
					>
						<Typography variant="body2">
							Resultado generado. Las diferencias son
							informativas y no crean una gestión de
							novedades.
						</Typography>
					</Box>
				</Paper>
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
					<Button variant="contained" onClick={handleExportar}>
						EXPORTAR RESULTADO
					</Button>
				</Box>
			</Box>
		)
	}

	return (
		<Box>
			<Paper sx={{ p: 3, borderRadius: RADIO_CARD, mb: 2 }}>
				<Typography variant="h3" sx={{ mb: 1 }}>
					Cargar archivo de validación
				</Typography>
				<Typography variant="body2" sx={{ mb: 2 }}>
					Selecciona el archivo Excel que se comparará contra
					el buzón y los registros del ERP.
				</Typography>
				<Box
					onDragOver={(e) => e.preventDefault()}
					onDrop={(e) => {
						e.preventDefault()
						handleArchivo(e.dataTransfer.files[0])
					}}
					sx={{
						backgroundColor: colores.azulSuave,
						borderRadius: RADIO_CARD,
						p: 3,
						mb: 2,
					}}
				>
					<Typography>
						Arrastra el archivo .xlsx aquí o selecciona
						desde tu equipo.
					</Typography>
				</Box>
				{errorCarga ? (
					<Alert severity="error" sx={{ mb: 2 }}>
						{errorCarga}
					</Alert>
				) : null}
				{resumenCarga ? (
					<Alert severity="success" sx={{ mb: 2 }}>
						{resumenCarga.insertadas} factura(s) insertadas en
						facturas_dian de {resumenCarga.total} leídas
						({resumenCarga.duplicadas} duplicadas,{' '}
						{resumenCarga.conError} con error, omitidas).
					</Alert>
				) : null}
				<Stack
					direction="row"
					spacing={2}
					sx={{ alignItems: 'center' }}
				>
					<input
						ref={inputRef}
						type="file"
						accept=".xlsx"
						hidden
						onChange={(e) =>
							handleArchivo(e.target.files?.[0])
						}
					/>
					<Button
						variant="contained"
						onClick={() => inputRef.current?.click()}
						sx={{
							backgroundColor: colores.azul,
							borderRadius: RADIO_CARD,
							'&:hover': {
								backgroundColor: '#0C4E82',
							},
						}}
					>
						SELECCIONAR ARCHIVO
					</Button>
					<Button
						variant="contained"
						disabled={!archivo || cargando}
						onClick={handleCargar}
						startIcon={
							cargando ? (
								<CircularProgress size={16} color="inherit" />
							) : undefined
						}
						sx={{
							backgroundColor: colores.okFg,
							borderRadius: RADIO_CARD,
							'&:hover': { backgroundColor: '#0C6A4B' },
							'&.Mui-disabled': {
								backgroundColor: colores.okFg,
								color: '#FFFFFF',
								opacity: 0.85,
							},
						}}
					>
						{cargando ? 'CARGANDO...' : 'CARGAR'}
					</Button>
					<Typography variant="body2">
						{archivo
							? archivo.name
							: 'Ningún archivo seleccionado'}
					</Typography>
				</Stack>
			</Paper>

			<Paper sx={{ p: 3, borderRadius: RADIO_CARD }}>
				<Typography variant="h3" sx={{ mb: 1.5 }}>
					Información requerida en el archivo
				</Typography>
				<Typography variant="body2">
					Número de factura | NIT del proveedor | Fecha |
					Cantidad | Valor total
				</Typography>
				<Typography variant="body2" sx={{ mt: 1 }}>
					Formato permitido: XLSX - Tamaño máximo: 20 MB
				</Typography>
			</Paper>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'flex-end',
					mt: 2,
				}}
			>
				<Button
					variant="contained"
					disabled={!archivo}
					onClick={() => setResultado(COMPARATIVO)}
					sx={{
						backgroundColor: colores.okFg,
						borderRadius: RADIO_CARD,
						'&:hover': { backgroundColor: '#0C6A4B' },
						'&.Mui-disabled': {
							backgroundColor: colores.okFg,
							color: '#FFFFFF',
							opacity: 0.85,
						},
					}}
				>
					GENERAR COMPARATIVO
				</Button>
			</Box>
		</Box>
	)
}

function KpiMini({
	valor,
	label,
}: {
	valor: string
	label: string
}) {
	return (
		<Paper sx={{ flex: 1, p: 2, borderRadius: RADIO_CARD }}>
			<Typography sx={{ fontSize: 24, fontWeight: 700 }}>
				{valor}
			</Typography>
			<Typography variant="body2">{label}</Typography>
		</Paper>
	)
}

function TabFacturasDian() {
	const [facturas, setFacturas] = useState<FacturaDianApp[]>([])
	const [cargando, setCargando] = useState(true)
	const [error, setError] = useState('')

	const [fecha, setFecha] = useState('')
	const [factura, setFactura] = useState('')
	const [nitProveedor, setNitProveedor] = useState('')
	const [pagina, setPagina] = useState(0)

	useEffect(() => {
		let cancelado = false
		setCargando(true)
		setError('')
		obtenerFacturasDian()
			.then((data) => {
				if (cancelado) return
				setFacturas(data)
			})
			.catch((err) => {
				if (cancelado) return
				setError(
					axios.isAxiosError(err) && err.response?.data?.error
						? err.response.data.error
						: 'No se pudieron cargar las facturas Dian.',
				)
			})
			.finally(() => {
				if (!cancelado) setCargando(false)
			})
		return () => {
			cancelado = true
		}
	}, [])

	const filtradas = useMemo(() => {
		return facturas.filter((f) => {
			if (fecha && formatoFecha(f.fechaEmision) !== fecha) {
				return false
			}
			if (
				factura &&
				!f.numeroFactura
					.toLowerCase()
					.includes(factura.toLowerCase())
			) {
				return false
			}
			if (nitProveedor) {
				const q = nitProveedor.toLowerCase()
				const coincide =
					f.nit.toLowerCase().includes(q) ||
					f.proveedor.toLowerCase().includes(q)
				if (!coincide) {
					return false
				}
			}
			return true
		})
	}, [facturas, fecha, factura, nitProveedor])

	// Cada cambio de filtro vuelve a la primera pagina, para no quedar en
	// una pagina que ya no existe si el resultado filtrado es mas chico.
	// Ajustado durante el render (no en un efecto aparte) con estado, no ref
	// -- patron de React para estado derivado: https://react.dev/learn/you-might-not-need-an-effect
	const [filtroAnterior, setFiltroAnterior] = useState({
		fecha,
		factura,
		nitProveedor,
	})
	if (
		filtroAnterior.fecha !== fecha ||
		filtroAnterior.factura !== factura ||
		filtroAnterior.nitProveedor !== nitProveedor
	) {
		setFiltroAnterior({ fecha, factura, nitProveedor })
		setPagina(0)
	}

	const paginadas = useMemo(() => {
		const inicio = pagina * FILAS_POR_PAGINA
		return filtradas.slice(inicio, inicio + FILAS_POR_PAGINA)
	}, [filtradas, pagina])

	return (
		<Box>
			<Stack
				direction={{ xs: 'column', md: 'row' }}
				spacing={1.5}
				sx={{ mb: 2, alignItems: { md: 'flex-end' } }}
			>
				<CampoFiltro etiqueta="Fecha" sx={{ minWidth: 180 }}>
					<TextField
						fullWidth
						size="small"
						type="date"
						value={fecha ? isoDesdeFormatoFecha(fecha) : ''}
						onChange={(e) =>
							setFecha(
								e.target.value
									? formatoFecha(e.target.value)
									: '',
							)
						}
					/>
				</CampoFiltro>
				<CampoFiltro etiqueta="Factura" sx={{ minWidth: 180 }}>
					<TextField
						fullWidth
						size="small"
						placeholder="Prefijo-consecutivo"
						value={factura}
						onChange={(e) => setFactura(e.target.value)}
					/>
				</CampoFiltro>
				<CampoFiltro
					etiqueta="Nit Proveedor"
					sx={{ minWidth: 200, flex: 1 }}
				>
					<TextField
						fullWidth
						size="small"
						placeholder="NIT o nombre del proveedor"
						value={nitProveedor}
						onChange={(e) => setNitProveedor(e.target.value)}
					/>
				</CampoFiltro>
				<Button
					variant="outlined"
					onClick={() =>
						descargarCsv(
							'facturas-dian.csv',
							[
								'NIT',
								'Proveedor',
								'Factura',
								'Valor Total',
								'Fecha Emisión',
							],
							filtradas.map((f) => [
								f.nit,
								f.proveedor,
								f.numeroFactura,
								f.vlrTotal,
								formatoFecha(f.fechaEmision),
							]),
						)
					}
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
								<TableCell>Proveedor</TableCell>
								<TableCell>Factura</TableCell>
								<TableCell align="right">
									Valor Total
								</TableCell>
								<TableCell>Fecha Emisión</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{paginadas.map((f) => (
								<TableRow key={f.id}>
									<TableCell>{f.nit}</TableCell>
									<TableCell>{f.proveedor}</TableCell>
									<TableCell>{f.numeroFactura}</TableCell>
									<TableCell align="right">
										{formatoMoneda(f.vlrTotal)}
									</TableCell>
									<TableCell>
										{formatoFecha(f.fechaEmision)}
									</TableCell>
								</TableRow>
							))}
							{!cargando && filtradas.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} align="center">
										<Typography
											variant="body2"
											sx={{ py: 3 }}
										>
											No hay facturas Dian que
											coincidan con los filtros.
										</Typography>
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				)}
				{!cargando && filtradas.length > 0 ? (
					<TablePagination
						component="div"
						count={filtradas.length}
						page={pagina}
						onPageChange={(_e, nuevaPagina) =>
							setPagina(nuevaPagina)
						}
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
						Espejo del reporte DIAN cargado por Excel
						(facturas_dian), sin cruzar contra el buzón ni
						el ERP.
					</Typography>
				</Box>
			</Paper>
		</Box>
	)
}

function TabFacturasErp() {
	const [facturas, setFacturas] = useState<FacturaErpApp[]>([])
	const [cargando, setCargando] = useState(true)
	const [error, setError] = useState('')

	const [fecha, setFecha] = useState('')
	const [factura, setFactura] = useState('')
	const [nitProveedor, setNitProveedor] = useState('')
	const [pagina, setPagina] = useState(0)

	useEffect(() => {
		let cancelado = false
		setCargando(true)
		setError('')
		obtenerFacturasErp()
			.then((data) => {
				if (cancelado) return
				setFacturas(data)
			})
			.catch((err) => {
				if (cancelado) return
				setError(
					axios.isAxiosError(err) && err.response?.data?.error
						? err.response.data.error
						: 'No se pudieron cargar las facturas ERP.',
				)
			})
			.finally(() => {
				if (!cancelado) setCargando(false)
			})
		return () => {
			cancelado = true
		}
	}, [])

	// "Factura" busca por el identificador del documento ERP
	// (cod_erp_tipo_docto-consecutivo), equivalente a numeroFactura en el
	// tab Facturas Dian (que usa prefijo-consecutivo de la FE).
	const filtradas = useMemo(() => {
		return facturas.filter((f) => {
			if (fecha && formatoFecha(f.fecha) !== fecha) {
				return false
			}
			if (factura) {
				const documento = `${f.codDocumento}-${f.consecutivo}`
				if (!documento.toLowerCase().includes(factura.toLowerCase())) {
					return false
				}
			}
			if (nitProveedor) {
				const q = nitProveedor.toLowerCase()
				const coincide =
					f.nit.toLowerCase().includes(q) ||
					f.proveedor.toLowerCase().includes(q)
				if (!coincide) {
					return false
				}
			}
			return true
		})
	}, [facturas, fecha, factura, nitProveedor])

	// Cada cambio de filtro vuelve a la primera pagina, mismo patron de
	// estado derivado que TabFacturasDian (ver comentario alli).
	const [filtroAnterior, setFiltroAnterior] = useState({
		fecha,
		factura,
		nitProveedor,
	})
	if (
		filtroAnterior.fecha !== fecha ||
		filtroAnterior.factura !== factura ||
		filtroAnterior.nitProveedor !== nitProveedor
	) {
		setFiltroAnterior({ fecha, factura, nitProveedor })
		setPagina(0)
	}

	const paginadas = useMemo(() => {
		const inicio = pagina * FILAS_POR_PAGINA
		return filtradas.slice(inicio, inicio + FILAS_POR_PAGINA)
	}, [filtradas, pagina])

	return (
		<Box>
			<Stack
				direction={{ xs: 'column', md: 'row' }}
				spacing={1.5}
				sx={{ mb: 2, alignItems: { md: 'flex-end' } }}
			>
				<CampoFiltro etiqueta="Fecha" sx={{ minWidth: 180 }}>
					<TextField
						fullWidth
						size="small"
						type="date"
						value={fecha ? isoDesdeFormatoFecha(fecha) : ''}
						onChange={(e) =>
							setFecha(
								e.target.value
									? formatoFecha(e.target.value)
									: '',
							)
						}
					/>
				</CampoFiltro>
				<CampoFiltro etiqueta="Factura" sx={{ minWidth: 180 }}>
					<TextField
						fullWidth
						size="small"
						placeholder="Cod documento-consecutivo"
						value={factura}
						onChange={(e) => setFactura(e.target.value)}
					/>
				</CampoFiltro>
				<CampoFiltro
					etiqueta="Nit Proveedor"
					sx={{ minWidth: 200, flex: 1 }}
				>
					<TextField
						fullWidth
						size="small"
						placeholder="NIT o nombre del proveedor"
						value={nitProveedor}
						onChange={(e) => setNitProveedor(e.target.value)}
					/>
				</CampoFiltro>
				<Button
					variant="outlined"
					onClick={() =>
						descargarCsv(
							'facturas-erp.csv',
							[
								'Nit Proveedor',
								'Proveedor',
								'Cod Documento',
								'Consecutivo',
								'Prefijo',
								'Valor Total',
								'Fecha',
							],
							filtradas.map((f) => [
								f.nit,
								f.proveedor,
								f.codDocumento,
								f.consecutivo,
								f.prefijo,
								f.vlrTotal,
								formatoFecha(f.fecha),
							]),
						)
					}
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
								<TableCell>Nit Proveedor</TableCell>
								<TableCell>Proveedor</TableCell>
								<TableCell>Cod Documento</TableCell>
								<TableCell>Consecutivo</TableCell>
								<TableCell>Prefijo</TableCell>
								<TableCell align="right">
									Valor Total
								</TableCell>
								<TableCell>Fecha</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{paginadas.map((f) => (
								<TableRow key={f.id}>
									<TableCell>{f.nit}</TableCell>
									<TableCell>{f.proveedor}</TableCell>
									<TableCell>{f.codDocumento}</TableCell>
									<TableCell>{f.consecutivo}</TableCell>
									<TableCell>{f.prefijo}</TableCell>
									<TableCell align="right">
										{formatoMoneda(f.vlrTotal)}
									</TableCell>
									<TableCell>
										{formatoFecha(f.fecha)}
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
											No hay facturas ERP que
											coincidan con los filtros.
										</Typography>
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				)}
				{!cargando && filtradas.length > 0 ? (
					<TablePagination
						component="div"
						count={filtradas.length}
						page={pagina}
						onPageChange={(_e, nuevaPagina) =>
							setPagina(nuevaPagina)
						}
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
						Documentos aprobados en SIESA (facturas_erp),
						cargados por el job diario contra el WS.
					</Typography>
				</Box>
			</Paper>
		</Box>
	)
}

// El input type="date" nativo exige valor en formato ISO (yyyy-mm-dd); se
// usa solo para alimentar ese input, el filtro se aplica siempre contra
// formatoFecha (dd/mm/yyyy) para comparar contra lo que ya se ve en la fila.
function isoDesdeFormatoFecha(ddmmyyyy: string): string {
	const [dd, mm, yyyy] = ddmmyyyy.split('/')
	return `${yyyy}-${mm}-${dd}`
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
