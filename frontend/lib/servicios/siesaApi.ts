import { api } from '../api'
import type { FilaCatalogoSiesa } from '../tipos'

// Consultas de solo lectura contra UnoEE (ver siesaConsultas.controller.js
// / siesaConsultasService.js -- EjecutarConsultaXMLAsync), usadas para
// poblar los Select del formulario de ingreso a almacen. El shape de cada
// fila no esta confirmado (ver FilaCatalogoSiesa); se consumen con
// extraerOpcion en modal-ingresar-factura.tsx.

export async function obtenerCentrosOperacion(): Promise<FilaCatalogoSiesa[]> {
	const { data } = await api.get<FilaCatalogoSiesa[]>('/siesa/centros-operacion')
	return data
}

export async function obtenerBodegasPorCo(idCo: string): Promise<FilaCatalogoSiesa[]> {
	const { data } = await api.get<FilaCatalogoSiesa[]>('/siesa/bodegas-por-co', {
		params: { id_co: idCo },
	})
	return data
}

export async function obtenerUnidadesNegocios(): Promise<FilaCatalogoSiesa[]> {
	const { data } = await api.get<FilaCatalogoSiesa[]>('/siesa/unidades-negocios')
	return data
}

export async function obtenerCentrosCostos(): Promise<FilaCatalogoSiesa[]> {
	const { data } = await api.get<FilaCatalogoSiesa[]>('/siesa/centros-costos')
	return data
}

export async function obtenerCompradores(): Promise<FilaCatalogoSiesa[]> {
	const { data } = await api.get<FilaCatalogoSiesa[]>('/siesa/compradores')
	return data
}

export async function obtenerMonedas(): Promise<FilaCatalogoSiesa[]> {
	const { data } = await api.get<FilaCatalogoSiesa[]>('/siesa/monedas')
	return data
}

// motivosPorConcepto exige id_concepto (ver CONSULTAS en
// siesaConsultasService.js). El servicio backend fija el concepto en 401
// (Entrada Directa, clase 408 -- ver docs/siesa-plano-entradas-almacen.md)
// para el unico caso que cubre hoy, asi que se hardcodea aqui tambien.
const ID_CONCEPTO_ENTRADA_DIRECTA = '401'

export async function obtenerMotivosPorConcepto(): Promise<FilaCatalogoSiesa[]> {
	const { data } = await api.get<FilaCatalogoSiesa[]>('/siesa/motivos-por-concepto', {
		params: { id_concepto: ID_CONCEPTO_ENTRADA_DIRECTA },
	})
	return data
}

// tipoDocumentoPorClase exige id_clase_docto. 408 = Entradas Directas (ver
// docs/siesa-plano-entradas-almacen.md, f350_id_clase_docto).
const ID_CLASE_DOCTO_ENTRADA_DIRECTA = '408'

export async function obtenerTipoDocumentoPorClase(): Promise<FilaCatalogoSiesa[]> {
	const { data } = await api.get<FilaCatalogoSiesa[]>('/siesa/tipo-documento-por-clase', {
		params: { id_clase_docto: ID_CLASE_DOCTO_ENTRADA_DIRECTA },
	})
	return data
}
