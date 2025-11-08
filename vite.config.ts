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
  // 🔧 PROXY CONFIGURATION - API UNIFICATA (Consolidamento completo)
  server: {
    proxy: {
      // 🎯 API UNIFICATA - Tutte le chiamate API vanno alla stessa destinazione
      '/api/unified': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      
      // 🔄 BACKWARD COMPATIBILITY - Redirect automatico verso API unificata
      '/api/pricing': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace('/api/pricing', '/api/unified?action=pricing')
      },
      '/api/booking': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace('/api/booking', '/api/unified?action=booking')
      },
      '/api/admin': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace('/api/admin', '/api/unified?action=settings')
      },
      '/api/quote': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace('/api/quote', '/api/unified?action=quote')
      },
      '/api/utilities': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace('/api/utilities', '/api/unified?action=sync-calendars')
      },
      
      // 🏥 Health check endpoint
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
      
      // ✅ CONSOLIDAMENTO: 5 API → 1 API unificata con routing intelligente
    }
  }
});
