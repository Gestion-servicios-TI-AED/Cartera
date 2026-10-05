#!/bin/bash
set -e

cd /app/backend

# Migraciones pendientes (sequelize-cli, trackeadas en "SequelizeMeta"; es
# idempotente: en una base ya migrada no hace nada). NUNCA se corre db:seed aqui:
# el admin inicial se crea una sola vez a mano (ver README.md, "Primer despliegue").
npx sequelize-cli db:migrate

exec node src/server.js
