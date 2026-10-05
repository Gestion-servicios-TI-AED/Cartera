import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Por defecto '/' (app standalone). Si se despliega detras de un gateway de
  // ruteo por path (ver "0. PLATAFORMA AED"), se pasa VITE_BASE_PATH="/cartera/"
  // como build-arg para que Vite incruste los assets con ese prefijo.
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    port: 5183,
    proxy: {
      '/api': {
        target: 'http://localhost:3011',
        changeOrigin: true,
      },
    },
  },
});
