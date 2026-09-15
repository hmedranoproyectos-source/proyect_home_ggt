import { createTheme } from '@mui/material/styles'

export const colores = {
	navy: '#0A2642',
	navyHover: '#1C4B72',
	azul: '#0F5F9E',
	azulSuave: '#E9F4FB',
	chart: '#64B5E8',
	fondo: '#F4F6F9',
	papel: '#FFFFFF',
	texto: '#0A2642',
	textoSecundario: '#5A6E82',
	borde: '#D8DEE4',
	encabezadoTabla: '#E8EDF0',
	ingresarBg: '#FFF2D8',
	ingresarFg: '#B56700',
	novedadBg: '#FDEBE9',
	novedadFg: '#B32318',
	okBg: '#E6F6EF',
	okFg: '#11805B',
	erpBg: '#E9F4FB',
	erpFg: '#0F5E9E',
	pendienteBg: '#E8EDF0',
	pendienteFg: '#5A6E82',
	input: '#F2F5F7',
} as const

export const RADIO_CARD = '10px'

export const estilosPanel = {
	'& .MuiTypography-h1': {
		fontSize: { xs: 22, md: 28 },
	},
	'& .MuiTypography-h3': { fontSize: 14 },
	'& .MuiTypography-body1': { fontSize: 14 },
	'& .MuiTypography-body2': { fontSize: 12 },
	'& .MuiTypography-caption': { fontSize: 10 },
	'& .MuiTableCell-root': { fontSize: 11 },
	'& .MuiButton-sizeSmall': { fontSize: 11 },
	'& .MuiChip-label': { fontSize: 11 },
} as const

export const tema = createTheme({
	cssVariables: true,
	palette: {
		primary: {
			main: colores.navy,
			dark: '#061828',
			contrastText: '#FFFFFF',
		},
		secondary: {
			main: colores.azul,
		},
		success: {
			main: colores.okFg,
		},
		error: {
			main: colores.novedadFg,
		},
		warning: {
			main: colores.ingresarFg,
		},
		background: {
			default: colores.fondo,
			paper: colores.papel,
		},
		text: {
			primary: colores.texto,
			secondary: colores.textoSecundario,
		},
		divider: colores.borde,
	},
	typography: {
		fontFamily: 'var(--font-sans), Inter, Helvetica, Arial, sans-serif',
		h1: { fontSize: 28, fontWeight: 700, letterSpacing: -0.4 },
		h2: { fontSize: 20, fontWeight: 700, letterSpacing: -0.2 },
		h3: { fontSize: 14, fontWeight: 700 },
		button: {
			textTransform: 'none',
			fontWeight: 700,
			letterSpacing: 0.2,
		},
		body2: { fontSize: 12, color: colores.textoSecundario },
	},
	shape: { borderRadius: 10 },
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: 999,
					paddingInline: 22,
					paddingBlock: 8,
					boxShadow: 'none',
					'&:hover': { boxShadow: 'none' },
				},
				outlined: {
					borderColor: colores.borde,
					backgroundColor: colores.papel,
					color: colores.navy,
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					boxShadow: 'none',
					borderRadius: RADIO_CARD,
				},
			},
		},
		MuiChip: {
			styleOverrides: {
				root: {
					fontWeight: 600,
					borderRadius: 999,
				},
			},
		},
		MuiTableCell: {
			styleOverrides: {
				head: {
					backgroundColor: colores.encabezadoTabla,
					color: colores.textoSecundario,
					fontWeight: 700,
					borderBottom: 'none',
					fontSize: 11,
				},
				body: {
					borderBottom: `1px solid ${colores.fondo}`,
					fontSize: 11,
				},
			},
		},
		MuiOutlinedInput: {
			styleOverrides: {
				root: {
					borderRadius: 10,
					backgroundColor: colores.papel,
				},
			},
		},
	},
})
