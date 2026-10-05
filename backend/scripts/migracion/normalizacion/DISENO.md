# Normalización de `movimientos_fiduciarios` — PASO 2: diseño (para aprobación)

Base: la nueva de producción. **Este documento no modifica nada**; los pasos 3 en adelante solo empiezan con tu aprobación.

## Principios

1. **Cero pérdida de datos.** Cada valor de `datos` debe poder reconstruirse **idéntico** (mismo texto, mismo `null`) desde las columnas.
2. **Aditivo primero.** Se agregan columnas; `datos` se conserva hasta el paso 8.
3. **Nada se descarta ni se recorta.** Si la fiduciaria agrega columnas nuevas en un Excel futuro, van a `datos_extra` (jsonb), no se pierden.
4. **El frontend no cambia.** La API sigue devolviendo el mismo objeto `datos`, reconstruido por el backend.

## Qué se encontró en los datos (2.969.077 filas tipo A)

* Las 22 claves están presentes en **todas** las filas (ninguna ausente).
* **Fechas = seriales de Excel** sin decimales (`44208` = 2021-01-14; rango 2021-01-12 a 2026-10-02).
* `ID Interno` (máx. 7 dígitos, sin ceros a la izquierda) y `Concepto` (sin ceros a la izquierda) → enteros sin pérdida.
* `Valor`: 64.136 filas con decimales; rango −1.269.065.840 a 1.012.620.000. `Area`: hasta 3 decimales. → `numeric` **sin escala fija**, que conserva exactamente los dígitos escritos (`1234.5` vuelve como `1234.5`).
* 166.317 filas (5,6 %) son movimientos generados por el sistema (ajustes manuales, desistimientos, venta de unidad…) **sin datos bancarios**: `Concepto`, `Estado` y `Cuenta Bancaria` valen exactamente `" "` (un espacio) y `Fecha Mov. Banco` es `null` de JSON.
* `Comentarios` (646) y `Categoria` (2.352) traen `null` de JSON en algunas filas, distinto de un texto vacío.
* Muchos textos traen espacios en los bordes (p. ej. `Razones / Justificaciones`: 2,9 M de filas con `" "`). **No se recortan**: se guardan tal cual para no cambiar el dato.
* `% Participación 1` es siempre `" "`, pero se **conserva la columna** por si algún Excel futuro la trae con valor.
* `Propietario 1` llega a 310 caracteres (6.567 filas pasan de 255; la migración las cortó en la columna `propietario`, el texto completo sigue en `datos`).

## Columnas nuevas (solo filas tipo A; en las tipo B quedan en `NULL`)

| Columna | Tipo | Origen en `datos` | Regla de conversión (y de vuelta) |
|---|---|---|---|
| `forma` | `char(1)` | — | `'A'` si trae `Tipo Movimiento`; `'B'` si trae `Valor venta` |
| `tipo_movimiento` | `text` | Tipo Movimiento | tal cual |
| `fecha_contable` | `date` | Fecha Contable | serial → `1899-12-30 + n días`; de vuelta `fecha − 1899-12-30` |
| `fecha_mov_banco` | `date` NULL | Fecha Mov. Banco | igual; JSON `null` ↔ `NULL` |
| `valor` | `numeric` | Valor | texto numérico exacto |
| `concepto` | `integer` NULL | Concepto | `" "` ↔ `NULL` (todas las vacías son exactamente `" "`) |
| `id_interno` | `integer` | ID Interno | entero |
| `estado`, `cuenta_bancaria` | `text` | Estado, Cuenta Bancaria | tal cual (incluye `" "`) |
| `propietario_1` | `text` | Propietario 1 | tal cual (hasta 310+) |
| `nro_id_propietario_1` | `text` | Nro ID Propietario 1 | tal cual (hasta 77, a veces varios) |
| `pct_participacion_1`, `sucursal` | `text` | % Participación 1, Sucursal | tal cual |
| `comentarios`, `categoria` | `text` NULL | Comentarios, Categoria | JSON `null` ↔ `NULL` |
| `razones_justificaciones`, `observaciones` | `text` | Razones / Justificaciones, Observaciones | tal cual |
| `inventario`, `nomenclatura`, `referencia`, `fideicomiso`, `tipo_inmueble` | `text` | Inventario, Nomenclatura, Referencia, Fideicomiso, Tipo Inmueble | tal cual |
| `area` | `numeric` | Area | texto numérico exacto |
| `datos_extra` | `jsonb` NULL | claves no previstas | solo si aparece alguna |

Además, `propietario` (hoy `varchar(255)`) pasa a `text` y se rellena con el `Propietario 1` completo.

**Tipo B** (120.103 filas, 134 MB): sus columnas de mes cambian cada mes, así que **se quedan en `datos`** (`forma = 'B'`). Es el 4 % de las filas y casi nada de peso.

## Índices

* Se **conservan**: `id` (pk), `legacy_id`, `hoja_id`, `encarg_id`, `propietario`.
* Se **agregan**: `fecha_contable`, `tipo_movimiento`, `(hoja_id, fecha_contable)`.
* **No** se agregan índices trigram de texto (pesan mucho). La búsqueda por texto hoy recorre todo `datos::text`; pasará a recorrer solo las columnas relevantes (más rápida sin índice extra).

## Cómo se mantiene al día (paso 4)

Un **disparador** (`BEFORE INSERT OR UPDATE OF datos`) llena las columnas desde `datos` en cada fila nueva. Así la **pasada final** de la migración y cualquier subida de Excel antes del paso 6 siguen funcionando sin cambios, y no hay que volver a rellenar.

## Cómo se verifica (paso 5)

1. Reconstruir `datos` desde las columnas y compararlo con el original **en las 2.969.077 filas** (resultado esperado: 0 diferencias).
2. Sumas por `tipo_movimiento` y por hoja: `SUM(valor)` contra `SUM((datos->>'Valor')::numeric)`.
3. Totales del **Dashboard, Cartera, Resumen e Inicio** antes y después (deben ser idénticos).
4. Revisión visual de Movimientos y del detalle de unidad.

## Qué cambia en el código (paso 6)

| Archivo | Cambio |
|---|---|
| `fiducia/movimientoFiduciario.model.js` | modelo con las columnas nuevas y un `datos` reconstruido |
| `fiducia/fiducia.service.js` | lectura devuelve `datos` reconstruido; **filtro de fechas** pasa a `fecha_contable` (hoy espera `DD/MM/AAAA` y los datos son seriales, por eso no devuelve nada); búsqueda de texto sobre columnas |
| `fiducia/fiducia.upload.js` | al subir el Excel guarda en columnas; claves desconocidas a `datos_extra` |
| `dashboard/conciliacion.js`, `dashboard.service.js` | leen `tipo_movimiento` y `valor` de columnas |
| `scripts/importarDatosLegado.js`, `pasadaFinalMovimientos.js` | siguen escribiendo `datos` (el disparador llena las columnas); se ajustan al final |
| **Frontend** | **sin cambios** (el contrato de la API no cambia) |

## Espacio y orden de trabajo (importante)

* `UPDATE` masivo de 3 M de filas deja filas muertas (**~+3 GB temporales**) y quitar `datos` exige reescribir la tabla (otro espacio igual al tamaño final, ~2 GB). Para no depender del espacio libre del servidor (que no puedo ver), **todo se ensaya primero en una copia local** y en producción se hace por **tabla nueva + intercambio** (sin hinchar la base) o, si hay espacio, con `VACUUM FULL`. **Necesito que confirmes cuánto espacio libre tiene el servidor** (idealmente ≥ 8 GB) antes del paso 3 en producción.
* Orden: ensayo local (pasos 3 a 5 completos) → mismo procedimiento en producción → pasos 6 y 7 → paso 8 con respaldo.

## Resultado esperado

Tabla de movimientos de **3.039 MB → ~2.000 MB**; base completa **3.245 MB → ~2.200 MB**.

## Resultados del ensayo y notas (2026-10-05)

* **Paso 3-5 en el ensayo local:** 0 diferencias al reconstruir `datos` en las 3.089.180 filas; sumas por tipo y por hoja idénticas; suma total de Valor y rango de fechas idénticos a producción.
* **Paso 6 (código):** prueba A/B del servicio viejo contra el nuevo sobre los mismos datos: 9 de 10 consultas devuelven contenido y total **idénticos**. Las diferencias son las buscadas: la búsqueda de una palabra que solo coincidía con el *nombre* de una clave (p. ej. "valor") ya no devuelve todas las filas, y el filtro por fechas ahora funciona (antes 0 filas).
* **Escritor (subida de Excel):** no cambia; el disparador convierte al insertar. Una fila con valores no convertibles guarda el valor original en `datos_extra`; una forma desconocida se queda en `datos`.
* **Diferencia menor conocida:** si una fila tipo A llegara sin alguna de las 22 claves (en los datos reales todas están siempre), `mf_datos` la reconstruye con ese campo en `null` en vez de ausente. Inofensivo para la interfaz.
* **Paso 8 (versión final):** en lugar de quitar la columna `datos`, se **vacía solo en las filas tipo A** (el disparador pone `datos = NULL` tras llenar las columnas; la columna pasa a admitir NULL). Las filas tipo B y las formas desconocidas conservan su `datos`. Así no se pierde nada si aparece una forma nueva.
