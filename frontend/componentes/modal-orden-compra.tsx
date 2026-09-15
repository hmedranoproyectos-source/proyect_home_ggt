'use client'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'

interface Props {
	oc: string | null
	onClose: () => void
}

export function ModalOrdenCompra({ oc, onClose }: Props) {
	return (
		<Dialog open={Boolean(oc)} onClose={onClose} fullWidth>
			<DialogTitle>Orden de compra {oc}</DialogTitle>
			<DialogContent>
				<Typography variant="body2">
					Consulta de la OC contra SIESA. En esta primera
					versión se muestra la referencia {oc} sin el
					detalle de líneas del ERP.
				</Typography>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button variant="outlined" onClick={onClose}>
					Cerrar
				</Button>
			</DialogActions>
		</Dialog>
	)
}
