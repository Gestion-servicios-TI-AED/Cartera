// Wrapper fetch compartido -- credentials:'include' para que las cookies de
// sesion (cartera_access_token/cartera_refresh_token) viajen en cada
// request, mas el refresh automatico del access_token (ver "Login y
// autenticación" en ARQUITECTURA-FRONTEND.md: sin esto la sesion real dura
// 24h, no los 30 dias que promete el refresh_token).
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3011/api';

// Exportado para consumidores que construyen URLs directas (ej. abrir un
// archivo en pestaña nueva con el navegador nativo, sin pasar por fetch).
export { API_BASE_URL };

let sessionExpiredHandler = null;
export function setSessionExpiredHandler(fn) {
  sessionExpiredHandler = fn;
}

// Un solo refresh en vuelo aunque varias requests fallen con 401 al mismo tiempo.
// Devuelve 'ok' (cookie renovada), 'invalid' (el servidor RECHAZÓ el refresh:
// la sesión de verdad terminó) o 'error' (red caída, 502/503, timeout: la
// sesión puede seguir viva, así que NO se debe cerrar).
let refreshingPromise = null;
function refreshSession() {
  if (!refreshingPromise) {
    refreshingPromise = fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then((res) => {
        if (res.ok) return 'ok';
        return res.status === 401 || res.status === 403 ? 'invalid' : 'error';
      })
      .catch(() => 'error')
      .finally(() => { refreshingPromise = null; });
  }
  return refreshingPromise;
}

function mensajeDeEstado(status) {
  if (status === 502 || status === 503 || status === 504) return 'El servidor no está disponible en este momento. Intenta de nuevo en unos segundos.';
  if (status >= 500) return 'El servidor tuvo un problema. Intenta de nuevo.';
  return 'Error de red';
}

async function request(path, options = {}) {
  // FormData (subida de archivos) se manda tal cual -- fetch pone el
  // Content-Type multipart/form-data con boundary solo, nunca a mano.
  const isFormData = options.body instanceof FormData;
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: isFormData ? { ...(options.headers ?? {}) } : { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
      body: isFormData || options.body === undefined ? options.body : JSON.stringify(options.body),
    });
  } catch {
    // Sin conexión / servidor caído: nunca es motivo para cerrar la sesión.
    const error = new Error('No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.');
    error.status = 0;
    throw error;
  }

  if (response.status === 401 && !options._retried && !path.startsWith('/auth/')) {
    const estado = await refreshSession();
    if (estado === 'ok') return request(path, { ...options, _retried: true });
    // Solo si el servidor rechazó el refresh la sesión terminó de verdad.
    if (estado === 'invalid') sessionExpiredHandler?.();
    // No se pudo ni renovar (red/servidor caído): no sabemos si la sesión vive,
    // así que se reporta como fallo de conexión (status 0), nunca como 401.
    if (estado === 'error') {
      const error = new Error('No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.');
      error.status = 0;
      throw error;
    }
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.error?.message ?? mensajeDeEstado(response.status));
    error.status = response.status;
    error.details = payload?.error?.details;
    throw error;
  }

  return payload;
}

const client = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body: body ?? {} }),
  put: (path, body) => request(path, { method: 'PUT', body: body ?? {} }),
  patch: (path, body) => request(path, { method: 'PATCH', body: body ?? {} }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

export default client;
