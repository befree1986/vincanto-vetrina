import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { CookieProvider } from './components/CookieContext';
import './i18n';

// 🔒 Proteggi da errori DOM causati da script di Vercel Analytics
if (typeof window !== 'undefined') {
  const originalSelectNode = (Range as any).prototype?.selectNode;
  if (originalSelectNode) {
    (Range as any).prototype.selectNode = function(node: Node) {
      try {
        // Controlla che il nodo abbia effettivamente un genitore
        if (!node.parentNode) {
          console.warn('⚠️ selectNode: Tentativo di selezionare nodo orfano, skip');
          return this;
        }
        return originalSelectNode.call(this, node);
      } catch (error) {
        console.warn('⚠️ selectNode error (Vercel Analytics?):', error);
        return this;
      }
    };
  }

  // Intercetta gli errori globali non gestiti
  window.addEventListener('error', (event) => {
    if (event.message?.includes('InvalidNodeTypeError') || 
        event.message?.includes('selectNode')) {
      console.warn('⚠️ Vercel Analytics DOM error suppressed:', event.error);
      event.preventDefault();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <CookieProvider>
      <App />
    </CookieProvider>
    </BrowserRouter>
  </StrictMode>
);
