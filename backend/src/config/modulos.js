// Claves válidas de módulo -- deben reflejar 1:1 las `key` de
// frontend/src/components/layout/AppShell.jsx (NAV_GROUPS). El backend no
// puede importar ese archivo (depende de lucide-react, un paquete de
// frontend), así que esta lista se mantiene sincronizada a mano.
//
// Alegra (HubSpot, nunca llegó a tener módulos reales) se reemplazó por
// Oliv, tambien HubSpot -- se agregan claves `oliv-*` una por una, solo
// cuando el módulo correspondiente se activa de verdad (empezando por
// Oportunidades), no las 8 de una como se hizo con Alegra.
const MODULOS_VALIDOS = [
  'negocios', 'oportunidades', 'inventario', 'encargos', 'movimientos',
  'resumen', 'dashboard', 'cartera-mora', 'otrosies',
  'oliv-oportunidades', 'oliv-inmuebles', 'oliv-negocios', 'oliv-encargos', 'oliv-movimientos', 'oliv-resumen', 'oliv-dashboard', 'oliv-cartera-mora',
  // Accesos/Configuracion -- antes 100% admin-only (requireAdmin puro), ahora
  // un permiso mas que se le puede dar a un rol sin darle ADMIN completo
  // (puerto de HRMS, 2026-09-18, pedido explicito del usuario aplicado a los
  // 3 proyectos). ADVERTENCIA de auto-escalacion, real y deliberadamente no
  // bloqueada: `accesos-usuarios` permite crear/editar cuentas, incluida la
  // propia; `accesos-roles` permite editar los permisos de CUALQUIER rol,
  // incluido el que la cuenta misma tiene -- otorgar con el mismo criterio
  // que ADMIN. Frentes/Sincronizacion (ver AccesosLayout.jsx) no se pidio
  // desglosarlas, siguen 100% soloAdmin.
  'accesos-usuarios', 'accesos-roles',
];

module.exports = { MODULOS_VALIDOS };
