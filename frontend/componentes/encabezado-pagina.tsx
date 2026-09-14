import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { colores } from '@/lib/tema'

interface Props {
	titulo: string
}

export function EncabezadoPagina({ titulo }: Props) {
	return (
		<Box sx={{ mb: 3 }}>
			<Typography
				variant="h1"
				sx={{ color: colores.navy, fontSize: { xs: 22, md: 28 } }}
			>
				{titulo}
			</Typography>
		</Box>
	)
}
