import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // React e DOM
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Librerie UI e icone
          'vendor-ui': ['lucide-react', 'react-icons'],
          // Internazionalizzazione
          'vendor-i18n': ['i18next', 'react-i18next'],
          // Stripe e pagamenti
          'vendor-payments': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          // Utilities e data
          'vendor-utils': ['axios', 'date-fns'],
          // Analytics e monitoring
          'vendor-analytics': ['@vercel/analytics', '@vercel/speed-insights'],
        },
        // Ottimizza la generazione dei nomi dei chunk
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '') || 'chunk'
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        }
      }
    }
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
