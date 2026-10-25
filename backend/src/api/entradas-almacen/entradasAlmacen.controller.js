const db = require('../../config/db');
const entradaAlmacenService = require('../../services/entradaAlmacenService');
const siesaService = require('../../adapters/siesa/siesaService');
const { buildLinea451, buildLinea470 } = require('../../adapters/siesa/entradaAlmacenBuilder');

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

// Endpoint de DIAGNOSTICO para Postman: arma el registro 451 o 470 con los
// mismos builders del flujo real, pero con datos libres (sin leer ni escribir
// facturas/entradas_almacen en MySQL) y devuelve la respuesta cruda de
// ImportarXML, para descubrir de donde sale el consecutivo autogenerado.
// Por defecto es dry-run (devuelve el XML que enviaria, sin llamar a SIESA);
// solo con `enviar: true` escribe en SIESA. Se retira/automatiza tras
// confirmar el shape de la respuesta (ver docs/siesa-plano-entradas-almacen.md).
async function probarImportacion(req, res, next) {
  try {
    const {
      enviar = false,
      registro,
      cod_erp_cia: codErpCia,
      parametros = {},
      proveedor = {},
      factura = {},
      notas = '',
      consec_docto: consecDocto,
      detalles = [],
      overrides = {},
    } = req.body;

    if (registro !== '451' && registro !== '470') {
      return res.status(400).json({ error: "registro debe ser '451' o '470'" });
    }

    let cia = { cod_erp: codErpCia };
    if (!codErpCia) {
      const [companias] = await db.query('SELECT cod_erp FROM companias WHERE id = ? LIMIT 1', [
        req.user.id_cia,
      ]);
      if (companias.length === 0) {
        return res.status(400).json({ error: `Compania id=${req.user.id_cia} no existe` });
      }
      cia = companias[0];
    }

    let lineas;
    if (registro === '451') {
      lineas = [
        buildLinea451({
          cia,
          factura: { id: 0, referencia_oc: null, ...factura },
          proveedor,
          parametrosFormulario: parametros,
          notas,
        }),
      ];
    } else {
      if (!consecDocto) {
        return res.status(400).json({ error: 'consec_docto es requerido para el registro 470' });
      }
      if (!Array.isArray(detalles) || detalles.length === 0) {
        return res.status(400).json({ error: 'detalles (array no vacio) es requerido para 470' });
      }
      lineas = detalles.map((d, index) =>
        buildLinea470({
          cia,
          consecDocto,
          nroRegistro: index + 1,
          equivalencia: {
            cod_erp_item: d.item,
            cod_erp_um: d.um,
            cod_erp_um_precio: d.um_precio || d.um,
          },
          detalleFactura: {
            cantidad: d.cantidad,
            vlr_unitario: d.vlr_unitario ?? Number(d.vlr_bruto) / Number(d.cantidad),
            notas: d.notas,
          },
          parametrosFormulario: parametros,
        })
      );
    }

    // overrides permite ajustar/agregar cualquier campo del plano a todas
    // las lineas sin tocar codigo; undefined se descarta para no serializar
    // tags vacios.
    lineas = lineas.map((linea) =>
      Object.fromEntries(
        Object.entries({ ...linea, ...overrides }).filter(([, v]) => v !== undefined)
      )
    );

    // Igual que entradaAlmacenService: IdCia del sobre SOAP es el id_cia de la sesion.
    const idCia = req.user.id_cia;
    if (!enviar) {
      return res.status(200).json({
        enviado: false,
        aviso: 'dry-run: no se llamo a SIESA. Reenvia con "enviar": true para escribir.',
        lineas,
        xml: siesaService.previsualizarXml({ idCia, lineas }),
      });
    }

    const resultado = await siesaService.importarXML({ idCia, lineas });
    return res.status(200).json({
      enviado: true,
      ok: resultado.ok,
      errores: resultado.errores,
      lineas,
      resultadoCrudo: resultado.resultadoCrudo,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { crear, probarImportacion };
