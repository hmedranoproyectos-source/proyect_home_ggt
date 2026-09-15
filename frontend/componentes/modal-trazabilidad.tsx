'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useRef } from 'react'
import { colores } from '@/lib/tema'
import { trazabilidadDe } from '@/lib/datos-mock'
import type { EventoTrazabilidad } from '@/lib/tipos'

interface Props {
	facturaId: string | null
	onClose: () => void
}

function colorEvento(evento: EventoTrazabilidad) {
	const titulo = evento.titulo.toLowerCase()
	if (
		titulo.includes('entrada') ||
		titulo.includes('causaci') ||
		titulo.includes('en erp')
	) {
		return colores.okFg
	}
	return colores.azul
}

export function ModalTrazabilidad({ facturaId, onClose }: Props) {
	const ultimaId = useRef<string | null>(null)
	if (facturaId) {
		ultimaId.current = facturaId
	}
	const idPanel = facturaId ?? ultimaId.current
	const eventos = idPanel ? trazabilidadDe(idPanel) : []

	return (
		<Drawer
			anchor="right"
			open={Boolean(facturaId)}
			onClose={onClose}
			slotProps={{
				paper: {
					sx: {
						width: { xs: '100%', sm: 400 },
						borderRadius: 0,
						p: 4,
						display: 'flex',
						flexDirection: 'column',
						'& .MuiTypography-h3': { fontSize: 12 },
						'& .MuiTypography-body1': { fontSize: 12 },
						'& .MuiTypography-body2': { fontSize: 10 },
					},
				},
			}}
		>
			<Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
				Trazabilidad de {idPanel}
			</Typography>
			<Typography variant="body2" sx={{ mb: 3 }}>
				Consulta desde el informe por estado
			</Typography>
			<Stack spacing={2.5} sx={{ flex: 1 }}>
				{eventos.map((evento, index) => (
					<Stack
						key={`${evento.titulo}-${index}`}
						direction="row"
						spacing={2}
					>
						<Box
							sx={{
								position: 'relative',
								width: 14,
								flexShrink: 0,
								display: 'flex',
								justifyContent: 'center',
							}}
						>
							{index < eventos.length - 1 ? (
								<Box
									sx={{
										position: 'absolute',
										top: 12,
										bottom: -28,
										width: 2,
										backgroundColor: colores.borde,
									}}
								/>
							) : null}
							<Box
								sx={{
									width: 12,
									height: 12,
									borderRadius: '50%',
									backgroundColor: colorEvento(evento),
									mt: 0.4,
									zIndex: 1,
								}}
							/>
						</Box>
						<Box>
											<Typography
								sx={{ fontWeight: 700, fontSize: 12 }}
							>
								{evento.titulo}
							</Typography>
							<Typography variant="body2">
								{evento.fecha} | {evento.actor}
							</Typography>
						</Box>
					</Stack>
				))}
			</Stack>
			<Button
				variant="outlined"
				onClick={onClose}
				sx={{
					mt: 4,
					alignSelf: 'flex-start',
					fontSize: 12,
					borderRadius: '10px',
				}}
			>
				CERRAR
			</Button>
		</Drawer>
	)
}
