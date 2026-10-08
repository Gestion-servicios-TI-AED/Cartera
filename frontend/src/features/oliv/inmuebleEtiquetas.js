// Etiquetas en español de las propiedades del objeto "Unidades" de HubSpot
// (`OlivInmueble.propiedades`) -- HubSpot las devuelve con su nombre interno
// en inglés/snake_case, que antes se mostraba tal cual ("Built Area M2",
// "Unit Status"). Pedido del Jefe Gabriel (2026-10-01): "traduce el detalle
// a todo a español". Cualquier propiedad nueva que aparezca sin etiqueta aquí
// cae a `toLabel()` (snake_case -> Título), así que nada desaparece.
// Ahora también agrupadas por secciones lógicas para el detalle.
import { formatCOP, formatDateTime } from '../../utils/format.js';

const PROPIEDADES = {
  codigo_unidad: { label: 'Nomenclatura', tipo: 'texto', grupo: 'identificacion' },
  proyecto_inmobiliario: { label: 'Proyecto', tipo: 'texto', grupo: 'identificacion' },
  torre: { label: 'Torre', tipo: 'texto', grupo: 'identificacion' },
  piso: { label: 'Piso', tipo: 'texto', grupo: 'identificacion' },
  property_type: { label: 'Categoría', tipo: 'texto', grupo: 'identificacion' },
  tipo_de_apartamento: { label: 'Tipo de apartamento', tipo: 'texto', grupo: 'identificacion' },
  unit_status: { label: 'Estado', tipo: 'texto', grupo: 'estado' },
  view_type: { label: 'Tipo de vista', tipo: 'texto', grupo: 'caracteristicas' },
  built_area_m2: { label: 'Área construida', tipo: 'area', grupo: 'areas' },
  private_area_m2: { label: 'Área privada', tipo: 'area', grupo: 'areas' },
  terrace_area_m2: { label: 'Área de terraza', tipo: 'area', grupo: 'areas' },
  number_bedrooms: { label: 'Alcobas', tipo: 'texto', grupo: 'caracteristicas' },
  number_bathrooms: { label: 'Baños', tipo: 'texto', grupo: 'caracteristicas' },
  valor_unidad_comercial: { label: 'Valor comercial', tipo: 'moneda', grupo: 'financiero' },
  valor_m_comercial: { label: 'Valor comercial por m²', tipo: 'moneda', grupo: 'financiero' },
  bono: { label: 'Bono', tipo: 'moneda', grupo: 'financiero' },
  floor_plan_link: { label: 'Plano', tipo: 'url', grupo: 'documentos' },
};

// Metadatos internos de HubSpot que no se muestran en el detalle (pedido del
// Jefe Gabriel, 2026-10-01).
export const PROPIEDADES_OCULTAS = new Set(['hs_object_id', 'hs_createdate', 'hs_lastmodifieddate']);

// Orden de grupos para el detalle
export const GRUPOS_ORDEN = ['identificacion', 'estado', 'areas', 'caracteristicas', 'financiero', 'documentos', 'otros'];

// Títulos legibles para cada grupo
export const GRUPOS_TITULOS = {
  identificacion: 'Identificación',
  estado: 'Estado',
  areas: 'Áreas y dimensiones',
  caracteristicas: 'Características',
  financiero: 'Información financiera',
  documentos: 'Documentos y planos',
  otros: 'Otros',
};

export function toLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function etiquetaPropiedad(key) {
  return PROPIEDADES[key]?.label ?? toLabel(key);
}

// Obtener el grupo de una propiedad
export function obtenerGrupoPropiedad(key) {
  return PROPIEDADES[key]?.grupo ?? 'otros';
}

// Agrupar propiedades por grupo
export function agruparPropiedades(entries) {
  const grupos = {};
  GRUPOS_ORDEN.forEach((g) => (grupos[g] = []));

  entries.forEach(([key, value]) => {
    const grupo = obtenerGrupoPropiedad(key);
    if (grupos[grupo]) {
      grupos[grupo].push([key, value]);
    } else {
      grupos['otros'].push([key, value]);
    }
  });

  // Retornar solo grupos con items y su orden
  const gruposConItems = GRUPOS_ORDEN.filter((g) => grupos[g] && grupos[g].length > 0);
  return { grupos, gruposOrden: gruposConItems };
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
