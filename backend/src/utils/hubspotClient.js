// Cliente HubSpot para el proyecto Oliv -- CRM distinto al de Baía Kristal
// (Zoho), lógica y datos separados a propósito (ver utils/zohoAuth.js para
// el otro lado). HubSpot usa "Private App" access tokens: un token estático
// generado a mano en el portal de HubSpot (Settings → Integrations → Private
// Apps), sin flujo OAuth de por medio -- mucho más simple que el
// refresh-token de Zoho (zohoAuth.js), no hay nada que renovar.
const axios = require('axios');

const HUBSPOT_API_BASE = process.env.HUBSPOT_API_BASE || 'https://api.hubapi.com';

function tokenConfigurado() {
  return !!process.env.HUBSPOT_ACCESS_TOKEN;
}

function _headers() {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error('HUBSPOT_ACCESS_TOKEN no configurado en .env');
  return { Authorization: `Bearer ${token}` };
}

async function hubspotGet(path, params = {}) {
  const { data } = await axios.get(`${HUBSPOT_API_BASE}${path}`, { headers: _headers(), params });
  return data;
}

async function hubspotPost(path, body = {}) {
  const { data } = await axios.post(`${HUBSPOT_API_BASE}${path}`, body, {
    headers: { ..._headers(), 'Content-Type': 'application/json' },
  });
  return data;
}

async function hubspotPatch(path, body = {}) {
  const { data } = await axios.patch(`${HUBSPOT_API_BASE}${path}`, body, {
    headers: { ..._headers(), 'Content-Type': 'application/json' },
  });
  return data;
}

// Actualiza propiedades de un objeto puntual (ej. Deal) -- primer uso real:
// completar a mano `referencia_de_recaudo` en negocios de Oliv que llegaron
// vacíos desde el asesor comercial (pedido explícito del usuario,
// 2026-09-14, tras confirmar cuáles negocios del Excel de Encargos no
// cruzaban por tener ese campo vacío en HubSpot).
async function actualizarPropiedadesObjeto(objectType, objectId, properties) {
  return hubspotPatch(`/crm/v3/objects/${objectType}/${objectId}`, { properties });
}

// Metadatos de propiedades de un objeto de HubSpot (equivalente a
// /settings/fields de Zoho, ver oportunidad/zohoFieldMetadata.model.js) --
// permite mapear dinámicamente qué propiedades trae un Deal de Oliv sin
// hardcodear nombres, igual criterio que el sync de Zoho.
async function listarPropiedades(objectType = 'deals') {
  const data = await hubspotGet(`/crm/v3/properties/${objectType}`);
  return data.results || [];
}

// POST .../search en vez de GET .../objects/<tipo> -- soporta pedir muchas
// propiedades a la vez sin pelear con el límite de largo de querystring de
// un GET, y acepta `filterGroups` para filtrar del lado de HubSpot (ej. por
// proyecto) en vez de traer todo y descartar en el cliente. `objectType`
// acepta tanto los objetos estándar ('deals') como el id de un objeto
// personalizado de HubSpot (ej. '2-51798334', el objeto "Unidades" de Oliv
// -- ver olivInmueble.sync.js).
async function buscarObjeto(objectType, { properties = [], limit = 100, after, filterGroups = [], sorts } = {}) {
  return hubspotPost(`/crm/v3/objects/${objectType}/search`, {
    limit,
    after,
    properties,
    filterGroups,
    sorts: sorts ?? [{ propertyName: 'hs_lastmodifieddate', direction: 'DESCENDING' }],
  });
}

async function buscarDeals(params) {
  return buscarObjeto('deals', params);
}

// Pipelines + etapas de un objeto (deals) -- HubSpot devuelve `dealstage`
// como el ID interno de la etapa dentro de su pipeline, no la etiqueta
// legible ("Cotización enviada"); hay que resolverlo aparte.
async function listarPipelines(objectType = 'deals') {
  const data = await hubspotGet(`/crm/v3/pipelines/${objectType}`);
  return data.results || [];
}

// Asociaciones nativas de HubSpot entre un objeto origen y un tipo de
// objeto destino (ej. Deal -> Unidad, `toObjectType` = '2-51798334') --
// más confiable que cruzar por texto/código: es la relación real que
// Centro-Aplicaciones-Comerciales-AED ya crea al asociar una unidad a un
// negocio (ver POST /api/associate-unit ahí), no depende de que exista una
// cotización aceptada. Devuelve un arreglo de IDs (vacío si no hay
// asociación) -- se usa para vincular Oliv Negocio -> OlivInmueble, ver
// olivNegocio.service.js.
async function listarAsociaciones(objectType, objectId, toObjectType) {
  const data = await hubspotGet(`/crm/v4/objects/${objectType}/${objectId}/associations/${toObjectType}`);
  return (data.results || []).map((r) => String(r.toObjectId));
}

module.exports = { tokenConfigurado, hubspotGet, hubspotPost, hubspotPatch, listarPropiedades, buscarObjeto, buscarDeals, listarPipelines, listarAsociaciones, actualizarPropiedadesObjeto };
