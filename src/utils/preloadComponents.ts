// utils/preloadComponents.ts
/**
 * Utility per il preload intelligente dei componenti lazy
 */

let adminPanelPreloaded = false;

export const preloadAdminPanel = async () => {
  if (!adminPanelPreloaded) {
    adminPanelPreloaded = true;
    return import('../pages/AdminPanelPro');
  }
};

// BookingSystem non più precaricato: import diretto elimina duplicazioni/warning

export const preloadOAuthCallback = async () => {
  return import('../pages/OAuthCallback');
};

// Preload basato su interazioni utente
export const handleMouseEnterAdmin = () => {
  // Preload quando l'utente passa il mouse su link admin
  preloadAdminPanel();
};

// Rimosso handler mouse per booking (non necessario)

// Preload intelligente basato su viewport
export const setupIntelligentPreload = () => {
  // Preload AdminPanel se siamo già vicini al 30% della pagina
  const onScroll = () => {
    const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    
    // Se l'utente è molto attivo (scroll veloce), preload Admin
    if (scrollPercent > 70) {
      preloadAdminPanel();
    }
  };
  
  let ticking = false;
  const scrollHandler = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
      ticking = true;
    }
  };
  
  window.addEventListener('scroll', scrollHandler, { passive: true });
  
  return () => window.removeEventListener('scroll', scrollHandler);
};

// Preload su idle
export const preloadOnIdle = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadAdminPanel();
    });
  } else {
    // Fallback per browser che non supportano requestIdleCallback
    setTimeout(preloadAdminPanel, 2000);
  }
};