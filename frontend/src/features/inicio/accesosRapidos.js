// Accesos rápidos de Inicio: reutilizan los mismos grupos/items (y permisos) del
// sidebar, así un módulo nuevo en NAV_GROUPS aparece aquí solo.
import { NAV_GROUPS } from '../../components/layout/AppShell.jsx';

export const ACCESOS_RAPIDOS = {
  baia: NAV_GROUPS.find((g) => g.title === 'Baía Kristal'),
  oliv: NAV_GROUPS.find((g) => g.title === 'Oliv'),
};
