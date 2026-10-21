import { api } from '../api'
import type { FacturaDianApp } from '../tipos'

export interface ErrorFilaExcel {
	fila: number
	motivo: string
}

export interface ResumenImportacionDian {
	total: number
	insertadas: number
	duplicadas: number
	conError: number
	errores: ErrorFilaExcel[]
}

// POST /api/facturas/dian/importar-excel (Informes -> SELECCIONAR ARCHIVO,
// RI-03/04). Inserta cada fila del Excel en facturas_dian; filas duplicadas
// (RC-04) o con datos inválidos se omiten y quedan reflejadas en el resumen.
export async function importarFacturasDianExcel(
	archivo: File,
): Promise<ResumenImportacionDian> {
	const formData = new FormData()
	formData.append('archivo', archivo)

	const { data } = await api.post<ResumenImportacionDian>(
		'/facturas/dian/importar-excel',
		formData,
	)
	return data
}

// GET /api/facturas/dian (Informes -> tab "Facturas Dian").
export async function obtenerFacturasDian(): Promise<FacturaDianApp[]> {
	const { data } = await api.get<FacturaDianApp[]>('/facturas/dian')
	return data
}
