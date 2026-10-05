// Mismo diseño que el menú de Configuración del HRMS (migración de diseño
// 2026-10-05): nav vertical a la izquierda con secciones agrupadas (título +
// icono + texto de ayuda), siempre visible -- "dónde estoy" nunca se pierde.
// Accesos es una ruta normal, nunca un drawer/panel flotante. Cada pantalla de
// Accesos se envuelve en este layout por separado.
import { NavLink, useLocation } from 'react-router-dom';
import { CalendarClock, Database, History, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { tienePermiso } from '../../utils/permisos.js';
import layoutStyles from './WizardLayout.module.css';
import styles from './AccesosLayout.module.css';

// Usuarios/Historial/Roles: gateadas por modulo granular
// ('accesos-usuarios'/'accesos-roles') -- una cuenta a la que se le dio solo uno
// de los dos no debe ver un link al otro que igual la rebotaria via
// ProtectedRoute. Fechas de entrega y Sincronizacion siguen 100% esAdmin.
export const ACCESOS_GRUPOS = [
  {
    titulo: 'Accesos',
    secciones: [
      { key: 'usuarios', label: 'Usuarios', hint: 'Cuentas y roles', to: '/accesos/usuarios', permiso: 'accesos-usuarios', icon: Users },
      { key: 'roles', label: 'Roles', hint: 'Permisos por módulo', to: '/accesos/roles', permiso: 'accesos-roles', icon: ShieldCheck },
      { key: 'historial', label: 'Historial', hint: 'Cambios en las cuentas', to: '/accesos/usuarios/historial', permiso: 'accesos-usuarios', icon: History },
    ],
  },
  {
    titulo: 'Sistema',
    secciones: [
      { key: 'frentes', label: 'Fechas de entrega', hint: 'Por frente, torre y piso', to: '/accesos/frentes', soloAdmin: true, icon: CalendarClock },
      { key: 'sincronizacion', label: 'Sincronización', hint: 'Zoho y HubSpot', to: '/accesos/sincronizacion', soloAdmin: true, icon: Database },
    ],
  },
];

export const ACCESOS_SECTIONS = ACCESOS_GRUPOS.flatMap((grupo) => grupo.secciones);

export function AccesosLayout({ children, className = '' }) {
  const { usuario } = useAuth();
  const { pathname } = useLocation();
  const visible = (section) => {
    if (section.soloAdmin) return usuario?.esAdmin;
    if (section.permiso) return tienePermiso(usuario?.roles, section.permiso, usuario?.permisosPorRol, usuario?.esAdmin);
    return true;
  };
  const gruposVisibles = ACCESOS_GRUPOS.map((grupo) => ({ ...grupo, secciones: grupo.secciones.filter(visible) })).filter((grupo) => grupo.secciones.length > 0);

  return (
    <div className={`${styles.body} ${className}`}>
      <nav className={styles.nav} aria-label="Secciones de Configuración">
        <p className={styles.navHeading}>Configuración</p>
        {gruposVisibles.map((grupo) => (
          <div key={grupo.titulo} className={styles.navGroup}>
            <span className={styles.navGroupTitle}>{grupo.titulo}</span>
            {grupo.secciones.map((section) => {
              const Icono = section.icon;
              return (
                <NavLink
                  key={section.key}
                  to={section.to}
                  // Historial vive bajo /accesos/usuarios/historial: Usuarios no debe
                  // marcarse activo ahi (match por prefijo de NavLink).
                  className={({ isActive }) => {
                    const activo = section.key === 'usuarios' ? isActive && !pathname.endsWith('/historial') : isActive;
                    return `${styles.navLink} ${activo ? styles.navLinkActive : ''}`;
                  }}
                >
                  <span className={styles.navIcon}>
                    <Icono size={17} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className={styles.navText}>
                    <span className={styles.navLabel}>{section.label}</span>
                    <span className={styles.navHint}>{section.hint}</span>
                  </span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={`${layoutStyles.content} ${styles.content}`}>
        <div className={styles.contentInner}>{children}</div>
      </div>
    </div>
  );
}
