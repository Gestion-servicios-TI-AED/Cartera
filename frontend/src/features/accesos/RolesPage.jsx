import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { SortHeader } from '../../components/ui/SortHeader.jsx';
import { useSortableTable, ariaSort } from '../../hooks/useSortableTable.js';
import { listRoles } from '../../api/roles.js';
import { MODULOS_POR_PROYECTO } from '../../config/modulosPorProyecto.js';
import { AccesosLayout } from '../../components/layout/AccesosLayout.jsx';
import styles from './Roles.module.css';

const SORT_GETTERS = {
  nombre: (rol) => rol.nombre,
  usuarios: (rol) => rol.total_usuarios,
};

const MAX_MODULOS_VISIBLES = 4;

// "Proyecto · Módulo" para distinguir, por ejemplo, el Dashboard de Baía Kristal
// del de Oliv.
const ETIQUETAS_MODULO = Object.fromEntries(
  MODULOS_POR_PROYECTO.flatMap(({ proyecto, items }) => items.map((item) => [item.key, `${proyecto} · ${item.label}`]))
);

// Mismo diseño que la lista de roles del HRMS (migración de diseño
// 2026-10-05): una fila por rol con su tipo (sistema / personalizado), a qué
// módulos da acceso y cuántas cuentas lo tienen (enlaza a esas cuentas).
export function RolesPage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { sortedRows: sortedRoles, sort, toggleSort } = useSortableTable(roles, SORT_GETTERS);

  useEffect(() => {
    listRoles()
      .then((res) => setRoles(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <AccesosLayout className={styles.rolesLayout}>
        <div className={styles.header}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>Roles y permisos</h1>
              <p className={styles.subtitle}>Un rol define a qué módulos entra una cuenta. El rol de administrador es del sistema.</p>
            </div>
            <div className={styles.headerActions}>
              <Button variant="primary" onClick={() => navigate('/accesos/roles/nuevo')}>
                Crear rol
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className={styles.errorBanner} role="alert">
            No se pudo completar la operación: {error}
          </div>
        )}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th aria-sort={ariaSort(sort, 'nombre')}>
                  <SortHeader label="Rol" sortKey="nombre" sort={sort} onSort={toggleSort} />
                </th>
                <th>Acceso</th>
                <th aria-sort={ariaSort(sort, 'usuarios')}>
                  <SortHeader label="Cuentas" sortKey="usuarios" sort={sort} onSort={toggleSort} />
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className={styles.emptyState}>
                    Cargando...
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={3} className={styles.emptyState}>
                    Todavía no hay roles creados.
                  </td>
                </tr>
              ) : (
                sortedRoles.map((rol) => {
                  const visibles = rol.permisos.slice(0, MAX_MODULOS_VISIBLES);
                  return (
                    <tr key={rol.id} className={styles.clickableRow} onClick={() => navigate(`/accesos/roles/${rol.id}/editar`)}>
                      <td>
                        <div className={styles.rolCell}>
                          <span className={styles.rolIcon}>
                            <ShieldCheck size={18} strokeWidth={1.75} aria-hidden="true" />
                          </span>
                          <span className={styles.rolTexto}>
                            <span className={styles.nameText}>{rol.nombre}</span>
                            <span className={styles.rolTipo}>{rol.es_admin ? 'Rol del sistema' : 'Personalizado'}</span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.permisosCell}>
                          {rol.es_admin ? (
                            <Badge variant="info">Acceso total</Badge>
                          ) : rol.permisos.length === 0 ? (
                            <span className={styles.muted}>Sin módulos</span>
                          ) : (
                            <>
                              {visibles.map((clave) => (
                                <Badge key={clave} variant="neutral">
                                  {ETIQUETAS_MODULO[clave] ?? clave}
                                </Badge>
                              ))}
                              {rol.permisos.length > visibles.length && <Badge variant="info">+{rol.permisos.length - visibles.length}</Badge>}
                            </>
                          )}
                        </div>
                      </td>
                      <td onClick={(event) => event.stopPropagation()}>
                        {rol.total_usuarios > 0 ? (
                          <Link to={`/accesos/usuarios?rol=${encodeURIComponent(rol.nombre)}`} className={styles.cuentasLink}>
                            {rol.total_usuarios}
                          </Link>
                        ) : (
                          <span className={styles.muted}>0</span>
                        )}
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
