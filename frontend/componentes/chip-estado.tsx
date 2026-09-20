'use client'

import Chip from '@mui/material/Chip'
import { colores } from '@/lib/tema'
import type { EstadoFactura, MarcaSiesa } from '@/lib/tipos'

// Un color por cada uno de los 5 estados reales (estados_documentos). El
// significado de cada color se conserva del diseño original: ambar =
// pendiente de iniciar, gris = en proceso, rojo = requiere atención, azul =
// ya en el ERP, verde = ciclo completo.
const ESTILO_ESTADO: Record<
	EstadoFactura,
	{ bg: string; fg: string }
> = {
	NUEVA: {
		bg: colores.ingresarBg,
		fg: colores.ingresarFg,
	},
	EN_VALIDACION: {
		bg: colores.pendienteBg,
		fg: colores.pendienteFg,
	},
	ALERTA: {
		bg: colores.novedadBg,
		fg: colores.novedadFg,
	},
	REGISTRADA_ERP: { bg: colores.erpBg, fg: colores.erpFg },
	CONTABILIZADA: { bg: colores.okBg, fg: colores.okFg },
}

const PADDING_CHIP = {
	'& .MuiChip-label': {
		px: '26px',
	},
} as const

interface ChipEstadoProps {
	estado: EstadoFactura
}

export function ChipEstado({ estado }: ChipEstadoProps) {
	const estilo = ESTILO_ESTADO[estado]
	return (
		<Chip
			label={estado}
			size="small"
			sx={{
				backgroundColor: estilo.bg,
				color: estilo.fg,
				fontWeight: 700,
				...PADDING_CHIP,
			}}
		/>
	)
}

interface ChipSiesaProps {
	valor: MarcaSiesa
}

export function ChipSiesa({ valor }: ChipSiesaProps) {
	if (valor === 'Pendiente') {
		return (
			<Chip
				label="Pendiente"
				size="small"
				sx={{
					backgroundColor: colores.pendienteBg,
					color: colores.pendienteFg,
					fontWeight: 600,
					...PADDING_CHIP,
				}}
			/>
		)
	}
	if (valor === 'Periodo cerrado') {
		return (
			<Chip
				label="Periodo cerrado"
				size="small"
				sx={{
					backgroundColor: colores.novedadBg,
					color: colores.novedadFg,
					fontWeight: 700,
					...PADDING_CHIP,
				}}
			/>
		)
	}
	return (
		<Chip
			label={valor}
			size="small"
			sx={{
				backgroundColor: colores.okBg,
				color: colores.okFg,
				fontWeight: 700,
				...PADDING_CHIP,
			}}
		/>
	)
}

interface ChipUsuarioProps {
	estado: 'Activo' | 'Inactivo'
}

export function ChipUsuario({ estado }: ChipUsuarioProps) {
	const activo = estado === 'Activo'
	return (
		<Chip
			label={estado}
			size="small"
			sx={{
				backgroundColor: activo
					? colores.okBg
					: colores.pendienteBg,
				color: activo ? colores.okFg : colores.pendienteFg,
				fontWeight: 700,
			}}
		/>
	)
}
