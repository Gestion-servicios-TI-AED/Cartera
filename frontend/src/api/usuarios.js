// `getMe()` vive en api/auth.js (ya la usa AuthContext) -- no se duplica acá.
import client from './client';

export function listUsuarios() {
  return client.get('/usuarios');
}

export function createUsuario(data) {
  return client.post('/usuarios', data);
}

export function getUsuario(id) {
  return client.get(`/usuarios/${id}`);
}

export function updateUsuario(id, data) {
  return client.put(`/usuarios/${id}`, data);
}

// Soft delete (activo:false) -- nunca elimina fisicamente, ver usuario.service.js#remove.
export function removeUsuario(id) {
  return client.delete(`/usuarios/${id}`);
}

// Eliminacion fisica real -- solo permitida si el usuario ya esta
// desactivado (activo:false). Irreversible, ver usuario.service.js#removeDefinitivo.
export function removeUsuarioDefinitivo(id) {
  return client.delete(`/usuarios/${id}/definitivo`);
}

export function historialAuditoriaUsuarios() {
  return client.get('/usuarios/auditoria/historial');
}
