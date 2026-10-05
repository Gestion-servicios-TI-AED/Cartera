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

Baía Kristal sigue recibiendo movimientos hasta el corte, así que la copia es una foto del momento. Ambos scripts se pueden repetir sin duplicar:

```bash
node scripts/importarDatosLegado.js                       # (PG* = destino) trae lo nuevo de Baía Kristal
node scripts/migracion/copiarDesdeV2.js --actualizar      # (PG* = origen v2) actualiza Oliv y tablas solo-v2
node scripts/migracion/copiarDesdeV2.js --verificar       # compara conteos
```

Después del corte: apunta el `.env`/variables del despliegue a la base nueva y **invalida/reinicia** el servidor (el cálculo de cartera vive en memoria).

> El resumen mensual (`resumen_cartera_mensual`) trae los meses guardados en la base legada; si la v2 guardó meses más recientes, hay que copiarlos aparte.
