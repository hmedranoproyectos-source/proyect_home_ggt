import { colores, RADIO_CARD } from '@/lib/tema'

export const sxBotonAzul = {
	backgroundColor: colores.azul,
	borderRadius: RADIO_CARD,
	'&:hover': { backgroundColor: '#0C4E82' },
} as const

export const sxBotonVerde = {
	backgroundColor: colores.okFg,
	borderRadius: RADIO_CARD,
	'&:hover': { backgroundColor: '#0C6A4B' },
} as const

export const sxTabsAzul = {
	mb: 3,
	'& .MuiTabs-indicator': {
		backgroundColor: colores.azul,
	},
	'& .MuiTab-root.Mui-selected': {
		color: colores.azul,
	},
} as const

export const sxEncabezadoTabla = {
	'& .MuiTableCell-root': {
		fontWeight: 800,
		fontSize: 12,
	},
} as const
