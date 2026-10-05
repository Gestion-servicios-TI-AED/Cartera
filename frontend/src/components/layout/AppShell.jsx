// Sidebar y topbar con el mismo diseño que el HRMS (migración de diseño
// 2026-10-05): riel de categorías con flyout, entrada fija "Inicio", migas de
// pan (grupo > pantalla) y divisor antes del menú de usuario. Lo propio de
// Cartera es NAV_GROUPS (módulos de Baía Kristal y Oliv), el nombre de marca y
// la resolución del item activo por la ruta más específica.
import { Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ReactLenis } from 'lenis/react';
import { ChevronRight, Building2, Home, Layers, Settings } from 'lucide-react';
import { UserMenu } from './UserMenu.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import { tienePermiso } from '../../utils/permisos.js';
import styles from './AppShell.module.css';

const ICON_SIZE = 16;
const ICON_STROKE_WIDTH = 1.75;

function IconInicio() {
  return <Home size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden="true" />;
}

function IconBaiaKristal() {
  return <Building2 size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden="true" />;
}

function IconOliv() {
  return <Layers size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} aria-hidden="true" />;
}

// Baía Kristal: los 8 módulos que hoy tiene
// zoho-payment-tracker/frontend/src/config/navItems.js (NAV_ITEMS_BAIA_KRISTAL),
// acá agrupados como categoría del sidebar en vez de una lista plana, más
// Otrosíes (solo lectura, módulo nuevo sin equivalente en el legado, ver
// features/otrosies/OtrosiesPage.jsx). Cada
// item real lleva su propio `permiso` (misma clave que MODULOS_VALIDOS del
// backend) -- ver "Roles y permisos dinámicos" en ARQUITECTURA-FRONTEND.md:
// un item sin `permiso` nunca se oculta por rol.
//
// Oliv (proyecto nuevo, CRM HubSpot, ver utils/hubspotClient.js del backend)
// reemplaza a Alegra -- que arrancó con los 8 módulos de Baía Kristal
// declarados de una (todos `enDesarrollo`) y nunca llegó a tener ninguno
// real. Con Oliv se agrega un item solo cuando el módulo correspondiente ya
// existe de verdad -- Oportunidades es el primero.
const NAV_GROUPS = [
  {
    title: 'Baía Kristal',
    icon: IconBaiaKristal,
    items: [
      { label: 'Oportunidades', to: '/oportunidades', permiso: 'oportunidades' },
      { label: 'Negocios', to: '/negocios', permiso: 'negocios' },
      { label: 'Inmuebles', to: '/inventario', permiso: 'inventario' },
      { label: 'Encargos', to: '/fiducia', permiso: 'encargos' },
      { label: 'Movimientos', to: '/fiducia/movimientos', permiso: 'movimientos' },
      { label: 'Resumen', to: '/resumen', permiso: 'resumen' },
      { label: 'Dashboard', to: '/dashboard', permiso: 'dashboard' },
      { label: 'Cartera', to: '/cartera-mora', permiso: 'cartera-mora' },
      { label: 'Otrosíes', to: '/otrosies', permiso: 'otrosies' },
    ],
  },
  {
    title: 'Oliv',
    icon: IconOliv,
    items: [
      { label: 'Oportunidades', to: '/oliv/oportunidades', permiso: 'oliv-oportunidades' },
      { label: 'Negocios', to: '/oliv/negocios', permiso: 'oliv-negocios' },
      { label: 'Inmuebles', to: '/oliv/inmuebles', permiso: 'oliv-inmuebles' },
      { label: 'Encargos', to: '/oliv/encargos', permiso: 'oliv-encargos' },
      { label: 'Movimientos', to: '/oliv/encargos/movimientos', permiso: 'oliv-movimientos' },
      { label: 'Resumen', to: '/oliv/resumen', permiso: 'oliv-resumen' },
      { label: 'Dashboard', to: '/oliv/dashboard', permiso: 'oliv-dashboard' },
      { label: 'Cartera', to: '/oliv/cartera-mora', permiso: 'oliv-cartera-mora' },
    ],
  },
];

function ChevronIcon() {
  return <ChevronRight size={10} strokeWidth={ICON_STROKE_WIDTH} aria-hidden="true" className={styles.chevron} />;
}

// El `isActive` por defecto de NavLink marca como activa cualquier ruta cuyo
// pathname EMPIECE con su `to` -- con dos items hermanos donde uno es
// prefijo literal del otro en la URL (Encargos "/fiducia" y Movimientos
// "/fiducia/movimientos", no una relación padre/detalle) eso marca los DOS
// como activos a la vez (bug real reportado por el usuario). Se resuelve
// buscando, entre todos los items de todos los grupos cuyo `to` calce con el
// pathname actual, el de `to` más largo -- el más específico gana, así que
// en "/fiducia/movimientos" solo gana Movimientos, y en "/fiducia/abc123"
// (detalle de un encargo real) solo gana Encargos, porque Movimientos ya no
// calza ahí.
function encontrarItemActivo(pathname) {
  let mejor = null;
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (!item.to) continue;
      if (pathname === item.to || pathname.startsWith(`${item.to}/`)) {
        if (!mejor || item.to.length > mejor.item.to.length) mejor = { item, grupoTitulo: group.title };
      }
    }
  }
  return mejor;
}

export function AppShell() {
  const location = useLocation();
  const { usuario } = useAuth();
  const [openGroup, setOpenGroup] = useState(null);
  const navRef = useRef(null);
  const closeTimerRef = useRef(null);

  const itemActivo = encontrarItemActivo(location.pathname);
  const activeGroupTitle = itemActivo?.grupoTitulo;

  // Migas de pan del topbar (grupo > pantalla), derivadas del mismo NAV_GROUPS:
  // un item nuevo aparece solo.
  const path = location.pathname;
  let crumb = null;
  if (path === '/') {
    crumb = { group: null, label: 'Inicio' };
  } else if (itemActivo) {
    crumb = { group: itemActivo.grupoTitulo, label: itemActivo.item.label };
  } else if (path === '/accesos' || path.startsWith('/accesos/')) {
    crumb = { group: 'Configuración', label: 'Accesos y configuración' };
  }

  function scheduleClose() {
    closeTimerRef.current = setTimeout(() => setOpenGroup(null), 300);
  }

  function cancelScheduledClose() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function closeNow() {
    cancelScheduledClose();
    setOpenGroup(null);
  }

  function closeIfFocusLeftNav(event) {
    if (!navRef.current?.contains(event.relatedTarget)) {
      closeNow();
    }
  }

  useEffect(() => cancelScheduledClose, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <img className={styles.brandLogo} src="/aed-logo.png" alt="aed" />
          <span className={styles.brandDivider} aria-hidden="true" />
          <span className={styles.brandName}>Cartera</span>
        </div>
        <nav
          ref={navRef}
          className={styles.nav}
          aria-label="Navegacion principal"
          onMouseEnter={cancelScheduledClose}
          onMouseLeave={scheduleClose}
          onBlurCapture={closeIfFocusLeftNav}
        >
          <p className={styles.navSection}>Menú</p>
          {/* Inicio: entrada fija arriba de las categorías, navega directo
              (nunca abre flyout). `end` para que solo se marque activa en "/"
              exacto, nunca en cualquier otra ruta (todas empiezan con "/"). */}
          <NavLink
            to="/"
            end
            className={({ isActive }) => `${styles.navGroupButton} ${isActive ? styles.navGroupButtonActive : ''}`}
          >
            <span className={styles.navGroupLabel}>
              <IconInicio />
              Inicio
            </span>
          </NavLink>
          {NAV_GROUPS.map((group) => {
            // Bloqueo de modulos por rol -- un item sin `permiso` siempre se
            // muestra (enDesarrollo sigue siendo la unica razon para no
            // mostrarlo); un item CON `permiso` solo se muestra si el rol
            // del usuario lo otorga (o es ADMIN, que hace bypass). El grupo
            // entero se oculta si ningun item quedo visible.
            const itemsVisibles = group.items.filter(
              (item) => !item.permiso || tienePermiso(usuario?.roles, item.permiso, usuario?.permisosPorRol, usuario?.esAdmin)
            );
            if (itemsVisibles.length === 0) return null;

            const isOpen = openGroup === group.title;
            const isActiveGroup = activeGroupTitle === group.title;
            const GroupIcon = group.icon;
            return (
              <div key={group.title} className={styles.navGroupRow}>
                <button
                  type="button"
                  className={`${styles.navGroupButton} ${isActiveGroup ? styles.navGroupButtonActive : ''}`}
                  onMouseEnter={() => setOpenGroup(group.title)}
                  onFocus={() => setOpenGroup(group.title)}
                  onClick={() => setOpenGroup((current) => (current === group.title ? null : group.title))}
                  aria-expanded={isOpen}
                >
                  <span className={styles.navGroupLabel}>
                    <GroupIcon />
                    {group.title}
                  </span>
                  <ChevronIcon />
                </button>
                {isOpen && (
                  <div className={styles.flyout} role="menu">
                    {itemsVisibles.map((item) => (
                      <NavLink
                        key={item.label}
                        to={item.to}
                        role="menuitem"
                        onClick={closeNow}
                        className={() => `${styles.navItem} ${itemActivo?.item === item ? styles.navItemActive : ''}`}
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
      <main className={styles.main}>
        <div className={styles.topbar}>
          {crumb && (
            <nav className={styles.crumb} aria-label="Ubicación">
              {crumb.group && (
                <>
                  <span>{crumb.group}</span>
                  <ChevronRight size={14} strokeWidth={ICON_STROKE_WIDTH} aria-hidden="true" />
                </>
              )}
              <span className={styles.crumbCurrent}>{crumb.label}</span>
            </nav>
          )}
          {/* Accesos: ruta normal (igual que cualquier detalle con Section
              Navigation), no un panel flotante -- ver AccesosLayout.jsx
              (components/layout/), que dibuja el nav vertical dentro de
              /accesos/*. Este botón solo navega, no abre nada acá. Mismo
              trigger 1:1 que el HRMS (AppShell.jsx#topbarIconLink). Visible
              con 'accesos-usuarios' O 'accesos-roles' (o ADMIN, que ve
              además Frentes/Sincronización) -- ya no es esAdmin puro, puerto
              de HRMS 2026-09-18: un rol con solo uno de los dos módulos
              granulares igual debe ver el acceso. Si solo tiene
              'accesos-roles' (no 'accesos-usuarios'), lleva directo a
              /accesos/roles en vez de /accesos/usuarios. */}
          {(usuario?.esAdmin ||
            tienePermiso(usuario?.roles, 'accesos-usuarios', usuario?.permisosPorRol, usuario?.esAdmin) ||
            tienePermiso(usuario?.roles, 'accesos-roles', usuario?.permisosPorRol, usuario?.esAdmin)) && (
            <NavLink
              to={
                usuario?.esAdmin || tienePermiso(usuario?.roles, 'accesos-usuarios', usuario?.permisosPorRol, usuario?.esAdmin)
                  ? '/accesos/usuarios'
                  : '/accesos/roles'
              }
              className={styles.topbarIconLink}
              aria-label="Accesos y configuración"
            >
              <Settings size={20} strokeWidth={ICON_STROKE_WIDTH} aria-hidden="true" />
            </NavLink>
          )}
          <span className={styles.topbarDivider} aria-hidden="true" />
          <UserMenu />
        </div>
        <ReactLenis root={false} className={styles.scrollArea} options={{ smoothWheel: true }}>
          <Suspense fallback={<div className={styles.routeLoading}>Cargando...</div>}>
            <Outlet />
          </Suspense>
        </ReactLenis>
      </main>
    </div>
  );
}
