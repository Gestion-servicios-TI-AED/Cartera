import client from './client';

export function listConfiguracionesFrente() {
  return client.get('/configuraciones/frentes');
}

export function actualizarFechaProyecto(frente, fechaEntrega) {
  return client.put(`/configuraciones/frentes/${encodeURIComponent(frente)}`, { fechaEntrega });
}

export function actualizarFechaTorre(frente, torre, fechaEntrega) {
  return client.put(`/configuraciones/frentes/${encodeURIComponent(frente)}/torres/${encodeURIComponent(torre)}`, { fechaEntrega });
}

export function actualizarFechaPiso(frente, torre, piso, fechaEntrega) {
  return client.put(
    `/configuraciones/frentes/${encodeURIComponent(frente)}/torres/${encodeURIComponent(torre)}/pisos/${encodeURIComponent(piso)}`,
    { fechaEntrega }
  );
}
