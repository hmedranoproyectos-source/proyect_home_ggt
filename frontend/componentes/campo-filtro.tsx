import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { colores } from '@/lib/tema'

export function CampoFiltro({
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
