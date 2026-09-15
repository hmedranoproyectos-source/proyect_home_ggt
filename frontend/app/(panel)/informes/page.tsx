'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
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
import { useMemo, useRef, useState } from 'react'
import { ChipEstado, ChipSiesa } from '@/componentes/chip-estado'
import { EncabezadoPagina } from '@/componentes/encabezado-pagina'
import { ModalTrazabilidad } from '@/componentes/modal-trazabilidad'
import {
	COMPARATIVO,
	ESTADOS,
	FACTURAS,
	PROVEEDORES,
} from '@/lib/datos-mock'
import { descargarCsv, formatoMoneda, siNo } from '@/lib/formato'
import { colores, RADIO_CARD } from '@/lib/tema'
import type { FilaComparativo } from '@/lib/tipos'

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
				<Tab label="Facturas por estado" />
			</Tabs>
			{tab === 0 ? <TabComparativo /> : <TabPorEstado />}
		</Box>
	)
}

function TabComparativo() {
	const inputRef = useRef<HTMLInputElement>(null)
	const [archivo, setArchivo] = useState<File | null>(null)
	const [resultado, setResultado] = useState<
		FilaComparativo[] | null
	>(null)

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

function TabPorEstado() {
	const [proveedor, setProveedor] = useState('Todos')
	const [estado, setEstado] = useState('Todos')
	const [fecha] = useState('01/09/2026 - 08/09/2026')
	const [trazabilidad, setTrazabilidad] = useState<string | null>(
		null,
	)
	const [aplicado, setAplicado] = useState({
		proveedor: 'Todos',
		estado: 'Todos',
	})

	const filas = useMemo(() => {
		return FACTURAS.filter((factura) => {
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
			return true
		})
	}, [aplicado])

	return (
		<Box>
			<Stack
				direction={{ xs: 'column', md: 'row' }}
				spacing={1.5}
				sx={{ mb: 2, alignItems: { md: 'flex-end' } }}
			>
				<CampoFiltro etiqueta="Fecha" sx={{ minWidth: 220 }}>
					<TextField
						fullWidth
						size="small"
						value={fecha}
					/>
				</CampoFiltro>
				<CampoFiltro etiqueta="Estado" sx={{ minWidth: 180 }}>
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
				<CampoFiltro
					etiqueta="Proveedor"
					sx={{ minWidth: 180, flex: 1 }}
				>
					<TextField
						select
						fullWidth
						size="small"
						value={proveedor}
						onChange={(e) => setProveedor(e.target.value)}
					>
						<MenuItem value="Todos">Todos</MenuItem>
						{PROVEEDORES.map((nombre) => (
							<MenuItem key={nombre} value={nombre}>
								{nombre}
							</MenuItem>
						))}
					</TextField>
				</CampoFiltro>
				<Button
					variant="contained"
					onClick={() => setAplicado({ proveedor, estado })}
					sx={{
						backgroundColor: colores.azul,
						borderRadius: RADIO_CARD,
						'&:hover': { backgroundColor: '#0C4E82' },
					}}
				>
					FILTRAR
				</Button>
				<Button
					variant="outlined"
					onClick={() =>
						descargarCsv(
							'facturas-por-estado.csv',
							[
								'Factura',
								'Proveedor',
								'Estado',
								'Fecha estado',
								'Entrada',
								'Causación',
							],
							filas.map((f) => [
								f.id,
								f.proveedor,
								f.estado,
								f.fechaEstado,
								f.entradaSiesa,
								f.causacionSiesa,
							]),
						)
					}
					sx={{ borderRadius: RADIO_CARD }}
				>
					EXPORTAR
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
							<TableCell>Factura</TableCell>
							<TableCell>Proveedor</TableCell>
							<TableCell>Estado</TableCell>
							<TableCell>Fecha estado</TableCell>
							<TableCell>Entrada Siesa</TableCell>
							<TableCell>Causación</TableCell>
							<TableCell>Acción</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{filas.map((factura) => (
							<TableRow key={factura.id}>
								<TableCell>{factura.id}</TableCell>
								<TableCell>{factura.proveedor}</TableCell>
								<TableCell>
									<ChipEstado estado={factura.estado} />
								</TableCell>
								<TableCell>{factura.fechaEstado}</TableCell>
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
											setTrazabilidad(factura.id)
										}
									>
										Ver trazabilidad
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
						backgroundColor: colores.azulSuave,
					}}
				>
					<Typography variant="body2">
						Estados disponibles: Por ingresar, Con
						novedad, Conciliada y En ERP. La trazabilidad
						se consulta desde la acción de cada factura,
						sin un módulo independiente.
					</Typography>
				</Box>
			</Paper>

			<ModalTrazabilidad
				facturaId={trazabilidad}
				onClose={() => setTrazabilidad(null)}
			/>
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
