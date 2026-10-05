// Adaptado de Human-Resource-Management-System-AED/frontend/src/features/
// configuracion/RolesPage.jsx -- lista de roles dinámicos (ver
// ARQUITECTURA-FRONTEND.md, "Roles y permisos dinámicos"). A diferencia del
// HRMS (catálogo de permisos con nombre/descripción servido por el
// backend), acá el catálogo de módulos ya vive completo en el frontend
// (config/modulosPorProyecto.js, mismas claves que MODULOS_VALIDOS del
// backend) -- no hace falta pedir GET /roles/funcionalidades-disponibles
// solo para mostrar etiquetas.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { listRoles } from '../../api/roles.js';
import { MODULOS_POR_PROYECTO } from '../../config/modulosPorProyecto.js';
import { AccesosLayout } from '../../components/layout/AccesosLayout.jsx';
import styles from './Roles.module.css';

const ETIQUETAS_MODULO = Object.fromEntries(
  MODULOS_POR_PROYECTO.flatMap(({ items }) => items.map((item) => [item.key, item.label]))
);

export function RolesPage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    listRoles()
      .then((res) => setRoles(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <AccesosLayout>
        <div className={styles.header}>
          <div className={styles.headerRow}>
            <h1 className={styles.title}>Roles y permisos</h1>
            <div className={styles.headerActions}>
              <Button variant="primary" onClick={() => navigate('/accesos/roles/nuevo')}>Crear rol</Button>
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
                <th>Rol</th>
                <th>Permisos</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={2}>Cargando...</td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={2}>
                    <div className={styles.emptyState}>Todavía no hay roles creados.</div>
                  </td>
                </tr>
              ) : (
                roles.map((rol) => (
                  <tr key={rol.id} className={styles.clickableRow} onClick={() => navigate(`/accesos/roles/${rol.id}/editar`)}>
                    <td className={styles.nameText}>{rol.nombre}</td>
                    <td>
                      <div className={styles.permisosCell}>
                        {rol.nombre === 'ADMIN' ? (
                          <Badge variant="info">Acceso total</Badge>
                        ) : rol.permisos.length === 0 ? (
                          <span>—</span>
                        ) : (
                          rol.permisos.map((clave) => (
                            <Badge key={clave} variant="neutral">
                              {ETIQUETAS_MODULO[clave] ?? clave}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AccesosLayout>
    </div>
  );
}
