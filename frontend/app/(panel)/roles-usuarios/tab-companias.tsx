'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { crearCompania, eliminarCompania } from '@/lib/servicios/companiasApi'
import { sxBotonAzul, sxBotonVerde, sxEncabezadoTabla } from '@/lib/estilos-ui'
import { useSesion } from '@/lib/sesion-contexto'
import { colores, RADIO_CARD } from '@/lib/tema'
import { PERMISO_GESTIONAR_COMPANIAS, tienePermiso } from '@/lib/permisos-rutas'
import type { CompaniaApp } from '@/lib/tipos'

const COD_ERP_LARGO = 3

export function TabCompanias() {
	const { sesion, seleccionarCia, agregarCompaniaCreada, quitarCompaniaEliminada } =
		useSesion()
	const lista = sesion?.companias ?? []
	const puedeGestionar = tienePermiso(
		sesion?.permisos ?? [],
		PERMISO_GESTIONAR_COMPANIAS,
	)
	const [dialogoAbierto, setDialogoAbierto] = useState(false)
	const [razonSocial, setRazonSocial] = useState('')
	const [codErp, setCodErp] = useState('')
	const [errorDialogo, setErrorDialogo] = useState('')
	const [guardando, setGuardando] = useState(false)
	const [ciaEliminando, setCiaEliminando] = useState<CompaniaApp | null>(null)
	const [errorEliminar, setErrorEliminar] = useState('')
	const [eliminando, setEliminando] = useState(false)

	function abrirDialogo() {
		setRazonSocial('')
		setCodErp('')
		setErrorDialogo('')
		setDialogoAbierto(true)
	}

	async function guardarCompania() {
		if (!razonSocial.trim()) {
			setErrorDialogo('La razón social es obligatoria.')
			return
		}
		if (codErp.trim().length !== COD_ERP_LARGO) {
			setErrorDialogo(`El código ERP debe tener exactamente ${COD_ERP_LARGO} caracteres.`)
			return
		}

		setGuardando(true)
		setErrorDialogo('')
		try {
			const creada = await crearCompania({
				razonSocial: razonSocial.trim(),
				codErp: codErp.trim(),
			})
			agregarCompaniaCreada(creada)
			setDialogoAbierto(false)
		} catch (err: any) {
			setErrorDialogo(
				err?.response?.data?.error || 'No se pudo crear la compañía.',
			)
		} finally {
			setGuardando(false)
		}
	}

	async function confirmarEliminar() {
		if (!ciaEliminando) return

		setEliminando(true)
		setErrorEliminar('')
		try {
			await eliminarCompania(ciaEliminando.id)
			quitarCompaniaEliminada(ciaEliminando.id)
			setCiaEliminando(null)
		} catch (err: any) {
			setErrorEliminar(
				err?.response?.data?.error || 'No se pudo eliminar la compañía.',
			)
		} finally {
			setEliminando(false)
		}
	}

	return (
		<Box>
			<Stack
				direction="row"
				sx={{
					mb: 2,
					justifyContent: 'flex-end',
				}}
			>
				<Button
					variant="contained"
					onClick={abrirDialogo}
					disabled={!puedeGestionar}
					sx={sxBotonVerde}
				>
					CREAR
				</Button>
			</Stack>
			<Paper sx={{ borderRadius: RADIO_CARD, overflow: 'hidden' }}>
				<Table
					sx={{
						'& thead .MuiTableCell-root': { fontSize: 14 },
						'& tbody .MuiTableCell-root': {
							py: 0.75,
							fontSize: 13,
						},
						'& .MuiButton-sizeSmall': {
							fontSize: 13,
							py: 0.25,
							px: 1.25,
							minHeight: 28,
						},
					}}
				>
					<TableHead
						sx={{
							...sxEncabezadoTabla,
							'& .MuiTableCell-root': {
								fontWeight: 800,
								fontSize: 14,
							},
						}}
					>
						<TableRow>
							<TableCell>Razón social</TableCell>
							<TableCell>Código ERP</TableCell>
							<TableCell>Acción</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{lista.map((cia) => (
							<TableRow
								key={cia.id}
								selected={sesion?.idCia === cia.id}
							>
								<TableCell>{cia.razonSocial}</TableCell>
								<TableCell>{cia.codErp}</TableCell>
								<TableCell>
									<Stack direction="row" spacing={1}>
										<Button
											size="small"
											variant="outlined"
											disabled={sesion?.idCia === cia.id}
											onClick={() => seleccionarCia(cia.id)}
										>
											Activar
										</Button>
										<Button
											size="small"
											variant="outlined"
											color="error"
											disabled={!puedeGestionar || sesion?.idCia === cia.id}
											onClick={() => {
												setCiaEliminando(cia)
												setErrorEliminar('')
											}}
										>
											Eliminar
										</Button>
									</Stack>
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
					<Typography sx={{ mb: 0.5, fontWeight: 700 }}>
						El código ERP debe coincidir con SIESA
						(3 caracteres).
					</Typography>
					<Typography variant="body2">
						Compañías a las que tienes acceso. Al crear una
						compañía nueva, quedas asignado automáticamente
						con un rol Administrador en ella.
					</Typography>
				</Box>
			</Paper>

			<Dialog
				open={dialogoAbierto}
				onClose={() => !guardando && setDialogoAbierto(false)}
				fullWidth
				maxWidth="xs"
			>
				<DialogTitle>Crear compañía</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 0.5 }}>
						{errorDialogo ? (
							<Alert severity="error">{errorDialogo}</Alert>
						) : null}
						<TextField
							label="Razón social"
							fullWidth
							size="small"
							value={razonSocial}
							onChange={(e) => setRazonSocial(e.target.value)}
							disabled={guardando}
						/>
						<TextField
							label="Código ERP"
							fullWidth
							size="small"
							value={codErp}
							onChange={(e) => setCodErp(e.target.value.toUpperCase())}
							disabled={guardando}
							helperText={`Exactamente ${COD_ERP_LARGO} caracteres, debe coincidir con SIESA`}
							slotProps={{ htmlInput: { maxLength: COD_ERP_LARGO } }}
						/>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDialogoAbierto(false)} disabled={guardando}>
						Cancelar
					</Button>
					<Button
						variant="contained"
						onClick={guardarCompania}
						disabled={guardando}
						sx={sxBotonAzul}
					>
						Guardar
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={ciaEliminando !== null}
				onClose={() => !eliminando && setCiaEliminando(null)}
				fullWidth
				maxWidth="xs"
			>
				<DialogTitle>Eliminar compañía</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 0.5 }}>
						{errorEliminar ? (
							<Alert severity="error">{errorEliminar}</Alert>
						) : null}
						<Typography variant="body2">
							¿Eliminar <strong>{ciaEliminando?.razonSocial}</strong>? Quedará
							inactiva y dejará de estar disponible para todos los usuarios
							con acceso a ella.
						</Typography>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setCiaEliminando(null)} disabled={eliminando}>
						Cancelar
					</Button>
					<Button
						variant="contained"
						color="error"
						onClick={confirmarEliminar}
						disabled={eliminando}
					>
						Eliminar
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	)
}
