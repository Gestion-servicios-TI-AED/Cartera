// Etiquetas en español de las propiedades del objeto "Unidades" de HubSpot
// (`OlivInmueble.propiedades`) -- HubSpot las devuelve con su nombre interno
// en inglés/snake_case, que antes se mostraba tal cual ("Built Area M2",
// "Unit Status"). Pedido del Jefe Gabriel (2026-10-01): "traduce el detalle
// a todo a español". Cualquier propiedad nueva que aparezca sin etiqueta aquí
// cae a `toLabel()` (snake_case -> Título), así que nada desaparece.
import { formatCOP, formatDateTime } from '../../utils/format.js';

const PROPIEDADES = {
  codigo_unidad: { label: 'Nomenclatura', tipo: 'texto' },
  proyecto_inmobiliario: { label: 'Proyecto', tipo: 'texto' },
  torre: { label: 'Torre', tipo: 'texto' },
  piso: { label: 'Piso', tipo: 'texto' },
  property_type: { label: 'Categoría', tipo: 'texto' },
  tipo_de_apartamento: { label: 'Tipo de apartamento', tipo: 'texto' },
  unit_status: { label: 'Estado', tipo: 'texto' },
  view_type: { label: 'Tipo de vista', tipo: 'texto' },
  built_area_m2: { label: 'Área construida', tipo: 'area' },
  private_area_m2: { label: 'Área privada', tipo: 'area' },
  terrace_area_m2: { label: 'Área de terraza', tipo: 'area' },
  number_bedrooms: { label: 'Alcobas', tipo: 'texto' },
  number_bathrooms: { label: 'Baños', tipo: 'texto' },
  valor_unidad_comercial: { label: 'Valor comercial', tipo: 'moneda' },
  valor_m_comercial: { label: 'Valor comercial por m²', tipo: 'moneda' },
  bono: { label: 'Bono', tipo: 'moneda' },
  floor_plan_link: { label: 'Plano', tipo: 'url' },
};

// Metadatos internos de HubSpot que no se muestran en el detalle (pedido del
// Jefe Gabriel, 2026-10-01).
export const PROPIEDADES_OCULTAS = new Set(['hs_object_id', 'hs_createdate', 'hs_lastmodifieddate']);

export function toLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function etiquetaPropiedad(key) {
  return PROPIEDADES[key]?.label ?? toLabel(key);
}

export function esUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

// Texto mostrable de un valor crudo de HubSpot, o `null` si está vacío. Los
// checkboxes de HubSpot llegan como el string "true"/"false", no booleano.
export function formatearPropiedad(key, value) {
  if (value == null || value === '') return null;
  if (value === 'true') return 'Sí';
  if (value === 'false') return 'No';
  const tipo = PROPIEDADES[key]?.tipo;
  if (tipo === 'moneda') return formatCOP(value);
  if (tipo === 'fecha') return formatDateTime(value);
  if (tipo === 'area') {
    const n = Number(value);
    return Number.isNaN(n) ? String(value) : `${n.toLocaleString('es-CO', { maximumFractionDigits: 2 })} m²`;
  }
  return String(value);
}
