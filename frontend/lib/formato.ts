export function formatoMoneda(valor: number): string {
	return new Intl.NumberFormat('es-CO', {
		style: 'currency',
		currency: 'COP',
		maximumFractionDigits: 0,
	}).format(valor)
}

export function siNo(valor: boolean): string {
	return valor ? 'Sí' : 'No'
}

export function descargarCsv(
	nombre: string,
	encabezados: string[],
	filas: Array<Array<string | number>>,
): void {
	const escape = (celda: string | number) =>
		`"${String(celda).replaceAll('"', '""')}"`
	const lineas = [
		encabezados.map(escape).join(','),
		...filas.map((fila) => fila.map(escape).join(',')),
	]
	const blob = new Blob([`\uFEFF${lineas.join('\n')}`], {
		type: 'text/csv;charset=utf-8;',
	})
	const url = URL.createObjectURL(blob)
	const enlace = document.createElement('a')
	enlace.href = url
	enlace.download = nombre
	enlace.click()
	URL.revokeObjectURL(url)
}
