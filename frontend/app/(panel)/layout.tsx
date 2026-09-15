import Box from '@mui/material/Box'
import { BarraLateral } from '@/componentes/barra-lateral'
import { GuardarRuta } from '@/componentes/guardar-ruta'
import { colores, estilosPanel } from '@/lib/tema'

export default function PanelLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<GuardarRuta>
			<Box sx={{ display: 'flex', minHeight: '100vh' }}>
				<BarraLateral />
				<Box
					component="main"
					sx={{
						flex: 1,
						backgroundColor: colores.fondo,
						px: { xs: 2, md: 4 },
						py: { xs: 3, md: 4 },
						minWidth: 0,
						...estilosPanel,
					}}
				>
					{children}
				</Box>
			</Box>
		</GuardarRuta>
	)
}
