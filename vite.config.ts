import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // 🔧 PROXY CONFIGURATION - Routing API unificato per sviluppo
  server: {
    proxy: {
      // Express backend locale (pricing, booking core)
      '/api/pricing': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/api/booking': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      // Altri endpoint Express se necessari
      '/api/calendar': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      // 💳 Stripe payment endpoints
      '/api/stripe': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      // 🎛️ Admin panel endpoints (migrati da Vercel a Express)
      '/api/admin': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
      // Architettura ora UNIFICATA: tutte le API gestite da Express locale
    }
  }
});
