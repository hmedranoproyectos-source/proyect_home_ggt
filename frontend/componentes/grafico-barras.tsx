import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { colores } from '@/lib/tema'

interface Props {
	datos: Array<{ dia: string; valor: number }>
}

export function GraficoBarras({ datos }: Props) {
	const maximo = Math.max(...datos.map((d) => d.valor), 1)

	return (
		<Stack
			direction="row"
			spacing={2}
			sx={{ height: 180, px: 1, alignItems: 'flex-end' }}
		>
			{datos.map((punto, index) => (
				<Stack
					key={`${punto.dia}-${index}`}
					spacing={1}
					sx={{ flex: 1, alignItems: 'center' }}
				>
					<Box
						sx={{
							width: '70%',
							maxWidth: 36,
							height: `${(punto.valor / maximo) * 140}px`,
							backgroundColor: colores.chart,
							borderRadius: '6px 6px 2px 2px',
						}}
					/>
					<Typography variant="caption" color="text.secondary">
						{punto.dia}
					</Typography>
				</Stack>
			))}
		</Stack>
	)
}
