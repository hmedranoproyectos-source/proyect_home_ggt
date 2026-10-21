import { api } from '../api'
import type {
	CrearEntradaAlmacenResponse,
	ParametrosFormularioEntradaAlmacen,
} from '../tipos'

// POST /api/entradas-almacen (entradaAlmacenService.crearEntradaAlmacen).
// Alcance actual: solo facturas sin OC asociada -- el backend rechaza
// explicitamente lo contrario (assertSinOrdenCompra). Ver
// docs/siesa-plano-entradas-almacen.md.
export async function crearEntradaAlmacen(
	idFactura: number,
	parametrosFormulario: ParametrosFormularioEntradaAlmacen,
	notas?: string,
): Promise<CrearEntradaAlmacenResponse> {
	const { data } = await api.post<CrearEntradaAlmacenResponse>('/entradas-almacen', {
		idFactura,
		parametrosFormulario,
		notas,
	})
	return data
}
