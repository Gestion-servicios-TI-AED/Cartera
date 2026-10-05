// Ruta absoluta de la app respetando el `base` de Vite (VITE_BASE_PATH). Hace falta
// para `window.open('/negocios/1')`: abre una pestaña nueva con una URL del
// navegador (no del router), que bajo un subpath como /cartera/ debe llevar el
// prefijo. Con base '/' (standalone) devuelve la misma ruta de siempre.
export function rutaApp(ruta) {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}${ruta}`;
}
