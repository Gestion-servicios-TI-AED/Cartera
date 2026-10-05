// Portado tal cual de zoho-payment-tracker/frontend/src/utils/proyectos.js.
// Mapa de códigos de proyecto (extraídos del nombre del archivo Excel) a sus
// datos descriptivos: etapa (si aplica) y las torres/proyectos que agrupa.
const CODIGO_PROYECTO = {
  '99203': { etapa: '2', torres: 'KABO 3 Y 4 , PRIVE 1 Y 4' },
  '14607': { etapa: '1', torres: 'KABO 1 Y 2 , PRIVE 2 Y 3' },
  '16037': { etapa: '3', torres: 'KALA 1 Y 2 , KALIZA 1 Y 2' },
  '99289': { etapa: '4', torres: 'KALA 3 Y 4' },
  '99306': { etapa: '4', torres: 'KALIZA 3' },
  '16013': { etapa: null, torres: 'Vela Village' },
  '99331': { etapa: null, torres: 'Vela Village C2' },
  '99332': { etapa: null, torres: 'Vela Village C3' },
  '16994': { etapa: null, torres: 'The Plaza' },
  '17664': { etapa: null, torres: 'Isla Laguna' },
};

// Dado un código (string o number), devuelve { etapa, torres } o null.
export function obtenerProyecto(codigo) {
  if (codigo == null) return null;
  const key = String(codigo).trim();
  return CODIGO_PROYECTO[key] ?? null;
}

export function descripcionProyecto(codigo) {
  const info = obtenerProyecto(codigo);
  if (!info) return null;
  return info.etapa ? `Etapa ${info.etapa} : ${info.torres}` : info.torres;
}

// Separa el campo "Piso" de la sección de inmueble de Zoho
// ("Kabo - Torre 4 - Piso 1") en { torre: "Kabo 4", piso: "1" }.
export function desglosarPiso(pisoRaw) {
  if (!pisoRaw) return null;
  const m = String(pisoRaw).match(/^(.+?)\s*-\s*Torre\s*(\S+)\s*-\s*Piso\s*(.+)$/i);
  if (!m) return null;
  return { torre: `${m[1].trim()} ${m[2].trim()}`, piso: m[3].trim() };
}
