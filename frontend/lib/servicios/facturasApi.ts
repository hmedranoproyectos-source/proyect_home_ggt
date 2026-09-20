import { api } from '../api'
import type { FacturaApp, FacturaDetalleApp } from '../tipos'

export async function obtenerFacturas(): Promise<FacturaApp[]> {
	const { data } = await api.get<FacturaApp[]>('/facturas')
	return data
}

export async function obtenerFactura(id: number): Promise<FacturaDetalleApp> {
	const { data } = await api.get<FacturaDetalleApp>(`/facturas/${id}`)
	return data
}

// El endpoint exige el mismo Bearer token que el resto de la API (lo agrega
// el interceptor de axios en api.ts), asi que no se puede abrir con un
// <a href>/window.open directo a la URL -- el navegador no mandaria el
// header. Se descarga como blob autenticado y se abre desde un Object URL,
// igual que descargarCsv ya hace para el export.
export async function obtenerPdfFactura(id: number): Promise<Blob> {
	const { data } = await api.get<Blob>(`/facturas/${id}/pdf`, {
		responseType: 'blob',
	})
	return data
}
