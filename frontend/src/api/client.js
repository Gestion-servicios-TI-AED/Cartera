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
let refreshingPromise = null;
function refreshSession() {
  if (!refreshingPromise) {
    refreshingPromise = fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => { refreshingPromise = null; });
  }
  return refreshingPromise;
}

async function request(path, options = {}) {
  // FormData (subida de archivos) se manda tal cual -- fetch pone el
  // Content-Type multipart/form-data con boundary solo, nunca a mano.
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: isFormData ? { ...(options.headers ?? {}) } : { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    body: isFormData || options.body === undefined ? options.body : JSON.stringify(options.body),
  });

  if (response.status === 401 && !options._retried && !path.startsWith('/auth/')) {
    const refreshed = await refreshSession();
    if (refreshed) return request(path, { ...options, _retried: true });
    sessionExpiredHandler?.();
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.error?.message ?? 'Error de red');
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
