'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'
import { crearEntradaAlmacen } from '@/lib/servicios/entradasAlmacenApi'
import {
	obtenerBodegasPorCo,
	obtenerCentrosCostos,
	obtenerCentrosOperacion,
	obtenerCompradores,
	obtenerMonedas,
	obtenerMotivosPorConcepto,
	obtenerTipoDocumentoPorClase,
	obtenerUnidadesNegocios,
} from '@/lib/servicios/siesaApi'
import { RADIO_CARD } from '@/lib/tema'
import type {
	FilaCatalogoSiesa,
	ParametrosFormularioEntradaAlmacen,
} from '@/lib/tipos'

interface Props {
	abierto: boolean
	idFactura: number
	numeroFactura: string
	onClose: () => void
	onExito: (idEntradaAlmacen: number) => void
}

type CampoFormulario = keyof ParametrosFormularioEntradaAlmacen

const FORMULARIO_VACIO: ParametrosFormularioEntradaAlmacen = {
	centro_operacion: '',
	tipo_documento: '',
	bodega: '',
	motivo: '',
	centro_operacion_movto: '',
	unidad_negocio: '',
	centro_costo: '',
	tercero_comprador: '',
	moneda: '',
}

// El shape de cada fila de catalogo SIESA no esta confirmado contra una
// respuesta real del WS (ver lib/tipos.ts, FilaCatalogoSiesa, y
// docs/siesa-plano-entradas-almacen.md). Se intentan varios nombres de
// campo candidatos, con el mismo criterio que
// ordenesCompraService.js (backend) ya documenta como TODO pendiente de
// confirmar.
function extraerCodigo(fila: FilaCatalogoSiesa): string {
	const candidato =
		fila.cod_erp ?? fila.codigo ?? fila.id ?? fila.cod ?? fila.valor
	return candidato == null ? '' : String(candidato)
}

function extraerEtiqueta(fila: FilaCatalogoSiesa): string {
	const candidato =
		fila.descripcion ?? fila.nombre ?? fila.razon_social ?? extraerCodigo(fila)
	return candidato == null ? '' : String(candidato)
}

interface DefinicionCampo {
	campo: CampoFormulario
	etiqueta: string
	// bodega no tiene `cargar`: depende de centro_operacion y se resuelve
	// aparte (ver efecto de bodegasPorCo) en vez del Promise.all inicial.
	cargar: (() => Promise<FilaCatalogoSiesa[]>) | null
}

// Orden en que se dibujan los campos del formulario (2 columnas).
const CAMPOS: DefinicionCampo[] = [
	{ campo: 'centro_operacion', etiqueta: 'Centro de operación', cargar: obtenerCentrosOperacion },
	{
		campo: 'tipo_documento',
		etiqueta: 'Tipo de documento',
		cargar: obtenerTipoDocumentoPorClase,
	},
	{ campo: 'bodega', etiqueta: 'Bodega', cargar: null },
	{ campo: 'motivo', etiqueta: 'Motivo', cargar: obtenerMotivosPorConcepto },
	{
		campo: 'centro_operacion_movto',
		etiqueta: 'Centro de operación (movimiento)',
		cargar: obtenerCentrosOperacion,
	},
	{ campo: 'unidad_negocio', etiqueta: 'Unidad de negocio', cargar: obtenerUnidadesNegocios },
	{ campo: 'centro_costo', etiqueta: 'Centro de costo', cargar: obtenerCentrosCostos },
	{ campo: 'tercero_comprador', etiqueta: 'Comprador', cargar: obtenerCompradores },
	{ campo: 'moneda', etiqueta: 'Moneda', cargar: obtenerMonedas },
]
const CAMPOS_CON_CATALOGO = CAMPOS.filter((def) => def.cargar !== null)

// Formulario de captura de los parametros SIESA necesarios para crear la
// Entrada de Almacen (ver docs/siesa-plano-entradas-almacen.md, "Origen de
// cada campo del registro 470" -- campos marcados "Formulario"). Alcance
// actual: solo facturas sin OC asociada (ver facturas/[id]/page.tsx,
// boton INGRESAR FACTURA, visible solo cuando !conOc).
export function ModalIngresarFactura({
	abierto,
	idFactura,
	numeroFactura,
	onClose,
	onExito,
}: Props) {
	const [valores, setValores] = useState<ParametrosFormularioEntradaAlmacen>(FORMULARIO_VACIO)
	const [notas, setNotas] = useState('')
	const [opciones, setOpciones] = useState<Record<string, FilaCatalogoSiesa[]>>({})
	const [bodegas, setBodegas] = useState<FilaCatalogoSiesa[]>([])
	const [cargandoCatalogos, setCargandoCatalogos] = useState(false)
	const [cargandoBodegas, setCargandoBodegas] = useState(false)
	const [enviando, setEnviando] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		if (!abierto) return

		let cancelado = false
		setValores(FORMULARIO_VACIO)
		setNotas('')
		setBodegas([])
		setError('')
		setCargandoCatalogos(true)

		Promise.all(
			CAMPOS_CON_CATALOGO.map((def) =>
				def.cargar!().catch(() => [] as FilaCatalogoSiesa[]),
			),
		)
			.then((resultados) => {
				if (cancelado) return
				const siguiente: Record<string, FilaCatalogoSiesa[]> = {}
				CAMPOS_CON_CATALOGO.forEach((def, i) => {
					siguiente[def.campo] = resultados[i]
				})
				setOpciones(siguiente)
			})
			.finally(() => {
				if (!cancelado) setCargandoCatalogos(false)
			})

		return () => {
			cancelado = true
		}
	}, [abierto])

	// Bodega depende del centro de operacion elegido (bodegasPorCo exige
	// id_co, ver siesaConsultasService.js). Se recarga cuando cambia.
	useEffect(() => {
		if (!valores.centro_operacion) {
			setBodegas([])
			return
		}
		let cancelado = false
		setCargandoBodegas(true)
		obtenerBodegasPorCo(valores.centro_operacion)
			.then((data) => {
				if (!cancelado) setBodegas(data)
			})
			.catch(() => {
				if (!cancelado) setBodegas([])
			})
			.finally(() => {
				if (!cancelado) setCargandoBodegas(false)
			})
		return () => {
			cancelado = true
		}
	}, [valores.centro_operacion])

	function handleCambioCampo(campo: CampoFormulario, valor: string) {
		setValores((prev) => ({
			...prev,
			[campo]: valor,
			...(campo === 'centro_operacion' ? { bodega: '' } : {}),
		}))
	}

	const camposFaltantes = (Object.keys(valores) as CampoFormulario[]).filter(
		(campo) => !valores[campo],
	)
	const formularioCompleto = camposFaltantes.length === 0

	async function handleEnviar() {
		if (!formularioCompleto) {
			setError('Completa todos los campos antes de enviar.')
			return
		}
		setEnviando(true)
		setError('')
		try {
			const resultado = await crearEntradaAlmacen(idFactura, valores, notas || undefined)
			onExito(resultado.idEntradaAlmacen)
		} catch (err: unknown) {
			const mensaje =
				(err as { response?: { data?: { error?: string } } })?.response?.data?.error
			setError(mensaje || 'No se pudo crear la entrada de almacén en SIESA.')
		} finally {
			setEnviando(false)
		}
	}

	function renderSelect(def: DefinicionCampo) {
		const esBodega = def.campo === 'bodega'
		const filas = esBodega ? bodegas : opciones[def.campo] || []
		const cargando = esBodega ? cargandoBodegas : cargandoCatalogos
		const deshabilitado = esBodega
			? !valores.centro_operacion || cargandoBodegas
			: cargandoCatalogos
		const mensajeVacio = esBodega
			? valores.centro_operacion
				? 'Sin bodegas para este centro de operación'
				: 'Selecciona primero el centro de operación'
			: 'Sin opciones disponibles'

		return (
			<FormControl fullWidth size="small" disabled={deshabilitado || enviando}>
				<InputLabel id={`label-${def.campo}`}>{def.etiqueta}</InputLabel>
				<Select
					labelId={`label-${def.campo}`}
					label={def.etiqueta}
					value={valores[def.campo]}
					onChange={(e) => handleCambioCampo(def.campo, e.target.value)}
				>
					{filas.map((fila, i) => {
						const codigo = extraerCodigo(fila)
						return (
							<MenuItem key={`${codigo}-${i}`} value={codigo}>
								{extraerEtiqueta(fila)} {codigo ? `(${codigo})` : ''}
							</MenuItem>
						)
					})}
					{!cargando && filas.length === 0 ? (
						<MenuItem value="" disabled>
							{mensajeVacio}
						</MenuItem>
					) : null}
				</Select>
			</FormControl>
		)
	}

	return (
		<Dialog open={abierto} onClose={enviando ? undefined : onClose} fullWidth maxWidth="sm">
			<DialogTitle>Ingresar factura {numeroFactura} a SIESA</DialogTitle>
			<DialogContent>
				<Typography variant="body2" sx={{ mb: 2 }}>
					Captura los datos de la Entrada de Almacén. Estos valores se envían
					junto con las líneas de la factura al Web Service de SIESA.
				</Typography>

				{cargandoCatalogos ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
						<CircularProgress size={24} />
					</Box>
				) : (
					<Grid container spacing={2}>
						{CAMPOS.map((def) => (
							<Grid key={def.campo} size={{ xs: 12, sm: 6 }}>
								{renderSelect(def)}
							</Grid>
						))}
						<Grid size={12}>
							<TextField
								label="Notas"
								fullWidth
								size="small"
								multiline
								minRows={2}
								value={notas}
								onChange={(e) => setNotas(e.target.value)}
								disabled={enviando}
							/>
						</Grid>
					</Grid>
				)}

				{error ? (
					<Alert severity="error" sx={{ mt: 2 }}>
						{error}
					</Alert>
				) : null}
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button variant="outlined" onClick={onClose} disabled={enviando}>
					Cancelar
				</Button>
				<Button
					variant="contained"
					onClick={handleEnviar}
					disabled={enviando || cargandoCatalogos || !formularioCompleto}
					sx={{ borderRadius: RADIO_CARD }}
				>
					{enviando ? <CircularProgress size={20} color="inherit" /> : 'Enviar a SIESA'}
				</Button>
			</DialogActions>
		</Dialog>
	)
}
