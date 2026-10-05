// PLANTILLA -- copiado tal cual, va en frontend/src/auth/AuthContext.jsx.
// Envuelve <App /> con <AuthProvider> en main.jsx (ver el ejemplo en el
// comentario de LoginPage.jsx).
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarPerfil = useCallback(() => {
    return authApi
      .getMe()
      .then((res) => setUsuario(res.data))
      .catch(() => setUsuario(null));
  }, []);

  useEffect(() => {
    cargarPerfil().finally(() => setCargando(false));
  }, [cargarPerfil]);

  async function login(email, password) {
    const res = await authApi.login(email, password);
    await cargarPerfil();
    return res.data;
  }

  async function logout() {
    await authApi.logout();
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, refrescarPerfil: cargarPerfil }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
