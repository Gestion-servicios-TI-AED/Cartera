// Historial de cambios de administración sobre las cuentas. Backend:
// GET /usuarios/auditoria/historial (últimos 100). Mismo diseño que la lista de
// usuarios del HRMS (migración de diseño 2026-10-05): tabla en tarjeta, con la
// persona (avatar + nombre) y la acción como etiqueta.
//
// El vocabulario de `accion` es simple a propósito -- AuditoriaUsuario registra
// 3 acciones ('crear'/'editar'/'desactivar', ver usuario.service.js). El detalle
// de QUÉ cambió en un 'editar' vive en el JSONB `detalle` (roles
// antes/después, passwordReseteada, activo) -- describirCambios() lo traduce.
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../components/ui/Badge.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { AccesosLayout } from '../../components/layout/AccesosLayout.jsx';
import { historialAuditoriaUsuarios } from '../../api/usuarios.js';
import { formatDateTime } from '../../utils/format.js';
import { iniciales } from './usuarioUtils.js';
import styles from './Usuarios.module.css';

const PAGE_SIZE = 20;

const ACCION_BADGE = { crear: ['success', 'Creación'], editar: ['info', 'Edición'], desactivar: ['neutral', 'Desactivación'], eliminar_definitivo: ['danger', 'Eliminación'] };

function describirCambios(r) {
  const detalle = r.detalle;
  if (r.accion === 'crear') return `Creó la cuenta${detalle?.roles?.includes('ADMIN') ? ' (como administrador)' : ''}`;
  if (r.accion === 'desactivar') return 'Desactivó la cuenta';
  if (r.accion === 'eliminar_definitivo') return 'Eliminó la cuenta de forma permanente';
  if (r.accion === 'editar') {
    const partes = [];
    if (detalle?.roles) partes.push(`Actualizó los roles (${detalle.roles.despues.join(', ') || 'ninguno'})`);
    if (detalle?.passwordReseteada) partes.push('Restableció la contraseña');
    if (detalle?.activo === true) partes.push('Reactivó la cuenta');
    if (detalle?.activo === false) partes.push('Desactivó la cuenta');
    return partes.length ? partes.join(' · ') : 'Actualizó la cuenta';
  }
  return r.accion;
}

function Persona({ persona, conCorreo = true }) {
  const nombre = persona?.nombre ?? '—';
  return (
    <div className={styles.personaCell}>
      <span className={styles.avatar}>{iniciales(nombre === '—' ? '' : nombre)}</span>
      <span className={styles.personaTexto} style={{ minWidth: 0 }}>
        <span className={styles.personaNombre}>{nombre}</span>
        {conCorreo && <span className={styles.personaDoc}>{persona?.email ?? ''}</span>}
      </span>
    </div>
  );
}

export function HistorialPage() {
  const [registros, setRegistros] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    historialAuditoriaUsuarios().then((res) => setRegistros(res.data)).catch((err) => setError(err.message));
  }, []);

  const visibles = useMemo(() => (registros ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [registros, page]);

  return (
    <div className={styles.page}>
      <AccesosLayout>
        <div className={styles.listHeader}>
          <div>
            <h1 className={styles.title}>Historial</h1>
            <p className={styles.subtitle}>Últimos 100 cambios de administración sobre las cuentas de usuario.</p>
          </div>
        </div>

        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hecho por</th>
                <th>Acción</th>
                <th>Cuenta afectada</th>
              </tr>
            </thead>
            <tbody>
              {!registros ? (
                <tr>
                  <td colSpan={4} className={styles.emptyState}>
                    Cargando...
                  </td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyState}>
                    Sin cambios registrados todavía.
                  </td>
                </tr>
              ) : (
                visibles.map((r) => {
                  const [variant, etiqueta] = ACCION_BADGE[r.accion] ?? ['neutral', r.accion];
                  return (
                    <tr key={r.id}>
                      <td className={styles.dateCell}>{formatDateTime(r.creado_en)}</td>
                      <td>
                        <Persona persona={r.actor} conCorreo={false} />
                      </td>
                      <td>
                        <div className={styles.rolesCell}>
                          <Badge variant={variant}>{etiqueta}</Badge>
                        </div>
                        <span className={styles.primerIngreso} style={{ color: 'var(--color-ink-muted)' }}>
                          {describirCambios(r)}
                        </span>
                      </td>
                      <td>
                        <Persona persona={r.usuario} conCorreo={false} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {registros && registros.length > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={registros.length} onPageChange={setPage} />}
        </div>
      </AccesosLayout>
    </div>
  );
}
