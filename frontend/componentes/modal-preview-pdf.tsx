'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { colores } from '@/lib/tema'

interface Props {
	abierto: boolean
	titulo: string
	url: string | null
	cargando: boolean
	onClose: () => void
}

// Visor de PDF embebido en la propia app (Dialog + <iframe> sobre un blob
// URL ya descargado por el llamador, ver facturas/[id]/page.tsx). El <iframe>
// delega el render al visor de PDF nativo del navegador -- no se agrega una
// libreria de renderizado de PDF nueva para esto.
export function ModalPreviewPdf({ abierto, titulo, url, cargando, onClose }: Props) {
	return (
		<Dialog
			open={abierto}
			onClose={onClose}
			fullWidth
			maxWidth="md"
			slotProps={{
				paper: {
					sx: { height: '90vh' },
				},
			}}
		>
			<DialogTitle>{titulo}</DialogTitle>
			<DialogContent
				sx={{
					p: 0,
					display: 'flex',
					flexDirection: 'column',
					backgroundColor: colores.fondo,
				}}
			>
				{cargando ? (
					<Box
						sx={{
							flex: 1,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<CircularProgress size={28} />
					</Box>
				) : url ? (
					<Box
						component="iframe"
						src={url}
						title={titulo}
						sx={{ flex: 1, border: 0, width: '100%' }}
					/>
				) : (
					<Box
						sx={{
							flex: 1,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							p: 3,
						}}
					>
						<Typography variant="body2">
							No se pudo cargar el PDF.
						</Typography>
					</Box>
				)}
			</DialogContent>
			<DialogActions sx={{ px: 3, py: 1.5 }}>
				<Button variant="outlined" onClick={onClose}>
					Cerrar
				</Button>
			</DialogActions>
		</Dialog>
	)
}
