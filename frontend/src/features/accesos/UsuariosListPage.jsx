// Adaptado 1:1 de Human-Resource-Management-System-AED/frontend/src/features/
// usuarios/UsuariosListPage.jsx -- misma estructura/CSS exacta (tabla con
// avatar, RowIconButtons.jsx, búsqueda, skeleton, empty state).
// Único cambio real es de DATOS: el HRMS vincula un usuario a un `empleado`
// (rol rrhh/empleado); Cartera no tiene ese concepto -- acá la columna
// "Acceso" muestra Admin o la cantidad de módulos permitidos en su lugar
// (ver usuario.model.js del backend).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { EditIconButton, ToggleActivoIconButton } from '../../components/ui/RowIconButtons.jsx';
import { SortHeader } from '../../components/ui/SortHeader.jsx';
import { useSortableTable, ariaSort } from '../../hooks/useSortableTable.js';
import { usePersistentState } from '../../hooks/usePersistentState.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { listUsuarios, updateUsuario, removeUsuario } from '../../api/usuarios.js';
import { AccesosLayout } from '../../components/layout/AccesosLayout.jsx';
import styles from './Usuarios.module.css';

function initials(nombre) {
  return (nombre ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}

export function UsuariosListPage() {
  const navigate = useNavigate();
  const { usuario: usuarioActual } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [busqueda, setBusqueda] = usePersistentState('usuarios-list:busqueda', '');

  const fetchUsuarios = useCallback(() => {
    setLoading(true);
    setError(null);
    listUsuarios()
      .then((res) => setUsuarios(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(fetchUsuarios, [fetchUsuarios]);

  const usuariosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) => u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [usuarios, busqueda]);

  const valueGetters = useMemo(
    () => ({
      nombre: (u) => u.nombre,
      email: (u) => u.email,
      acceso: (u) => (u.roles.includes('ADMIN') ? -1 : u.roles.length),
      estado: (u) => (u.activo ? 0 : 1),
    }),
    []
  );
  const { sortedRows, sort, toggleSort } = useSortableTable(usuariosFiltrados, valueGetters);

  async function handleToggleEstado(usuarioFila) {
    setTogglingId(usuarioFila.id);
    setError(null);
    try {
      if (usuarioFila.activo) await removeUsuario(usuarioFila.id);
      else await updateUsuario(usuarioFila.id, { activo: true });
      fetchUsuarios();
    } catch (err) {
      setError(err.message);
    } finally {
      setTogglingId(null);
    }
  }

  const hayFiltro = busqueda.trim().length > 0;

  return (
    <div className={styles.page}>
      <AccesosLayout>
        <div className={styles.header}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>Usuarios</h1>
              <p className={styles.subtitle}>{loading ? 'Cargando...' : `${usuarios.length} ${usuarios.length === 1 ? 'cuenta' : 'cuentas'} de acceso`}</p>
            </div>
            <div className={styles.headerActions}>
              <Button variant="primary" onClick={() => navigate('/accesos/usuarios/nuevo')}>Crear usuario</Button>
            </div>
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.4" />
              <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Buscar por nombre o email..."
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              aria-label="Buscar usuarios"
            />
          </div>
        </div>

        {error && (
          <div className={styles.errorBanner} role="alert">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8 5V8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="8" cy="11" r="0.75" fill="currentColor" />
            </svg>
            No se pudo completar la operación: {error}
          </div>
        )}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th aria-sort={ariaSort(sort, 'nombre')}><SortHeader label="Nombre" sortKey="nombre" sort={sort} onSort={toggleSort} /></th>
                <th aria-sort={ariaSort(sort, 'email')}><SortHeader label="Email" sortKey="email" sort={sort} onSort={toggleSort} /></th>
                <th aria-sort={ariaSort(sort, 'acceso')}><SortHeader label="Acceso" sortKey="acceso" sort={sort} onSort={toggleSort} /></th>
                <th aria-sort={ariaSort(sort, 'estado')}><SortHeader label="Estado" sortKey="estado" sort={sort} onSort={toggleSort} /></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className={styles.skeletonRow}>
                    {Array.from({ length: 6 }).map((__, col) => (
                      <td key={col}><div className={styles.skeletonBar} style={{ width: col === 0 ? 32 : '100%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.emptyState}>
                      <svg className={styles.emptyIcon} width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                        <circle cx="20" cy="14" r="6" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M8 34c0-6.6 5.4-12 12-12s12 5.4 12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                      <span className={styles.emptyTitle}>{hayFiltro ? 'Sin resultados' : 'Todavía no hay usuarios'}</span>
                      <span>{hayFiltro ? 'Ningún usuario coincide con la búsqueda.' : 'Crea el primer usuario para dar acceso al sistema.'}</span>
                      {!hayFiltro && <Button variant="secondary" onClick={() => navigate('/accesos/usuarios/nuevo')}>Crear usuario</Button>}
                    </div>
                  </td>
                </tr>
              ) : (
                sortedRows.map((usuarioFila) => {
                  const esUsuarioActual = usuarioActual?.id === usuarioFila.id;
                  return (
                    <tr key={usuarioFila.id} className={styles.clickableRow} onClick={() => navigate(`/accesos/usuarios/${usuarioFila.id}/editar`)}>
                      <td><div className={styles.avatar}>{initials(usuarioFila.nombre)}</div></td>
                      <td><div className={styles.nameCell}><span className={styles.nameText}>{usuarioFila.nombre}</span></div></td>
                      <td>{usuarioFila.email}</td>
                      <td>{usuarioFila.roles.join(', ') || '—'}</td>
                      <td>
                        <Badge variant={usuarioFila.activo ? 'success' : 'neutral'} dot={usuarioFila.activo}>
                          {usuarioFila.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td>
                        <div className={styles.actionsCell}>
                          <EditIconButton
                            label={`Editar ${usuarioFila.nombre}`}
                            onClick={(event) => { event.stopPropagation(); navigate(`/accesos/usuarios/${usuarioFila.id}/editar`); }}
                          />
                          <ToggleActivoIconButton
                            activo={usuarioFila.activo}
                            labelActivar={`Activar ${usuarioFila.nombre}`}
                            labelInactivar={`Desactivar ${usuarioFila.nombre}`}
                            disabled={togglingId === usuarioFila.id || (esUsuarioActual && usuarioFila.activo)}
                            title={esUsuarioActual && usuarioFila.activo ? 'No puedes desactivarte a ti mismo' : undefined}
                            onClick={(event) => { event.stopPropagation(); handleToggleEstado(usuarioFila); }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </AccesosLayout>
    </div>
  );
}
