# Migración a una base de datos nueva (2026-10-05)

Pasa los datos de Cartera a una base PostgreSQL nueva (`DESTINO_DATABASE_URL` en `backend/.env`, que está ignorado por git).

## Fuentes

| Datos | Fuente | Script |
|---|---|---|
| **Baía Kristal con movimientos diarios**: negocios, compradores, movimientos de negocio, encargos, hojas, movimientos fiduciarios, resumen mensual, configuración de fechas | Base **legada** `postgres` (`LEGACY_DATABASE_URL`) — la confiable para Baía Kristal | `scripts/importarDatosLegado.js` (upsert por clave natural / `legacy_id`; repetible) |
| **Todo Oliv** (`oliv_*`) | Base `cartera_aed_v2` (`PG*`) — la confiable para Oliv | `scripts/migracion/copiarDesdeV2.js` |
| **Solo existe en la v2**: usuarios, roles, auditoría, inventario, oportunidades y otrosíes de Baía Kristal, logs de sincronización, metadatos de Zoho | Base `cartera_aed_v2` | `scripts/migracion/copiarDesdeV2.js` |

Las bases de origen se leen **solo en lectura** (el script de la v2 fuerza `default_transaction_read_only`; el legado nunca recibe INSERT/UPDATE/DELETE). Solo se escribe en el destino.

## Pasos (primera vez)

```bash
# 0. variables del destino como PG* (el script legado y sequelize-cli las leen de PG*)
export PGHOST=... PGPORT=... PGUSER=... PGPASSWORD=... PGDATABASE=...   # = DESTINO_DATABASE_URL

# 1. esquema: aplica TODAS las migraciones sobre la base vacía
NODE_ENV=production npx sequelize-cli db:migrate

# 2. Baía Kristal desde la legada (con PG* apuntando al destino)
node scripts/importarDatosLegado.js

# 3. Oliv y tablas solo-v2 (usa PG* original como ORIGEN: ejecútalo en una terminal SIN las variables del paso 0)
node scripts/migracion/copiarDesdeV2.js
```

## Pasada final (el día del cambio)

Baía Kristal sigue recibiendo movimientos hasta el corte, así que la copia es una foto del momento.
Re-subir una hoja en la legada **borra y recrea todas sus filas** (con ids nuevos), por eso la pasada
final no puede ser solo "agregar lo nuevo", y recorrer los 3 M de movimientos tarda ~2 h. Se hace **por hoja**
y toma minutos. Con `PG*` apuntando al **DESTINO** (como en el paso 0):

```bash
# 1. tablas chicas al día (encargos, hojas, negocios, compradores, mov. de negocio, resumen); NO toca los movimientos fiduciarios
node scripts/importarDatosLegado.js --sin-movimientos

# 2. movimientos fiduciarios: compara por hoja (cantidad + última fecha) y re-copia solo las hojas que cambiaron
node scripts/migracion/pasadaFinalMovimientos.js            # SIMULACRO: solo lectura, dice qué cambió (~15 s)
node scripts/migracion/pasadaFinalMovimientos.js --aplicar  # aplica; cada hoja va en su transacción

# 3. Oliv y tablas solo-v2 (con las variables PG* ORIGINALES de la v2, en otra terminal)
node scripts/migracion/copiarDesdeV2.js --actualizar
node scripts/migracion/copiarDesdeV2.js --verificar          # compara conteos
```

Después del corte: apunta las variables del despliegue a la base nueva y **reinicia** el servidor (el cálculo de cartera vive en memoria).
Si el simulacro muestra "hojas nuevas", corre antes el paso 1. Probado (2026-10-05): se borró una fila de una hoja del
destino, el simulacro la detectó (1 hoja distinta de 1.285), `--aplicar` la reparó y el total volvió a 3.089.180.

> El resumen mensual (`resumen_cartera_mensual`) trae los meses guardados en la base legada; si la v2 guardó meses más recientes, hay que copiarlos aparte.
