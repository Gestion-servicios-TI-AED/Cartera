// Puerto de zoho-payment-tracker/frontend/src/pages/Ajustes.jsx -- sección
// "Usuarios" (AuditoriaCard). Backend: GET /usuarios/auditoria/historial.
//
// El vocabulario de `accion` acá es MÁS SIMPLE que el del legado a propósito
// -- Cartera's AuditoriaUsuario registra 3 acciones ('crear'/'editar'/
// 'desactivar', ver usuario.service.js), no las 7 del legado ('crear',
// 'activar', 'desactivar', 'admin-on', 'admin-off', 'reset-password',
// 'modulos'). El detalle de QUÉ cambió en un 'editar' vive en el JSONB
// `detalle` (roles antes/después, passwordReseteada, activo) --
// describirCambios() de acá abajo es una adaptación a esa forma real de los
// datos, no una copia literal del switch del legado.
import { useEffect, useState } from 'react';
import { AccesosLayout } from '../../components/layout/AccesosLayout.jsx';
import { historialAuditoriaUsuarios } from '../../api/usuarios.js';
import { formatDateTime } from '../../utils/format.js';
import styles from './Accesos.module.css';

function describirCambios(r) {
  const detalle = r.detalle;
  if (r.accion === 'crear') return `creó la cuenta${detalle?.roles?.includes('ADMIN') ? ' (como administrador)' : ''}`;
  if (r.accion === 'desactivar') return 'la desactivó';
  if (r.accion === 'editar') {
    const partes = [];
    if (detalle?.roles) partes.push(`actualizó los roles (${detalle.roles.despues.join(', ') || 'ninguno'})`);
    if (detalle?.passwordReseteada) partes.push('le restableció la contraseña');
    if (detalle?.activo === true) partes.push('la reactivó');
    if (detalle?.activo === false) partes.push('la desactivó');
    return partes.length ? partes.join(' · ') : 'actualizó la cuenta';
  }
  return r.accion;
}

export function HistorialPage() {
  const [registros, setRegistros] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    historialAuditoriaUsuarios().then((res) => setRegistros(res.data)).catch((err) => setError(err.message));
  }, []);

  return (
    <div className={styles.page}>
      <AccesosLayout>
        <div className={styles.header}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>Historial de cambios</h1>
              <p className={styles.subtitle}>Últimos 100 cambios de administración sobre usuarios.</p>
            </div>
          </div>
        </div>

        {error && <div className={styles.formError}>{error}</div>}

        <div className={styles.card}>
          {!registros ? (
            <p className={styles.loadingState}>Cargando…</p>
          ) : registros.length === 0 ? (
            <p className={styles.emptyState}>Sin cambios registrados todavía.</p>
          ) : (
            <div className={styles.list}>
              {registros.map((r) => (
                <div key={r.id} className={styles.listRow}>
                  <div className={styles.listRowMain}>
                    <p className={styles.listRowTitle}>
                      <span>{r.actor?.nombre ?? 'Alguien'}</span> {describirCambios(r)} de <span>{r.usuario?.nombre ?? '—'}</span>
                    </p>
                    <p className={styles.listRowMeta}>{formatDateTime(r.creado_en)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AccesosLayout>
    </div>
  );
}
