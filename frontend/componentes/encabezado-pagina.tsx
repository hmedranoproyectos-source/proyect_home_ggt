'use client'

import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { CampoFiltro } from '@/componentes/campo-filtro'
import { useSesion } from '@/lib/sesion-contexto'
import { colores } from '@/lib/tema'

interface Props {
	titulo: string
}

export function EncabezadoPagina({ titulo }: Props) {
	const { sesion, seleccionarCia } = useSesion()
	const varias = (sesion?.companias.length ?? 0) > 1

	return (
		<Stack
			direction={{ xs: 'column', md: 'row' }}
			spacing={2}
			sx={{
				mb: 3,
				justifyContent: 'space-between',
				alignItems: { md: 'flex-end' },
			}}
		>
			<Typography
				variant="h1"
				sx={{ color: colores.navy, fontSize: { xs: 22, md: 28 } }}
			>
				{titulo}
			</Typography>
			{sesion ? (
				varias ? (
					<CampoFiltro
						etiqueta="Compañía"
						sx={{ minWidth: 240 }}
					>
						<TextField
							select
							fullWidth
							size="small"
							value={sesion.idCia}
							onChange={(e) =>
								seleccionarCia(Number(e.target.value))
							}
						>
							{sesion.companias.map((cia) => (
								<MenuItem key={cia.id} value={cia.id}>
									{cia.razonSocial}
								</MenuItem>
							))}
						</TextField>
					</CampoFiltro>
				) : (
					<Box>
						<Typography
							sx={{
								fontSize: 11,
								fontWeight: 600,
								mb: 0.5,
							}}
						>
							Compañía
						</Typography>
						<Typography variant="body2">
							{sesion.razonSocial}
						</Typography>
					</Box>
				)
			) : null}
		</Stack>
	)
}
