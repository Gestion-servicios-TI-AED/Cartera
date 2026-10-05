// Mismas claves que backend/src/config/modulos.js -- mantenido en sync a
// mano (el backend no puede importar este archivo, depende de lucide-react
// en otros lugares del frontend). Fuente única de las etiquetas mostradas en
// Accesos > Roles (matriz de permisos, ver RolFormPage.jsx/RolDetallePage.jsx)
// -- antes vivía inline en UsuarioFormPage.jsx, extraída acá porque ahora
// también la usa Roles (un usuario ya no elige módulos directo, elige
// roles; un rol es el que elige módulos).
//
// Oliv (CRM HubSpot) reemplaza a Alegra, que nunca llegó a tener módulos
// reales -- a diferencia de Alegra (que arrancó con los 8 módulos de Baía
// Kristal declarados de una, todos `enDesarrollo`), acá solo se agrega la
// clave de un módulo cuando de verdad se activa (empezando por
// Oportunidades) -- ver el mismo criterio en AppShell.jsx#NAV_GROUPS.
export const MODULOS_POR_PROYECTO = [
  {
    proyecto: 'Baía Kristal',
    items: [
      { key: 'oportunidades', label: 'Oportunidades' },
      { key: 'negocios', label: 'Negocios' },
      { key: 'inventario', label: 'Inmuebles' },
      { key: 'encargos', label: 'Encargos' },
      { key: 'movimientos', label: 'Movimientos' },
      { key: 'resumen', label: 'Resumen' },
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'cartera-mora', label: 'Cartera' },
      { key: 'otrosies', label: 'Otrosíes' },
    ],
  },
  {
    proyecto: 'Oliv',
    items: [
      { key: 'oliv-oportunidades', label: 'Oportunidades' },
      { key: 'oliv-negocios', label: 'Negocios' },
      { key: 'oliv-inmuebles', label: 'Inmuebles' },
      { key: 'oliv-encargos', label: 'Encargos' },
      { key: 'oliv-movimientos', label: 'Movimientos' },
      { key: 'oliv-resumen', label: 'Resumen' },
      { key: 'oliv-dashboard', label: 'Dashboard' },
      { key: 'oliv-cartera-mora', label: 'Cartera' },
    ],
  },
  // 'accesos-usuarios'/'accesos-roles' (2026-09-18): antes Accesos era 100%
  // ADMIN-only, ahora son modulos granulares como cualquier otro -- ver la
  // nota de auto-escalacion en backend/src/config/modulos.js#MODULOS_VALIDOS
  // antes de otorgarlos.
  {
    proyecto: 'Configuración',
    items: [
      { key: 'accesos-usuarios', label: 'Usuarios y permisos' },
      { key: 'accesos-roles', label: 'Roles y permisos' },
    ],
  },
];
