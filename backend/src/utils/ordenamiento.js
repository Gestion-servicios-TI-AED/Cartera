// Ordenamiento SERVER-SIDE para tablas paginadas (Jefe Gabriel, 2026-09-23).
//
// El bug que lo motiva: `useSortableTable` (frontend, copiado de la plantilla
// HRMS) ordenaba solo en el navegador sobre las filas YA cargadas, así que
// ordenar una columna de un listado con más de una página solo reordenaba esa
// página. El orden tiene que resolverse sobre el universo completo filtrado,
// ANTES del LIMIT/OFFSET.
//
// SEGURIDAD: `sortBy` viene del cliente y NUNCA se concatena en el SQL. Cada
// módulo pasa su `campos` = whitelist `{ claveFrontend: 'columna_sql' }` y solo
// se emite lo que esté en ella; cualquier otra cosa (o un `sortBy` vacío) deja
// el orden por defecto del módulo, sin romper la request. La dirección tampoco
// viene del cliente: se normaliza a 'ASC'/'DESC' (cualquier otra cosa = ASC).
//
// Además siempre se agrega un desempate por columna única (id/negacio_id) para
// que dos filas empatadas no se intercalen entre páginas y el paginado sea
// estable, y los NULL siempre al final (`NULLS LAST`) en ambas direcciones,
// que es lo mismo que hacen los ordenadores en memoria de `dashboard.service.js`.
const DIR_POR_DEFECTO = 'ASC';

// `campos` es un objeto plano { clave: columnaSql }. Devuelve la columna si la
// clave está en la whitelist, o null.
function columnaWhitelisted(sortBy, campos) {
  if (!sortBy || typeof sortBy !== 'string' || !campos) return null;
  if (!Object.prototype.hasOwnProperty.call(campos, sortBy)) return null;
  return campos[sortBy];
}

function direccion(sortDir) {
  return String(sortDir || '').toLowerCase() === 'desc' ? 'DESC' : DIR_POR_DEFECTO;
}

// Para Sequelize (`findAndCountAll({ order })`): devuelve el array de order.
// `porDefecto` se devuelve tal cual si la clave no está whitelisted.
// `similitud` (opcional) es una entrada de order que se antepone a todo -- la
// usan los listados con búsqueda para poner arriba la fila más relevante
// cuando el usuario NO pidió un orden explícito.
function ordenSequelize({ sortBy, sortDir, campos, porDefecto = [], desempate = null, similitud = null } = {}) {
  const col = columnaWhitelisted(sortBy, campos);
  const base = col
    ? [[col, direccion(sortDir)], ...(desempate ? [[desempate, DIR_POR_DEFECTO]] : [])]
    : porDefecto;
  return similitud ? [similitud, ...base] : base;
}

// Para SQL crudo: devuelve el fragmento de ORDER BY (sin parámetros, la
// dirección es un literal ya normalizado, así que no interfiere con la
// numeración de binds del WHERE).
function clausulaOrdenSql({ sortBy, sortDir, campos, porDefecto, desempate = null } = {}) {
  const col = columnaWhitelisted(sortBy, campos);
  if (!col) return porDefecto;
  return `${col} ${direccion(sortDir)} NULLS LAST${desempate ? `, ${desempate} ASC NULLS LAST` : ''}`;
}

// Para listados que se arman en memoria y se paginan después (olivNegocio):
// ordena sobre TODAS las filas (no sobre la página). `numericos` marca las
// claves que se comparan como número, el resto como texto con orden natural
// (para que 'Torre 2' vaya antes que 'Torre 10'). `clave` permite el caso
// 'pendienteRecaudar' de dashboard (valor derivado de otras dos columnas).
function ordenarFilas(filas, { sortBy, sortDir, campos, numericos = [], clave } = {}) {
  const col = columnaWhitelisted(sortBy, campos);
  if (!col) return filas;
  const dir = direccion(sortDir) === 'DESC' ? -1 : 1;
  const valor = (f) => (clave ? clave(f) : f[col]);
  return [...filas].sort((a, b) => {
    const va = valor(a);
    const vb = valor(b);
    if (va == null && vb == null) return 0;
    if (va == null) return 1; // nulls siempre al final, como en SQL
    if (vb == null) return -1;
    if (numericos.includes(col)) return dir * (Number(va) - Number(vb));
    return dir * String(va).localeCompare(String(vb), 'es', { numeric: true, sensitivity: 'base' });
  });
}

module.exports = { columnaWhitelisted, direccion, ordenSequelize, clausulaOrdenSql, ordenarFilas };