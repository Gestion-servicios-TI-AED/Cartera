// Aviso no bloqueante para errores que ninguna pantalla atrapó (una petición
// fallida dentro de un clic, un 502, etc.): en vez de fallar en silencio o
// romper la pantalla, muestra el mensaje unos segundos. Nunca toca la sesión.
import { useEffect, useState } from 'react';

const DURACION_MS = 8000;

export function AvisoErrores() {
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    function alRechazar(event) {
      const razon = event.reason;
      // Solo errores de red/HTTP del cliente; el resto se deja al navegador.
      if (!razon || typeof razon.status !== 'number') return;
      event.preventDefault();
      if (razon.status === 401) return; // la sesión la maneja AuthContext
      setMensaje(razon.message || 'Ocurrió un error. Intenta de nuevo.');
    }
    window.addEventListener('unhandledrejection', alRechazar);
    return () => window.removeEventListener('unhandledrejection', alRechazar);
  }, []);

  useEffect(() => {
    if (!mensaje) return undefined;
    const id = setTimeout(() => setMensaje(null), DURACION_MS);
    return () => clearTimeout(id);
  }, [mensaje]);

  if (!mensaje) return null;
  return (
    <div
      role="alert"
      style={{
        position: 'fixed', right: 16, bottom: 16, zIndex: 1000, maxWidth: 380, padding: '12px 16px',
        background: 'var(--color-danger-surface)', color: 'var(--color-danger-ink)',
        border: '1px solid var(--color-danger-ink)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-floating)',
      }}
    >
      {mensaje}
      <button type="button" onClick={() => setMensaje(null)} aria-label="Cerrar aviso" style={{ marginLeft: 12, cursor: 'pointer', background: 'none', border: 0, color: 'inherit' }}>×</button>
    </div>
  );
}
