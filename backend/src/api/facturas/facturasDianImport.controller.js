const facturasDianImportService = require('../../services/facturasDianImportService');
const { ExcelFormatoInvalidoError } = require('../../parsers/facturasDianExcelParser');
const { auditar } = require('../../middleware/auth');

// POST /api/facturas/dian/importar-excel (Informes -> "Cargar archivo y
// comparar" -> SELECCIONAR ARCHIVO). Carga manual de facturas_dian (RI-03/04).
async function importarExcel(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }
    if (!req.file.originalname.toLowerCase().endsWith('.xlsx')) {
      return res.status(400).json({ error: 'El archivo debe ser .xlsx' });
    }

    const resumen = await facturasDianImportService.importarExcel(req.user.id_cia, req.file.buffer);

    auditar(req, {
      // id_entidad es NOT NULL en auditoria_acciones y esta accion afecta N
      // filas de facturas_dian, no una sola -- se usa 0 como convencion de
      // "carga masiva" (no existe hoy un id de lote en el esquema oficial).
      entidad: 'facturas_dian',
      idEntidad: 0,
      accion: 'carga_excel',
      dataAfter: {
        archivo: req.file.originalname,
        total: resumen.total,
        insertadas: resumen.insertadas,
        duplicadas: resumen.duplicadas,
        conError: resumen.conError,
      },
    });

    res.json(resumen);
  } catch (err) {
    if (err instanceof ExcelFormatoInvalidoError) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

// GET /api/facturas/dian (Informes -> tab "Facturas Dian").
async function listar(req, res, next) {
  try {
    const facturas = await facturasDianImportService.listarParaCia(req.user.id_cia);
    res.json(facturas);
  } catch (err) {
    next(err);
  }
}

module.exports = { importarExcel, listar };
