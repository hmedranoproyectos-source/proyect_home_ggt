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
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { sxBotonVerde, sxEncabezadoTabla } from '@/lib/estilos-ui'
import { useSesion } from '@/lib/sesion-contexto'
import { colores, RADIO_CARD } from '@/lib/tema'

export function TabCompanias() {
	const { sesion, seleccionarCia } = useSesion()
	const lista = sesion?.companias ?? []

	return (
		<Box>
			<Stack
				direction="row"
				sx={{
					mb: 2,
					justifyContent: 'flex-end',
				}}
			>
				<Tooltip title="Disponible próximamente">
					<span>
						<Button variant="contained" disabled sx={sxBotonVerde}>
							CREAR
						</Button>
					</span>
				</Tooltip>
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
										onClick={() => seleccionarCia(cia.id)}
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
						Compañías a las que tienes acceso. La creación de
						compañías estará disponible próximamente.
					</Typography>
				</Box>
			</Paper>
		</Box>
	)
}
