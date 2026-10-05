# syntax=docker/dockerfile:1

# ---------- Stage 1: build frontend (Vite) ----------
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
# Vite incrusta las env VITE_* en el build en tiempo de COMPILACION, no de
# arranque -- a diferencia de PGHOST/JWT_SECRET/etc (backend, leidas recien
# al arrancar el proceso), estas SI hay que pasarlas como --build-arg al
# construir la imagen para el dominio real de cada despliegue:
#   docker build --build-arg VITE_API_BASE_URL=https://cartera.tudominio.com/api .
# El backend sirve el frontend bajo el mismo origen (ver backend/src/app.js), asi
# que en la mayoria de despliegues el valor real es "<https://tu-dominio>/api".
ARG VITE_API_BASE_URL=http://localhost:3000/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
# Solo hace falta si la app se sirve bajo un subpath detras de un gateway de
# ruteo por path (ver "0. PLATAFORMA AED") -- ej. --build-arg VITE_BASE_PATH=/cartera/
# (y en ese caso VITE_API_BASE_URL=/cartera/api). Standalone (default, vacio)
# Vite usa "/" como siempre.
ARG VITE_BASE_PATH=
ENV VITE_BASE_PATH=${VITE_BASE_PATH}
RUN npm run build

# ---------- Stage 2: dependencias del backend (sin devDependencies) ----------
FROM node:20-slim AS backend-deps
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev

# ---------- Stage final: imagen de ejecucion ----------
FROM node:20-slim
WORKDIR /app

COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
