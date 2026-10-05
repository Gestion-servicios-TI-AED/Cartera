// Copiado 1:1 de Human-Resource-Management-System-AED/frontend/src/features/
// configuracion/AccesosLayout.jsx -- mismo patrón visual que el perfil de
// un registro con Section Navigation en cualquier proyecto de la familia
// aed: nav vertical fijo a la izquierda del contenido, "dónde estoy" siempre
// visible. Decisión explícita (ver esa misma fecha en el HRMS, 2026-08-28):
// Accesos es una ruta normal, nunca un drawer/panel flotante detrás de un
// engranaje -- se probó esa versión primero y se descartó por no sentirse
// como una parte normal de la app.
//
// A diferencia del HRMS (que reusa `WizardLayout.module.css`, compartido con
// el perfil del empleado -- un concepto que no existe en Cartera), acá las
// mismas clases (`.body`/`.nav`/`.navItem`/`.navItemActive`/`.content`) viven
// directo en `AccesosLayout.module.css`: mismo resultado visual, sin
// inventar un WizardLayout que no le sirve a ningún otro flujo de este
// proyecto. Cada pantalla real de Accesos se envuelve en este layout por
// separado -- no hay una sola página contenedora de todas las secciones a
// la vez.
import { NavLink } from 'react-router-dom';
import { Badge } from '../ui/Badge.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import { tienePermiso } from '../../utils/permisos.js';
import styles from './AccesosLayout.module.css';

// Usuarios/Historial/Roles: gateadas por modulo granular
// ('accesos-usuarios'/'accesos-roles', puerto de HRMS, 2026-09-18) -- una
// cuenta a la que se le dio solo uno de los dos no debe ver un link al otro
// que igual la rebotaria via ProtectedRoute. Frentes/Sincronizacion no se
// pidio desglosarlas, siguen 100% esAdmin.
export const ACCESOS_SECTIONS = [
  { key: 'usuarios', label: 'Usuarios y permisos', to: '/accesos/usuarios', permiso: 'accesos-usuarios' },
  { key: 'roles', label: 'Roles y permisos', to: '/accesos/roles', permiso: 'accesos-roles' },
  { key: 'historial', label: 'Historial de cambios', to: '/accesos/usuarios/historial', permiso: 'accesos-usuarios' },
  { key: 'frentes', label: 'Fechas de entrega', to: '/accesos/frentes', soloAdmin: true },
  { key: 'sincronizacion', label: 'Sincronización de datos', to: '/accesos/sincronizacion', soloAdmin: true },
];

export function AccesosLayout({ children }) {
  const { usuario } = useAuth();
  const secciones = ACCESOS_SECTIONS.filter((section) => {
    if (section.soloAdmin) return usuario?.esAdmin;
    if (section.permiso) return tienePermiso(usuario?.roles, section.permiso, usuario?.permisosPorRol, usuario?.esAdmin);
    return true;
  });

  return (
    <div className={styles.body}>
      <nav className={styles.nav} aria-label="Secciones de Accesos">
        {secciones.map((section) =>
          section.enDesarrollo ? (
            <span key={section.key} className={styles.navItemDisabled} aria-disabled="true">
              {section.label}
              <Badge variant="neutral">En desarrollo</Badge>
            </span>
          ) : (
            <NavLink key={section.key} to={section.to} className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
              {section.label}
            </NavLink>
          )
        )}
      </nav>

      <div className={styles.content}>
        <div className={styles.contentInner}>{children}</div>
      </div>
    </div>
  );
}
