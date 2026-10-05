// Copiado de plantilla-arquitectura/componentes/auth/frontend/ProtectedRoute.jsx.
// Adaptado: `soloAdmin` compara contra `usuario.esAdmin` -- Cartera AED usa
// el patron de roles dinamicos (ver ARQUITECTURA-BACKEND.md, "Roles y
// permisos dinámicos"), no un enum de rol simple. `usuario.esAdmin` (viene
// de GET /usuarios/me) es distinto del booleano `esAdmin` que tenia la
// columna `usuarios` antes de ese refactor: ahora es un valor RESUELTO en
// cada login/request contra `roles.es_admin` (flag ligado a la fila/id del
// rol, ver rol.model.js/middlewares/auth.js del backend), no una columna
// propia de `usuarios` -- los roles siguen siendo 100% dinamicos/
// renombrables, solo se corrigio que renombrar el rol ADMIN no rompa este
// chequeo (pedido explicito del usuario, 2026-09-18).
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { tienePermiso } from '../utils/permisos.js';

// permiso (string o array, semantica OR para el array): gatea una ruta
// puntual de Accesos (ej. /accesos/usuarios, /accesos/roles) por un modulo
// granular en vez de todo-o-nada por ADMIN -- puerto de HRMS/Contratacion,
// 2026-09-18, pedido explicito del usuario aplicado a los 3 proyectos. El
// backend (requireModulo) es el limite real, esto es solo UX.
export function ProtectedRoute({ soloAdmin = false, permiso = null }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) return null;
  if (!usuario) return <Navigate to="/login" state={{ from: location }} replace />;
  if (soloAdmin && !usuario.esAdmin) return <Navigate to="/" replace />;
  if (permiso) {
    const permisos = Array.isArray(permiso) ? permiso : [permiso];
    const tieneAlguno = permisos.some((p) => tienePermiso(usuario.roles, p, usuario.permisosPorRol, usuario.esAdmin));
    if (!tieneAlguno) return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
