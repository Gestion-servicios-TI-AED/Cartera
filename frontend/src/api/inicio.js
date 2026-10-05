import client from './client';

// Inicio: KPIs y alertas por proyecto, ya filtrados por los permisos del usuario.
export function getInicio() {
  return client.get('/inicio');
}
