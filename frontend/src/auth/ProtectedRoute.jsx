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
  const { usuario, cargando, errorConexion, refrescarPerfil } = useAuth();
  const location = useLocation();

  if (cargando) return null;
  // No se pudo leer la sesión por un fallo de conexión (no por falta de sesión):
  // se queda aquí y reintenta solo, en vez de mandar al login.
  if (!usuario && errorConexion) {
    return (
      <div role="alert" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>No se pudo conectar con el servidor</h1>
          <p style={{ margin: '0 0 16px', color: 'var(--color-ink-secondary)' }}>Tu sesión sigue abierta. Estamos reintentando automáticamente.</p>
          <button type="button" onClick={refrescarPerfil} style={{ padding: '8px 16px', cursor: 'pointer' }}>Reintentar ahora</button>
        </div>
      </div>
    );
  }
  if (!usuario) return <Navigate to="/login" state={{ from: location }} replace />;
  // Cambio de contraseña pendiente: no se puede usar ninguna otra pantalla hasta hacerlo.
  if (usuario.debe_cambiar_password && location.pathname !== '/cambiar-password') {
    return <Navigate to="/cambiar-password" replace />;
  }
  if (soloAdmin && !usuario.esAdmin) return <Navigate to="/" replace />;
  if (permiso) {
    const permisos = Array.isArray(permiso) ? permiso : [permiso];
    const tieneAlguno = permisos.some((p) => tienePermiso(usuario.roles, p, usuario.permisosPorRol, usuario.esAdmin));
    if (!tieneAlguno) return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
