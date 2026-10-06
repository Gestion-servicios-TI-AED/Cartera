// Una línea por petición a /api: fecha, método, ruta (SIN query string, puede
// traer búsquedas con datos personales), estado, duración y quién la hizo.
// Todo por stdout (console.log) para que Coolify/docker conserven el orden: lo
// que sale por stderr llega desordenado en esa vista. Nunca se registran
// cuerpos, cookies ni contraseñas; del login solo el email, para poder
// responder "¿intentó entrar y qué pasó?".
const SILENCIAR_2XX = [/\/sync\/status$/, /\/sync\/logs$/];
const LENTA_MS = 2000;

function requestLogger(req, res, next) {
  if (!req.originalUrl.startsWith('/api')) return next();
  const inicio = process.hrtime.bigint();
  let terminada = false;

  function registrar(sufijo) {
    const ms = Math.round(Number(process.hrtime.bigint() - inicio) / 1e6);
    const ruta = req.originalUrl.split('?')[0];
    if (!sufijo && res.statusCode < 300 && SILENCIAR_2XX.some((re) => re.test(ruta))) return;
    const usuario = req.usuario?.integracion ? 'integracion' : (req.usuario?.email ?? '-');
    const login = req.method === 'POST' && /\/api\/auth\/login$/.test(ruta) && typeof req.body?.username === 'string' ? ` login=${req.body.username.toLowerCase()}` : '';
    const lenta = ms >= LENTA_MS ? ' LENTA' : '';
    console.log(`${new Date().toISOString()} ${req.method} ${ruta} ${sufijo ?? res.statusCode} ${ms}ms user=${usuario}${login}${lenta}`); // eslint-disable-line no-console
  }

  res.on('finish', () => { terminada = true; registrar(null); });
  // El cliente cerró la conexión antes de recibir respuesta (recarga, cierre de pestaña, corte de red).
  res.on('close', () => { if (!terminada) registrar('ABORTADA'); });
  return next();
}

module.exports = requestLogger;
