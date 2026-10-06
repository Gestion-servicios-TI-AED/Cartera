// Sesión: el usuario SOLO se borra cuando el servidor dice de verdad que no hay
// sesión (401 al leer el perfil, o refresh rechazado). Cualquier otro fallo
// (red caída, 502/503, timeout, 500) conserva al usuario que ya estaba: antes un
// solo error al pedir el perfil lo mandaba al login.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authApi from '../api/auth';
import { setSessionExpiredHandler } from '../api/client';

const AuthContext = createContext(null);
const REINTENTO_MS = 5000;

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  // true = no se pudo leer el perfil por un fallo de conexión/servidor (no por
  // falta de sesión): la UI muestra "reintentar" en vez de mandar al login.
  const [errorConexion, setErrorConexion] = useState(false);

  const cargarPerfil = useCallback(() => {
    return authApi
      .getMe()
      .then((res) => {
        setUsuario(res.data);
        setErrorConexion(false);
      })
      .catch((err) => {
        if (err.status === 401) {
          setUsuario(null);
          setErrorConexion(false);
        } else {
          setErrorConexion(true);
        }
      });
  }, []);

  useEffect(() => {
    cargarPerfil().finally(() => setCargando(false));
  }, [cargarPerfil]);

  // Reintenta solo mientras haya un error de conexión.
  useEffect(() => {
    if (!errorConexion) return undefined;
    const id = setInterval(cargarPerfil, REINTENTO_MS);
    return () => clearInterval(id);
  }, [errorConexion, cargarPerfil]);

  useEffect(() => {
    setSessionExpiredHandler(() => setUsuario(null));
    return () => setSessionExpiredHandler(null);
  }, []);

  async function login(email, password) {
    const res = await authApi.login(email, password);
    await cargarPerfil();
    return res.data;
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Aunque el servidor no responda, el usuario pidió salir.
    }
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, errorConexion, login, logout, refrescarPerfil: cargarPerfil }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
