const entradaAlmacenService = require('../../services/entradaAlmacenService');

// Alcance actual: solo facturas con referencia_oc nula (ver
// docs/siesa-plano-entradas-almacen.md). parametrosFormulario son los
// campos que el usuario captura en la pantalla de ingreso a almacen.
async function crear(req, res, next) {
  try {
    const { idFactura, parametrosFormulario, notas } = req.body;

    if (!idFactura) {
      return res.status(400).json({ error: 'idFactura es requerido' });
    }
    if (!parametrosFormulario || typeof parametrosFormulario !== 'object') {
      return res.status(400).json({ error: 'parametrosFormulario (objeto) es requerido' });
    }

    const camposRequeridos = [
      'centro_operacion',
      'tipo_documento',
      'bodega',
      'motivo',
      'centro_operacion_movto',
      'unidad_negocio',
      'tercero_comprador',
      'moneda',
    ];
    const faltantes = camposRequeridos.filter((campo) => !parametrosFormulario[campo]);
    if (faltantes.length > 0) {
      return res
        .status(400)
        .json({ error: `parametrosFormulario incompleto: ${faltantes.join(', ')}` });
    }

    const resultado = await entradaAlmacenService.crearEntradaAlmacen({
      idCia: req.user.id_cia,
      idFactura,
      notas,
      parametrosFormulario: {
        ...parametrosFormulario,
        idUsuario: req.user.id_usuario,
        ipAddress: req.ip,
      },
    });

    return res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = { crear };
