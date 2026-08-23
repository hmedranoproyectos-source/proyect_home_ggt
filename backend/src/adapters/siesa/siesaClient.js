const soap = require('soap');
const env = require('../../config/env');

let clientPromise = null;

function getClient() {
  if (!env.SIESA_WSDL_URL) {
    throw new Error('SIESA_WSDL_URL no está configurada');
  }

  if (!clientPromise) {
    // Un .asmx sin el query string ?WSDL devuelve la página HTML de
    // descripción del servicio (Service Help Page de ASP.NET), no el WSDL.
    const wsdlUrl = /[?&]wsdl(=|&|$)/i.test(env.SIESA_WSDL_URL)
      ? env.SIESA_WSDL_URL
      : `${env.SIESA_WSDL_URL}${env.SIESA_WSDL_URL.includes('?') ? '&' : '?'}WSDL`;

    clientPromise = soap.createClientAsync(wsdlUrl).catch((err) => {
      clientPromise = null;
      throw err;
    });
  }

  return clientPromise;
}

module.exports = { getClient };
