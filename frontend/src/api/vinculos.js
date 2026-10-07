// Registros vinculados de una Oportunidad / Negocio / Inmueble (franja
// "Vinculados" de las pantallas de detalle). `proyecto`: 'baia' | 'oliv';
// `tipo`: 'oportunidad' | 'negocio' | 'inmueble'; `id` es el id de la URL de
// ese detalle (para Negocio, el id compuesto: inv-/neg- en Baía Kristal,
// inm-/op- en Oliv).
import client from './client';

export function getVinculos(proyecto, tipo, id) {
  return client.get(`/vinculos/${proyecto}/${tipo}/${encodeURIComponent(id)}`);
}
