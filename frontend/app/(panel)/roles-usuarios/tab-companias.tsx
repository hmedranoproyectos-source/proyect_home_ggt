'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { CampoFiltro } from '@/componentes/campo-filtro'
import { COMPANIAS } from '@/lib/datos-mock'
import {
	sxBotonVerde,
	sxEncabezadoTabla,
} from '@/lib/estilos-ui'
import { useSesion } from '@/lib/sesion-contexto'
import { colores, RADIO_CARD } from '@/lib/tema'
import type { CompaniaApp } from '@/lib/tipos'

export function TabCompanias() {
	const { sesion, seleccionarCia, agregarCompania } = useSesion()
	const lista = sesion?.companias ?? COMPANIAS
	const [creando, setCreando] = useState(false)
	const [razonSocial, setRazonSocial] = useState('')
	const [codErp, setCodErp] = useState('')
	const [aviso, setAviso] = useState('')

	function handleCrear() {
		const razon = razonSocial.trim()
		const codigo = codErp.trim().toUpperCase()
		if (!razon || codigo.length !== 3) {
			return
		}
		const nueva: CompaniaApp = {
			id: Date.now(),
			razonSocial: razon,
			codErp: codigo,
		}
		agregarCompania(nueva)
		setRazonSocial('')
		setCodErp('')
		setCreando(false)
		setAviso(
			'Compañía creada. Asigna usuarios desde la pestaña Usuarios.',
		)
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
					onClick={() => setCreando(true)}
					sx={sxBotonVerde}
				>
					CREAR
				</Button>
			</Stack>
			<Paper sx={{ borderRadius: RADIO_CARD, overflow: 'hidden' }}>
				<Table>
					<TableHead sx={sxEncabezadoTabla}>
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
									<Button
										size="small"
										variant="outlined"
										disabled={sesion?.idCia === cia.id}
										onClick={() =>
											seleccionarCia(cia.id)
										}
									>
										Activar
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
					<Typography sx={{ mb: 0.5, fontWeight: 700 }}>
						El código ERP debe coincidir con SIESA
						(3 caracteres).
					</Typography>
					<Typography variant="body2">
						Crear compañía no crea usuarios. El acceso se
						asigna después en Usuarios, con un rol de esa
						compañía.
					</Typography>
				</Box>
			</Paper>

			<Dialog
				open={creando}
				onClose={() => setCreando(false)}
				fullWidth
				slotProps={{
					paper: { sx: { borderRadius: RADIO_CARD } },
				}}
			>
				<DialogTitle>Crear compañía</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<CampoFiltro etiqueta="Razón social *">
							<TextField
								fullWidth
								size="small"
								value={razonSocial}
								onChange={(e) =>
									setRazonSocial(e.target.value)
								}
							/>
						</CampoFiltro>
						<CampoFiltro etiqueta="Código ERP *">
							<TextField
								fullWidth
								size="small"
								value={codErp}
								onChange={(e) =>
									setCodErp(
										e.target.value
											.slice(0, 3)
											.toUpperCase(),
									)
								}
								helperText="3 caracteres, igual al cod_erp de SIESA"
							/>
						</CampoFiltro>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button
						variant="outlined"
						onClick={() => setCreando(false)}
						sx={{ borderRadius: RADIO_CARD }}
					>
						Cancelar
					</Button>
					<Button
						variant="contained"
						disabled={
							!razonSocial.trim() ||
							codErp.trim().length !== 3
						}
						onClick={handleCrear}
						sx={sxBotonVerde}
					>
						Crear
					</Button>
				</DialogActions>
			</Dialog>
			<Snackbar
				open={Boolean(aviso)}
				autoHideDuration={3500}
				onClose={() => setAviso('')}
				message={aviso}
			/>
		</Box>
	)
}
