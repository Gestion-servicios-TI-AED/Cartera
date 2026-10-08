# Diccionario de datos — Baía Kristal (Negocios, Dashboard, Resumen, Cartera en Gestión)

> Para cada dato que se ve en pantalla, de dónde sale exactamente. Cuando un dato es un cálculo,
> la fila dice, completo y sin atajos, con qué columnas/campos reales se arma — y si ese cálculo
> a su vez usa otro cálculo, también se explica ese otro ahí mismo, en la misma fila, hasta llegar
> siempre a una columna real del Excel o un campo real de Zoho. No hace falta saltar a otra tabla
> de este documento para entender una fila.
> Escrito el 2026-09-11 sobre el sistema tal como funciona hoy.

## Cómo leer este documento

Cada dato tiene una de estas etiquetas de origen:

| Etiqueta | Qué significa |
|---|---|
| **Excel Fiducia — Movimientos** | columna de la hoja "Movimientos" del Excel de la fiduciaria (una fila por negocio) |
| **Excel Fiducia — Mov_Por_Propietario** | columna de la hoja "Mov_Por_Propietario" del mismo Excel (una fila por cada pago real) |
| **Zoho — Negocios** | campo del negocio comercial en Zoho (CRM) |
| **Zoho — Inventario** | campo del inmueble físico en Zoho (CRM) |
| **Manual** | lo marca a mano alguien del equipo, dentro del sistema |
| **Configuración** | lo carga un administrador en Ajustes → Fechas de entrega |
| **Calculado** | el sistema lo obtiene combinando columnas/campos reales — la fila explica esa combinación completa, con nombre de columna y hoja/sistema de cada ingrediente |

---

## Antes de entrar a las tablas: los 4 cálculos que se repiten en TODAS las pantallas de plata

Dashboard, Resumen y Cartera en Gestión comparten estos 4 cálculos una y otra vez. Se explican acá
a fondo una vez, y **cada fila de cada tabla más abajo los vuelve a resumir en el momento** (no
solo dice "ver arriba") — esta sección es para quien quiera el detalle más fino de cómo se arma
cada uno.

**① El plan de cuotas de un negocio** — sale de **Zoho — Negocios**: dentro de cada negocio hay una
tabla llamada "Propuesta de Pago" (plan negociado a la medida) y otra "Forma de Pago" (plan
estándar); se usa la Propuesta de Pago si el negocio tiene una cargada, si no la Forma de Pago.
Cada fila de esa tabla trae el nombre de la cuota (Separación, 1, 2... o Saldo Contraentrega, que
siempre es la última) y su valor en pesos. La fecha de cada cuota sale de sumarle meses a la fecha
de inicio del plan (**Zoho — Negocios**, campo Fecha de Inicio del Plan de Pagos).

> **Por qué el sistema separa "todas las cuotas menos la última" de "la última cuota sola"**: un
> plan de pagos típico es Separación + varias cuotas mensuales + una fila final — esa fila final,
> sea cual sea su nombre, el sistema SIEMPRE la trata como el **Saldo Contraentrega** (el 70% que
> se paga cuando se entrega el inmueble/se firma la escritura), simplemente por ser la última fila
> de la tabla, no por su nombre. Todas las cuotas ANTERIORES a esa (Separación + las mensuales)
> juntas conforman la **Cuota Inicial** (el 30%). Por eso en todo este documento vas a ver la
> frase "las cuotas que no son la última" — es literalmente eso: Separación + cuotas mensuales =
> Cuota Inicial (30%); la última cuota sola = Saldo Contraentrega (70%).

**② Los pagos reales de un negocio, ya limpios** — sale de **Excel Fiducia — Mov_Por_Propietario**,
columnas "Fecha Contable" y "Valor" de cada movimiento, **descartando** los que tengan "Tipo
Movimiento" = "GENERADO POR VENTA UNIDAD" (no es plata real, es un apunte contable) y descartando
también cualquier pago anterior a un desistimiento ("Tipo Movimiento" = "DESISTIMIENTOS", o un
"AJUSTE MANUAL + Y -" que deje la cuenta en cero).

**③ La conciliación** (cruzar ① contra ②) — se aplican los pagos limpios (②) a las cuotas del plan
(①), en orden cronológico, hasta agotar la plata — así cada cuota queda pagada/parcial/pendiente/
atrasada. Antes de mostrarse, se le hacen dos ajustes más: si el **Excel Fiducia — Movimientos**
trae la columna **"Valor Venta"** (o **"Valor Factura"** en vez de esa, solo para inmuebles ya
facturados de Etapa 1 o 2), la última cuota (el Saldo Contraentrega) se recalcula para que el
total del plan cuadre exactamente con ese valor; y si un administrador cargó una fecha de entrega
en **Configuración** (Ajustes → Fechas de entrega) para el piso/torre/proyecto de ese inmueble,
esa fecha reemplaza la fecha esperada de esa misma última cuota.

**④ El negocio de Zoho vigente** — de todos los negocios de **Zoho — Negocios** que compartan la
misma **Referencia** (columna de **Excel Fiducia — Movimientos**) con este negocio de fiducia, se
descartan los que estén en una etapa de Zoho que signifique "se cayó" (Desistido, Backout,
Preparación Carta Desistimiento, No Interesado, Desistido en Aprobación Gerencia, Carta
Desistimiento Firmada por Cliente, Carta Desistimiento Radicada) — salvo que todos lo estén — y de
los que queden se usa el más antiguo. De este negocio de Zoho salen el plan de cuotas (①) y todo lo
demás. **Sin un negocio de Zoho vigente vinculado, nada de esto existe** para ese inmueble (aunque
el inmueble sigue contando en el inventario total, con su precio de lista de Zoho como valor).

Y dos cruces de identidad que también se repiten mucho:

**Inmueble ↔ Negocio de fiducia**: el campo **Referencia de Recaudo** de **Zoho — Inventario**
contra la columna **"Referencia"** de **Excel Fiducia — Movimientos** (coincidencia exacta); si no
coincide, se intenta con el código de inmueble de **Zoho — Inventario** contra la columna
**"Nomenclatura"** de **Excel Fiducia — Movimientos**.

**Etapa / Frente / Torre**: sale de una sola columna de texto de **Zoho — Inventario** (el campo
que junta proyecto y torre, algo como `"Kabo - Torre 3"`) — se separa en Frente (el proyecto) y
número de Torre, y esa combinación se traduce a Etapa con esta tabla fija:

| Torres | Etapa |
|---|---|
| Kabo 1, Kabo 2, Prive 2, Prive 3 | Etapa 1 |
| Kabo 3, Kabo 4, Prive 1, Prive 4 | Etapa 2 |
| Kala 1, Kala 2, Kaliza 1, Kaliza 2 | Etapa 3 |
| Kala 3, Kala 4, Kaliza 3 | Etapa 4 |
| Cualquier otro proyecto (Isla Laguna, The Plaza, Vela Village, etc.) | ese proyecto ES su propia etapa |

---

# Módulo: Negocios

## Panel de estadísticas (se ve cuando no hay ningún negocio seleccionado)

| Campo en pantalla | De dónde sale |
|---|---|
| Total inmuebles | **Calculado** — cuenta los inmuebles de **Zoho — Inventario**, sin contar la torre "Vela Village - Torre 2" ni los inmuebles cuyo nombre empiece con `*` (ver "Exclusiones" al final) |
| Con negocio | **Calculado** — cuenta las filas de **Excel Fiducia — Movimientos** (cada fila de esa hoja es un negocio) |
| Con abonos | **Calculado** — de esas filas, cuenta las que tienen la columna **"Saldo Actual"** (**Excel Fiducia — Movimientos**) mayor a $0 |
| Total abonado | **Calculado** — suma la columna **"Saldo Actual"** (**Excel Fiducia — Movimientos**) de TODAS las filas de esa hoja |
| Por estado (desglose) | **Calculado** — agrupa las filas de **Excel Fiducia — Movimientos** por su columna **"Estado"**, y dentro de cada grupo suma la columna **"Saldo Actual"** de esa misma hoja |
| Por etapa / Por frente (desglose) | **Calculado** — para cada negocio (**Excel Fiducia — Movimientos**), se busca su inmueble cruzando la columna **"Referencia"** (o **"Nomenclatura"**) de esa hoja contra el campo Referencia de Recaudo (o el código de inmueble) de **Zoho — Inventario**; de ese inmueble se lee la columna de texto proyecto+torre de **Zoho — Inventario** y se traduce a Etapa/Frente con la tabla fija de arriba; se agrupa por ahí y se suma "Saldo Actual" (**Excel Fiducia — Movimientos**) |

> ⚠️ **Ojo con este "Total abonado"**: es la columna **Saldo Actual tal cual la escribió la
> fiduciaria** en **Excel Fiducia — Movimientos** — un dato de entrada, no un cálculo propio del
> sistema. Es distinto del "Total abonado" que usan Dashboard/Resumen/Cartera en Gestión más
> abajo, que SÍ es un cálculo propio (③: suma real de los pagos de **Excel Fiducia —
> Mov_Por_Propietario** ya aplicados contra el plan de pagos de **Zoho — Negocios**). Pueden no
> coincidir si la fiducia no ha actualizado la columna "Saldo Actual" a la fecha.

## Lista de negocios (columna izquierda)

| Campo en pantalla | De dónde sale |
|---|---|
| Buscar | **Calculado** — compara el texto escrito contra la columna "Referencia" (**Excel Fiducia — Movimientos**), la columna "Nomenclatura" (**Excel Fiducia — Movimientos**), y las columnas "Propietario"/"Nro ID Propietario" (**Excel Fiducia — Mov_Por_Propietario**) |
| Filtro "Estado del negocio" | **Excel Fiducia — Movimientos**, columna "Estado" |
| Filtro "Etapa" / "Frente" / "Torre" | **Calculado** — mismo cruce Inmueble↔Negocio + traducción a Etapa/Frente/Torre explicado arriba, en "Antes de entrar a las tablas" |
| Toggle "Solo con abonos" | **Excel Fiducia — Movimientos**, columna "Saldo Actual" > $0 |
| Toggle "Solo con movimientos" | **Calculado** — el negocio tiene al menos una fila en **Excel Fiducia — Mov_Por_Propietario** |
| Título de cada fila | **Zoho — Inventario** (código del proyecto, del inmueble encontrado por el cruce Inmueble↔Negocio) → si no hay, **Excel Fiducia — Movimientos**, columna "Nomenclatura" → si tampoco, la columna "Referencia" de esa misma hoja |
| Subtítulo: proyecto/torre + etapa | **Calculado** — Etapa/Frente/Torre (ver arriba) del inmueble encontrado por el cruce Inmueble↔Negocio |
| Subtítulo: comprador | **Excel Fiducia — Mov_Por_Propietario**, columna "Propietario" (el primero, con un "+N" si hay más de uno) |
| Insignia de estado | **Excel Fiducia — Movimientos**, columna "Estado" |
| Insignia "Sin negocio" | **Calculado** — aparece cuando el cruce Inmueble↔Negocio (Referencia de Recaudo de **Zoho — Inventario** contra columna "Referencia" de **Excel Fiducia — Movimientos**, o Nomenclatura) no encuentra ningún negocio para ese inmueble |
| Saldo (a la derecha de cada fila) | **Excel Fiducia — Movimientos**, columna "Saldo Actual" |
| Botón exportar (Excel/CSV/PDF) | descarga la misma lista ya calculada de la pantalla — no agrega ningún dato nuevo |
| Botón "Reconstruir desde Fiducia" | vuelve a leer desde cero el último Excel subido (hojas "Movimientos" y "Mov_Por_Propietario") y reconstruye toda la lista de negocios/compradores/movimientos |

## Detalle de un negocio — encabezado

| Campo en pantalla | De dónde sale |
|---|---|
| "Referencia" o "Nomenclatura completa" (título grande) | **Calculado** — Proyecto + Torre + Piso + Unidad del inmueble (**Zoho — Inventario**) encontrado por el cruce Inmueble↔Negocio, si existe; si no, la columna "Referencia" de **Excel Fiducia — Movimientos** |
| Subtítulo (Apto / Etapa / Torre / Piso) | **Calculado** — columna "Nomenclatura" (**Excel Fiducia — Movimientos**) + Etapa/Torre (traducidas de **Zoho — Inventario** con la tabla fija) + Piso (**Zoho — Inventario**) |
| Insignia de estado | **Excel Fiducia — Movimientos**, columna "Estado" |
| Insignia "Sin negocio" | **Calculado**, igual que en la lista (cruce Inmueble↔Negocio sin resultado) |
| "{N} mov." | **Calculado** — cuenta las filas de **Excel Fiducia — Mov_Por_Propietario** de este negocio |
| Botón "Estado de cuenta" (PDF) | genera un PDF con todo el contenido de la sección "Conciliación" (ver abajo) — solo aparece si el negocio tiene un negocio de **Zoho — Negocios** vigente vinculado (ver "④ El negocio de Zoho vigente", arriba) |
| "Total abonado" (arriba a la derecha) | **Excel Fiducia — Movimientos**, columna **"Saldo Actual"** — el mismo dato de la lista de la izquierda, NO el total pagado que calcula la sección "Conciliación" más abajo |

## Sección "Comprador"

| Campo | De dónde sale |
|---|---|
| Nombre de cada comprador | **Excel Fiducia — Mov_Por_Propietario**, columna "Propietario" (o "Propietario 1") |
| Cédula | **Excel Fiducia — Mov_Por_Propietario**, columna "Nro ID Propietario" |
| % de participación | **Excel Fiducia — Mov_Por_Propietario**, columna "% Participación" |
| Número junto al título de la sección | **Calculado** — cuenta cuántas columnas "Propietario" distintas se encontraron para ese negocio |

Si la hoja "Mov_Por_Propietario" no trae nada para ese negocio, se usa como respaldo la columna
**"Propietarios"** de **Excel Fiducia — Movimientos** (menos detallada: solo el nombre, sin cédula
por separado).

## Sección "Info del apartamento"

| Campo | De dónde sale |
|---|---|
| Lo que aparezca acá (Nomenclatura, Área, Torre, Piso, Matrícula, Parqueadero, Depósito, Notaría, Fecha de contrato, etc.) | **Excel Fiducia — Movimientos** — cualquier columna de esa hoja que describa la identidad física del apartamento, mostrada con el mismo nombre y valor con que está escrita ahí |
| Si el Excel no trae nada de eso (respaldo) | **Zoho — Inventario**: campos Código de inmueble, Categoría, Tipo, Área privada, Área construida, Piso, Alcobas, Baños, Estrato |
| "Etapa" (agregada arriba de la lista) | **Calculado** — traducida de **Zoho — Inventario** con la tabla fija (ver arriba) |
| "Código de Inmueble" / "Nomenclatura completa" (agregados arriba) | **Zoho — Inventario** (la nomenclatura completa se calcula: Proyecto + Torre + Piso + Unidad) |

## Sección "Estructura financiera y abonos"

| Campo | De dónde sale |
|---|---|
| Lo que aparezca acá (Valor Venta, Cuota Inicial, Crédito, Saldo Actual, Saldo de un mes puntual, Aportes, etc.) | **Excel Fiducia — Movimientos** — cualquier columna de esa hoja que hable de plata, mostrada con el mismo nombre y valor con que está escrita ahí |

> Nota: varias columnas de dinero de **Excel Fiducia — Movimientos** (Canje, Subsidio, Descuentos,
> Valor Acreditación, Valor Escritura, Número Factura, Fecha Factura) **nunca aparecen acá aunque
> el Excel las traiga** — el sistema las descarta a propósito al leer el archivo, antes de que
> lleguen a cualquier pantalla (ver "Exclusiones" al final del documento).

## Sección "Conciliación"

Esta es la única sección del módulo Negocios que usa los 4 cálculos compartidos (①②③④, explicados
arriba en "Antes de entrar a las tablas") — acá se aplican a un solo negocio, no a todo el
portafolio.

| Campo | De dónde sale |
|---|---|
| Total plan | **Calculado** — suma de las cuotas del plan de pagos de **Zoho — Negocios** (①: subform "Propuesta de Pago" si existe, si no "Forma de Pago"), ajustada para que cuadre con la columna **"Valor Venta"** de **Excel Fiducia — Movimientos** si esa columna tiene dato (③) |
| Total pagado (+ %) | **Calculado** — suma de los pagos de **Excel Fiducia — Mov_Por_Propietario** (columnas "Fecha Contable"/"Valor"), ya limpios de "GENERADO POR VENTA UNIDAD" y de lo anterior a un desistimiento (②); el % es ese total sobre "Total plan" |
| Cuotas pagadas / Total cuotas | **Calculado** — conteo directo de las cuotas del plan (①) según su estado tras aplicarles los pagos (③) |
| En mora (cuotas + monto + días) | **Calculado** — de las cuotas del plan (①) tras aplicarles los pagos (③): cuáles tienen fecha ya vencida y no están pagadas del todo, cuánta plata les falta, y el mayor atraso en días entre esa fecha y hoy |
| Card "Saldo Contraentrega" (valor, pagado, fecha esperada) | **Calculado** — es la última cuota del plan (①) — por definición, el Saldo Contraentrega SIEMPRE es la última fila del plan, no se busca por nombre —, con su valor ajustado a la columna "Valor Venta" de **Excel Fiducia — Movimientos** (③) y su fecha reemplazada por la fecha cargada en **Configuración** (Ajustes → Fechas de entrega) si existe para ese piso/torre/proyecto |
| Tabla de cuotas — columna "Cuota" | **Zoho — Negocios**, nombre de la cuota dentro del subform "Propuesta de Pago" o "Forma de Pago" (①) |
| Columna "Fecha esperada" | **Calculado** — fecha de inicio del plan (**Zoho — Negocios**, campo Fecha de Inicio del Plan de Pagos) más N meses según el número de la cuota (①); si esa fila es la última del plan (o sea, el Saldo Contraentrega), se reemplaza por la fecha de **Configuración** si existe |
| Columna "Fecha de pago" | **Calculado** — la fecha (columna "Fecha Contable" de **Excel Fiducia — Mov_Por_Propietario**) del pago que terminó de completar esa cuota, al aplicar los pagos en orden (③) |
| Columna "Valor de la cuota" | **Zoho — Negocios** (①), con el ajuste a la columna "Valor Venta" de **Excel Fiducia — Movimientos** si esa fila es la última del plan, o sea el Saldo Contraentrega (③) |
| Columna "Valor pagado" | **Calculado** — la parte de los pagos de **Excel Fiducia — Mov_Por_Propietario** (②) que, al aplicarse en orden (③), le tocó específicamente a esa cuota |
| Columna "Diferencia" | **Calculado** — "Valor de la cuota" menos "Valor pagado" (las dos columnas anteriores) |
| Columna "Días de atraso" | **Calculado** — días entre la "Fecha esperada" de esa cuota y hoy, solo si no está pagada del todo y esa fecha ya pasó |
| Columna "Estado" (Pagada/Parcial/Pendiente/Atrasada) | **Calculado** — resultado de aplicar los pagos (②) a esa cuota (③) |
| "Saldo a favor" | **Calculado** — cuando "Total pagado" (suma de **Excel Fiducia — Mov_Por_Propietario**) supera a "Total plan" |

## Sección "Historial de movimientos"

| Campo | De dónde sale |
|---|---|
| Fecha | **Excel Fiducia — Mov_Por_Propietario**, columna "Fecha Contable" |
| Tipo movimiento | **Excel Fiducia — Mov_Por_Propietario**, columna "Tipo Movimiento" |
| Valor | **Excel Fiducia — Mov_Por_Propietario**, columna "Valor" |
| Campos adicionales al expandir una fila (Comentarios, Cuenta Bancaria, Concepto, Fecha Mov. Banco, Observaciones, ID Movimiento, etc.) | **Excel Fiducia — Mov_Por_Propietario**, el resto de columnas de esa misma fila, tal como están (menos "Sucursal", que se descarta siempre al leer el archivo) |

> Esta lista muestra TODOS los movimientos tal como están en **Excel Fiducia — Mov_Por_Propietario**,
> incluidos los que el cálculo ② descarta para la Conciliación (ej. "GENERADO POR VENTA UNIDAD")
> — acá se ven todos sin filtrar, porque es un historial de consulta, no un cálculo financiero.

## Sección "Forma y propuesta de pago"

| Campo | De dónde sale |
|---|---|
| Tabla "Forma de pago" | **Zoho — Negocios**, subform "Forma de Pago" del negocio — el plan estándar (una de las dos fuentes posibles del cálculo ①) |
| Tabla "Propuesta de pago" | **Zoho — Negocios**, subform "Propuesta de Pago" del negocio — el plan con condiciones negociadas a la medida (la otra fuente posible de ①; si existe, es la que se usa para toda la Conciliación en vez de la Forma de pago) |
| "Fecha estimada" de cada fila | **Calculado** — fecha de inicio del plan (**Zoho — Negocios**) más N meses según el número de cuota, igual que en la sección Conciliación |

---

# Módulo: Dashboard (Plan de pagos vs. Recaudo)

Tabla de detalle, inmueble por inmueble, mes por mes — construida con los cálculos ①②③④ de "Antes
de entrar a las tablas", una vez por cada inmueble que tiene un negocio de **Zoho — Negocios**
vigente vinculado.

## Filtros

| Campo en pantalla | De dónde sale |
|---|---|
| Buscar | **Calculado** — compara contra la Nomenclatura (**Zoho — Inventario**) o el proyecto/torre traducido de ese mismo campo |
| Etapa / Frente / Torre | **Calculado** — la columna de texto proyecto+torre de **Zoho — Inventario**, traducida a Etapa con la tabla fija (ver "Antes de entrar a las tablas") |
| Desde / Hasta (mes) | recorta qué columnas de mes se muestran — no cambia ningún total, solo cuáles se ven en pantalla |
| Ver: Ambos / Proyectado / Recaudado | elige qué columnas de cada mes se muestran |
| Plan: Ambos (100%) / Cuota inicial (30%) / Contraentrega (70%) | elige si se ve el plan completo (③), o solo la parte de las cuotas que NO son la última (Separación + cuotas mensuales = Cuota Inicial, el 30%), o solo la última cuota sola (el Saldo Contraentrega, el 70%) |
| Solo con movimientos | **Calculado** — el negocio tiene al menos una fila en **Excel Fiducia — Mov_Por_Propietario** |

## Columnas fijas de la tabla

| Columna en pantalla | De dónde sale |
|---|---|
| Etapa / Frente / Torre | **Calculado** — de **Zoho — Inventario**, columna de texto proyecto+torre, traducida con la tabla fija |
| Nomenclatura | **Zoho — Inventario**, nombre del inmueble |
| Valor del inmueble | **Calculado** — suma de las cuotas del plan de pagos de **Zoho — Negocios** (①: subform "Propuesta de Pago" o "Forma de Pago"), ajustada a la columna **"Valor Venta"** de **Excel Fiducia — Movimientos** si tiene dato (③). Si el inmueble no tiene ningún negocio de **Zoho — Negocios** vigente vinculado, en su lugar se usa el precio de lista: **Zoho — Inventario**, campo de precio (Unit_Price) |
| Valor cuota inicial | **Calculado** — suma de las cuotas del plan (①) que NO son la última fila del plan (o sea, Separación + cuotas mensuales = todo menos el Saldo Contraentrega), salvo que **Excel Fiducia — Movimientos** traiga la columna **"Cuota Inicial"** con un valor para ese negocio — en ese caso ese valor la reemplaza |
| Abonado cuota inicial | **Calculado** — la parte de los pagos de **Excel Fiducia — Mov_Por_Propietario** (②) que, al aplicarse en orden (③), les tocó específicamente a esas cuotas que no son la última (o sea, a la Cuota Inicial, no al Saldo Contraentrega) |
| Terminación de obra | **Calculado** — fecha esperada de la última cuota del plan de **Zoho — Negocios** (①) — es decir, la fecha del Saldo Contraentrega —, reemplazada por la fecha cargada en **Configuración** (Ajustes → Fechas de entrega) para ese piso/torre/proyecto, si existe |
| Valor saldo contraentrega | **Calculado** — valor de la última cuota del plan de **Zoho — Negocios** (①) — por definición, esa última fila del plan ES el Saldo Contraentrega —, ya ajustado a la columna "Valor Venta" de **Excel Fiducia — Movimientos** (③) |
| Total abonado del inmueble | **Calculado** — suma de TODOS los pagos de **Excel Fiducia — Mov_Por_Propietario** (columnas "Fecha Contable"/"Valor") de ese negocio, ya limpios de "GENERADO POR VENTA UNIDAD" y de lo anterior a un desistimiento (②) |
| Por recaudar | **Calculado** — "Valor del inmueble" menos "Total abonado del inmueble" (las dos columnas de arriba, en esta misma tabla) |
| Cuotas vencidas (total) | **Calculado** — de las cuotas del plan (①) tras aplicarles los pagos (③): cuántas tienen fecha ya vencida y no están pagadas del todo |
| Valor cuotas vencidas (total) | **Calculado** — cuánta plata les falta a esas mismas cuotas vencidas |
| Cada columna de mes — "Proyectado" | **Calculado** — de las cuotas del plan de **Zoho — Negocios** (①) cuya fecha esperada cae en ese mes, la suma de su valor |
| Cada columna de mes — "Recaudado" | **Calculado** — de los pagos de **Excel Fiducia — Mov_Por_Propietario** (②) cuya "Fecha Contable" cae en ese mes, la suma de su "Valor" |
| Cada columna de mes — "Por recaudar" | **Calculado** — "Proyectado" menos "Recaudado" de ese mismo mes |

## Fila de totales (al pie de la tabla)

| Campo | De dónde sale |
|---|---|
| Todas las columnas de arriba | **Calculado** — suma directa de esas mismas columnas (ya explicadas arriba, fila por fila), sobre TODOS los inmuebles que cumplen los filtros activos, no solo los de la página visible |
| Valor/cantidad de inmuebles "disponibles" (se reutiliza en Resumen) | **Calculado** — suma de "Valor del inmueble" (columna de arriba) y conteo, de los inmuebles cuyo estado en **Zoho — Inventario** NO es "Vendido" ni "VIP" |
| Valor/cantidad de inmuebles "vendidos" (se reutiliza en Resumen) | **Calculado** — igual, de los que SÍ tienen estado "Vendido" o "VIP" en **Zoho — Inventario** |

## Exportar a Excel

Descarga exactamente la tabla de pantalla (mismos colores), sobre el total filtrado completo, no
solo la página que se está viendo — no agrega ningún dato nuevo, es la misma información de las
columnas ya explicadas arriba.

---

# Módulo: Resumen Gerencial

## KPIs "Cuota inicial (30%)"

| Campo | De dónde sale |
|---|---|
| Totalidad del 30% | **Calculado** — para cada inmueble, se suman las cuotas de su plan de **Zoho — Negocios** que NO son la última fila de ese plan (Separación + cuotas mensuales = la Cuota Inicial; se deja afuera solo el Saldo Contraentrega), con el reemplazo por la columna "Cuota Inicial" de **Excel Fiducia — Movimientos** si aplica, igual que "Valor cuota inicial" del Dashboard; se suma esto sobre todos los inmuebles, solo contando las cuotas cuya fecha cae dentro del periodo elegido arriba (Último mes, Último semestre, etc.) |
| Recaudado del 30% | **Calculado** — para cada inmueble, la parte de los pagos de **Excel Fiducia — Mov_Por_Propietario** (columnas "Fecha Contable"/"Valor") que se aplicó a esas mismas cuotas de la Cuota Inicial (todas menos la última, que es el Saldo Contraentrega), sumada sobre el mismo periodo |
| Por recaudar (30%) | **Calculado** — "Totalidad del 30%" menos "Recaudado del 30%" (las dos filas de arriba) |
| Cuotas vencidas (30%) (actual) | **Calculado** — de las cuotas de **Zoho — Negocios** de la Cuota Inicial (las que no son la última fila del plan — el Saldo Contraentrega se excluye de este KPI), cuántas tienen fecha ya vencida y no están pagadas del todo (con pagos de **Excel Fiducia — Mov_Por_Propietario**), y cuánta plata les falta — siempre "a hoy", no cambia con el periodo elegido |

## KPIs "Saldo contraentrega (70%)"

| Campo | De dónde sale |
|---|---|
| Totalidad del 70% | **Calculado** — suma, sobre todos los inmuebles, del valor de la última cuota de su plan de **Zoho — Negocios** — es decir, del Saldo Contraentrega de cada uno, no de las demás cuotas — (ajustado a la columna "Valor Venta" de **Excel Fiducia — Movimientos**), contando solo las cuotas cuya fecha cae dentro del periodo elegido |
| Saldo recaudado contraentrega | **Calculado** — la parte de los pagos de **Excel Fiducia — Mov_Por_Propietario** que se aplicó específicamente a esa última cuota (el Saldo Contraentrega) de cada inmueble, dentro del periodo |
| Saldo pendiente contraentrega | **Calculado** — "Totalidad del 70%" menos "Saldo recaudado contraentrega" |

## KPIs "Inventario y ventas (actual)"

| Campo | De dónde sale |
|---|---|
| Inmuebles disponibles (actual) | **Calculado** — suma del "Valor del inmueble" (plan de **Zoho — Negocios**, ajustado con **Excel Fiducia — Movimientos**) y conteo, de los inmuebles cuyo estado en **Zoho — Inventario** NO es "Vendido" ni "VIP" — mismo cálculo que la fila de totales del Dashboard |
| Inmuebles vendidos (actual) | **Calculado** — igual, de los inmuebles cuyo estado en **Zoho — Inventario** SÍ es "Vendido" o "VIP" |

## Gráfico "Plan de pagos vs. Recaudo — tendencia"

| Campo | De dónde sale |
|---|---|
| La línea de Esperado / Recaudado | **Calculado** — por cada mes (o día, o quincena): "Esperado" = suma del valor de las cuotas de los planes de **Zoho — Negocios** cuya fecha cae en ese periodo; "Recaudado" = suma de los pagos de **Excel Fiducia — Mov_Por_Propietario** cuya "Fecha Contable" cae en ese periodo — sobre todos los inmuebles |
| "Recaudado en el año" (junto al título) | **Calculado** — la parte de "Recaudado" (de arriba) que cae dentro del año actual |
| "Separaciones este mes" | **Calculado** — cuenta los negocios de **Zoho — Negocios** cuyo campo "fecha de Pago de Separación" cae dentro del mes actual |

## Consolidado de Cartera por Etapa

Réplica calculada en vivo del Excel manual "CONSOLIDADO DE CARTERA". Cifras en miles de millones
de pesos. Agrupa por Etapa (la columna de texto proyecto+torre de **Zoho — Inventario**, traducida
con la tabla fija de "Antes de entrar a las tablas") en vez de por inmueble individual.

| Columna en pantalla | De dónde sale |
|---|---|
| Uni Totales | **Calculado** — cuenta los inmuebles de **Zoho — Inventario** cuya columna de texto proyecto+torre los ubica en esa etapa |
| Uni Vendidas (Fidu) | **Calculado** — de esos inmuebles, cuenta los que tienen un negocio cruzado en **Excel Fiducia — Movimientos** (por Referencia de Recaudo o Nomenclatura) cuya columna **"Estado"** sea PROMETIDO, OPCIONADO, VENDIDO o ESCRITURA_AUTORIZADA |
| Unidades Vendidas CRM | **Calculado** — de esos mismos inmuebles, cuenta los que tienen su campo de estado en **Zoho — Inventario** en Vendido, Reservado o Separado. *(Es un conteo distinto al anterior, a propósito: uno mira la columna "Estado" del negocio financiero del Excel, el otro el campo de estado del inmueble físico de Zoho — pueden no coincidir en número.)* |
| Unidades Disponible | **Calculado** — "Uni Totales" menos "Uni Vendidas (Fidu)" (las dos filas de arriba) |
| Valor Total Venta (Fidu+Disponibles) | **Calculado** — "Valor Total Ventas Fiduciaria" + "Valor($) Unidades Disponibles" (las dos filas siguientes, sumadas) |
| Valor Total Ventas Fiduciaria | **Calculado** — de los inmuebles "Uni Vendidas (Fidu)" de esta etapa, suma el valor de las cuotas de su plan de **Zoho — Negocios**, ajustado a la columna "Valor Venta" de **Excel Fiducia — Movimientos** (mismo cálculo de "Valor del inmueble" del Dashboard) |
| Valor Cuotas Iniciales | **Calculado** — de esos mismos inmuebles, suma el valor de las cuotas de su plan de **Zoho — Negocios** que NO son la última fila de ese plan (Separación + cuotas mensuales = Cuota Inicial; se deja afuera solo el Saldo Contraentrega, que es siempre la última fila), con el reemplazo por la columna "Cuota Inicial" de **Excel Fiducia — Movimientos** si aplica (mismo cálculo de "Valor cuota inicial" del Dashboard) |
| Valor($) Unidades Disponibles | **Calculado** — de los inmuebles de esta etapa que NO están en "Uni Vendidas (Fidu)", suma su "Valor del inmueble" (igual fórmula que la fila "Valor Total Ventas Fiduciaria", pero para los no vendidos) |
| Vr. Total Recaudado a la Fecha | **Calculado** — de los inmuebles "Uni Vendidas (Fidu)", suma TODOS sus pagos de **Excel Fiducia — Mov_Por_Propietario** (columnas "Fecha Contable"/"Valor", ya limpios de "GENERADO POR VENTA UNIDAD" y de lo anterior a un desistimiento) |
| % Recaudo / Ventas Fiduciaria | **Calculado** — "Vr. Total Recaudado a la Fecha" dividido entre "Valor Total Ventas Fiduciaria" (las dos filas de arriba) |
| % Recaudo / Cuota Inicial | **Calculado** — "Vr. Total Recaudado a la Fecha" dividido entre "Valor Cuotas Iniciales" |
| Cartera > 5 días | **Calculado** — de los inmuebles "Uni Vendidas (Fidu)" de esta etapa, suma la plata que les falta en las cuotas de la Cuota Inicial (las que no son la última fila del plan — el Saldo Contraentrega no entra acá) cuyo mayor atraso, contado desde su fecha esperada hasta hoy, supera 5 días |
| % Cartera > 5 días | **Calculado** — "Cartera > 5 días" dividido entre la suma del valor de todas las cuotas de la Cuota Inicial (las que no son la última fila del plan) de esos inmuebles cuya fecha ya pasó, estén pagadas o no |
| Pendiente por Recaudar Fiduciaria | **Calculado** — "Valor Total Ventas Fiduciaria" menos "Vr. Total Recaudado a la Fecha" |
| Cuotas Iniciales por Recaudar | **Calculado** — "Valor Cuotas Iniciales" menos "Vr. Total Recaudado a la Fecha" |
| Crédito por Recaudar | **Calculado** — "Pendiente por Recaudar Fiduciaria" menos "Cuotas Iniciales por Recaudar" (lo que queda, después de descontar la Cuota Inicial, es lo que falta del Saldo Contraentrega) |
| Fecha de Corte Info | **Calculado** — el momento exacto en que se hizo este cálculo (para el mes en curso), o la fecha guardada en el momento del cierre (para un mes ya cerrado) |

**Selector de mes**: los meses ya cerrados muestran una "foto" fija de esta misma tabla (con las
mismas fuentes de arriba), guardada en el momento del cierre — no cambia después aunque se
actualicen los datos de Zoho o se suba un Excel nuevo. El mes actual siempre se recalcula en vivo
cada vez que se abre la página. El cierre de mes es un botón manual, solo para administradores.

## Recaudo por Etapa del proyecto (gráfico colapsable)

| Campo | De dónde sale |
|---|---|
| Barras de Esperado/Recaudado por Etapa | **Calculado** — mismo cálculo del gráfico de tendencia de arriba ("Esperado" = plan de **Zoho — Negocios**, "Recaudado" = pagos de **Excel Fiducia — Mov_Por_Propietario**), pero agrupado por Etapa (columna de texto proyecto+torre de **Zoho — Inventario**, traducida con la tabla fija) en vez de por mes |

---

# Módulo: Cartera en Gestión

Toma los mismos cálculos ①②③④ y se queda solo con los inmuebles en mora. Tiene dos vistas:
**Cuota Inicial** (mora real de cobranza) y **Saldo Contraentrega** (el saldo final ya venció —
normalmente significa que aún no se ha escriturado, no necesariamente mora de cobranza).

## Filtro Trámite / Canje

| Campo | De dónde sale |
|---|---|
| "En trámite" | **Manual** — se marca a mano desde el menú clic-derecho de esta pantalla o de Dashboard; se guarda como una marca propia del sistema, no existe en el Excel ni en Zoho |
| "Canje" | **Manual**, igual — los negocios marcados como Canje se excluyen siempre de la vista normal (se cuentan aparte) |

## KPIs (solo vista Cuota Inicial)

| Campo | De dónde sale |
|---|---|
| Negocios en mora | **Calculado** — cuenta los inmuebles donde, al aplicar los pagos de **Excel Fiducia — Mov_Por_Propietario** al plan de **Zoho — Negocios**, al menos una cuota de la Cuota Inicial (las que no son la última fila del plan — la vista "Cuota Inicial" de esta pantalla nunca mira el Saldo Contraentrega) quedó con fecha vencida y sin pagar del todo |
| Cuotas en mora | **Calculado** — suma, de esos mismos inmuebles, cuántas cuotas quedaron en esa situación |
| Monto en mora | **Calculado** — suma de la plata que les falta a esas cuotas (valor de la cuota del plan de Zoho, menos lo que alcanzaron a cubrir los pagos del Excel) |
| % mora del portafolio | **Calculado** — "Monto en mora" dividido entre la suma del valor de TODAS las cuotas de la Cuota Inicial (las que no son la última fila del plan de **Zoho — Negocios** — el Saldo Contraentrega queda afuera) de esos mismos negocios cuya fecha ya pasó, estén pagadas o no |

*(Vista Saldo Contraentrega: un único mensaje de alerta con el conteo de inmuebles cuya última
cuota del plan de **Zoho — Negocios** está vencida, y la suma de lo que les falta por pagar según
**Excel Fiducia — Mov_Por_Propietario** — mismas fuentes de arriba, sin desglose en tarjetas ni
KPIs separados.)*

## Antigüedad de la mora (tarjetas, solo vista Cuota Inicial)

| Campo | De dónde sale |
|---|---|
| Rangos (1 a 5 días, 6 a 30, 31 a 60, 61 a 90, Más de 90) | **Calculado** — agrupa los negocios en mora según su mayor atraso en días (fecha esperada de la cuota, calculada del plan de **Zoho — Negocios**, contra la fecha de hoy) |
| Conteo y monto de cada tarjeta | **Calculado** — cuántos negocios caen en ese rango y cuánto suma su "Monto en mora" (ver KPI de arriba) |

## Top 10 — prioridad de gestión

| Campo | De dónde sale |
|---|---|
| Los 10 negocios listados | **Calculado** — los mismos negocios en mora de arriba, ordenados de mayor a menor por su atraso en días, respetando los filtros activos |

## Tabla Detalle — vista Cuota Inicial

| Columna | De dónde sale |
|---|---|
| Etapa / Frente/Torre | **Calculado** — columna de texto proyecto+torre de **Zoho — Inventario**, traducida con la tabla fija |
| Nomenclatura | **Zoho — Inventario** |
| Referencia | **Excel Fiducia — Movimientos**, columna "Referencia" |
| Comprador | **Excel Fiducia — Mov_Por_Propietario**, columna "Propietario" |
| Valor apartamento | **Calculado** — suma del valor de las cuotas del plan de **Zoho — Negocios**, ajustada a la columna "Valor Venta" de **Excel Fiducia — Movimientos** (mismo "Valor del inmueble" del Dashboard) |
| Cuotas mora | **Calculado** — de ese negocio, cuántas cuotas de la Cuota Inicial (las que no son la última fila del plan — el Saldo Contraentrega no entra en esta vista) tienen fecha vencida y no están pagadas del todo |
| Días atraso | **Calculado** — el mayor atraso en días entre esas cuotas |
| Valor vencido | **Calculado** — la plata que les falta a esas cuotas |
| % en mora | **Calculado** — "Valor vencido" de ese negocio dividido entre la suma del valor de todas sus cuotas de la Cuota Inicial (las que no son la última fila del plan) cuya fecha ya pasó — mismo concepto que "% mora del portafolio", pero calculado para un solo negocio |

## Tabla Detalle — vista Saldo Contraentrega

| Columna | De dónde sale |
|---|---|
| Frente/Torre / Nomenclatura | **Zoho — Inventario** |
| Referencia | **Excel Fiducia — Movimientos**, columna "Referencia" |
| Comprador | **Excel Fiducia — Mov_Por_Propietario**, columna "Propietario" |
| Fecha vencida | **Calculado** — fecha esperada de la última cuota del plan de **Zoho — Negocios** — es decir, del Saldo Contraentrega (esta vista, a diferencia de la de Cuota Inicial, solo mira esa última cuota, ninguna de las anteriores) —, reemplazada por la fecha de **Configuración** (Ajustes → Fechas de entrega) si existe para ese piso/torre/proyecto |
| Valor pendiente | **Calculado** — valor de esa última cuota, el Saldo Contraentrega (ajustado a la columna "Valor Venta" de **Excel Fiducia — Movimientos**), menos lo que le alcanzaron a pagar los movimientos de **Excel Fiducia — Mov_Por_Propietario** |

Clic derecho sobre cualquier fila: abrir el negocio / el inmueble / la oportunidad de Zoho, y
marcar/quitar "en trámite" o "canje" (**Manual**, guardado como marca propia del sistema).

---

# Exclusiones — columnas y registros que el sistema descarta a propósito

Estas nunca van a aparecer en ninguna pantalla, aunque estén en el archivo o sistema original:

**Columnas del Excel, hoja "Movimientos"** (se leen pero se descartan siempre, en el momento de
subir el archivo): Canje, Subsidio, Descuentos, Valor Acreditación, Movimiento Posterior, Fecha
Autoriz. Escritura, Matrícula Inmobiliaria, Valor Escritura, Observaciones, Fecha Factura, Número
Factura, Número Escritura Pública, Notaría, Fecha Envío Contabilidad.

**Columna del Excel, hoja "Mov_Por_Propietario"**: Sucursal.

**Tipo de movimiento que nunca cuenta como plata real** (columna "Tipo Movimiento" de **Excel
Fiducia — Mov_Por_Propietario**): "GENERADO POR VENTA UNIDAD".

**Inmuebles excluidos de todo el sistema**: la torre "Vela Village - Torre 2" (de **Zoho —
Inventario**), y cualquier inmueble cuyo nombre en **Zoho — Inventario** empiece con asterisco
(`*`) — convención del equipo para marcar un registro duplicado o dado de baja.

**Negocios que nunca entran al sistema**: un negocio de **Zoho — Negocios** sin su campo "fecha
de Pago de Separación" registrado.
