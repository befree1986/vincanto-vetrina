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
          // (Rimosso chunk analytics vuoto non referenziato per alleggerire bundle)
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
    proxy: (() => {
      // Usa l'API di produzione in dev se USE_PROD_API=true
      const useProd = process.env.USE_PROD_API === 'true';
      const target = useProd
        ? 'https://vincanto-vetrina.vercel.app'
        : 'http://localhost:3000';
      return {
        // Proxy generico: tutte le chiamate /api/*
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
        },
        // Health per comodità
        '/health': {
          target,
          changeOrigin: true,
          secure: false,
        }
      };
    })()
  }
});
