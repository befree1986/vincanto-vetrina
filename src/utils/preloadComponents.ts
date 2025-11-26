// utils/preloadComponents.ts
/**
 * Utility per il preload intelligente dei componenti lazy
 */

let adminPanelPreloaded = false;
let bookingSystemPreloaded = false;

export const preloadAdminPanel = async () => {
  if (!adminPanelPreloaded) {
    adminPanelPreloaded = true;
    return import('../pages/AdminPanelPro');
  }
};

export const preloadBookingSystem = async () => {
  if (!bookingSystemPreloaded) {
    bookingSystemPreloaded = true;
    return import('../components/BookingSystem');
  }
};

export const preloadOAuthCallback = async () => {
  return import('../pages/OAuthCallback');
};

// Preload basato su interazioni utente
export const handleMouseEnterAdmin = () => {
  // Preload quando l'utente passa il mouse su link admin
  preloadAdminPanel();
};

export const handleMouseEnterBooking = () => {
  // Preload quando l'utente naviga verso la sezione booking
  preloadBookingSystem();
};

// Preload intelligente basato su viewport
export const setupIntelligentPreload = () => {
  // Preload AdminPanel se siamo già vicini al 30% della pagina
  const onScroll = () => {
    const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    
    if (scrollPercent > 30 && !bookingSystemPreloaded) {
      preloadBookingSystem();
    }
    
    // Se l'utente è molto attivo (scroll veloce), preload tutto
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
      preloadBookingSystem();
    });
    
    requestIdleCallback(() => {
      preloadAdminPanel();
    }, { timeout: 5000 });
  } else {
    // Fallback per browser che non supportano requestIdleCallback
    setTimeout(preloadBookingSystem, 2000);
    setTimeout(preloadAdminPanel, 4000);
  }
};