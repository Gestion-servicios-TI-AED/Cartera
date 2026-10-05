import client from './client';

function toQuery(params) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, value);
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export function listInventario(params) {
  return client.get(`/inventario${toQuery(params)}`);
}

export function getInventarioItem(id) {
  return client.get(`/inventario/${id}`);
}

export function iniciarSyncInventario() {
  return client.post('/inventario/sync');
}

export function getSyncStatusInventario() {
  return client.get('/inventario/sync/status');
}

export function verificarProjectCode() {
  return client.get('/inventario/verificar-project-code');
}
