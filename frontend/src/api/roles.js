import client from './client';

export function listRoles() {
  return client.get('/roles');
}

export function listFuncionalidadesDisponibles() {
  return client.get('/roles/funcionalidades-disponibles');
}

export function createRol(data) {
  return client.post('/roles', data);
}

export function updateRol(id, data) {
  return client.put(`/roles/${id}`, data);
}
