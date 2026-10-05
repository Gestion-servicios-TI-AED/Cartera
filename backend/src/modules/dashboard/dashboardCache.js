// Cache en memoria del cálculo pesado del Dashboard (construirPlan +
// normalizarPagos + conciliar por cada inmueble del portafolio) -- extraído
// a su propio archivo (el legado lo tenía inline en dashboardRecaudoService.js)
// para que los módulos que invalidan el cache (Inventario, Oportunidad,
// Fiducia, Negocio, ConfiguracionFrente) puedan importar solo esto sin crear
// un require circular con dashboard.service.js (que sí necesita esos
// módulos para leer sus datos).
let cache = null; // { filas, valores, builtAt }
let cacheEnConstruccion = null;

function getCache() {
  return cache;
}

function getEnConstruccion() {
  return cacheEnConstruccion;
}

function setCache(valor) {
  cache = valor;
}

function setEnConstruccion(promesa) {
  cacheEnConstruccion = promesa;
}

function invalidarCacheDashboard() {
  cache = null;
  cacheEnConstruccion = null;
}

module.exports = { getCache, getEnConstruccion, setCache, setEnConstruccion, invalidarCacheDashboard };
