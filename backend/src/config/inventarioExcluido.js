// Copiado tal cual de zoho-payment-tracker/backend/src/baia-kristal/config/inventarioExcluido.js.
// Unidades que NO deben contarse en ningún reporte ni listado del
// portafolio. Reversible a pedido: para volver a incluir una torre, basta
// con quitarla de este Set.
const PROYECTO_TORRE_EXCLUIDOS = new Set(['Vela Village - Torre 2']);

function estaExcluidoDelPortafolio(proyectoTorreRaw) {
  return PROYECTO_TORRE_EXCLUIDOS.has(String(proyectoTorreRaw ?? '').trim());
}

// Unidades marcadas manualmente con un "*" al inicio del nombre -- convención
// del equipo en Zoho para señalar un registro de Producto retirado/duplicado.
function esNombreMarcadoInvalido(nombreRaw) {
  return /^\*/.test(String(nombreRaw ?? '').trim());
}

module.exports = { PROYECTO_TORRE_EXCLUIDOS, estaExcluidoDelPortafolio, esNombreMarcadoInvalido };
