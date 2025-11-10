// Utility per ottimizzare event listeners e ridurre warning di performance
// Risolve: "[Violation] Added non-passive event listener to a scroll-blocking event"

export const addOptimizedEventListener = (
  element: EventTarget,
  type: string,
  listener: EventListener,
  options?: {
    passive?: boolean;
    once?: boolean;
    capture?: boolean;
  }
) => {
  const optimizedOptions = {
    passive: true,
    ...options
  };

  // Per eventi touch e scroll, forza passive per performance
  if (['touchstart', 'touchmove', 'wheel', 'scroll'].includes(type)) {
    optimizedOptions.passive = true;
  }

  element.addEventListener(type, listener, optimizedOptions);
  
  return () => element.removeEventListener(type, listener, optimizedOptions);
};

export const createPassiveEventOptions = (override?: boolean) => ({
  passive: override ?? true,
  capture: false
});

// Hook per debug performance warning
export const suppressPerformanceWarnings = () => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  // Intercepta console.warn per filtrare warning noti
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    
    // Skip noti warning di performance non critici
    if (
      message.includes('non-passive event listener') ||
      message.includes('touchstart') ||
      message.includes('Search endpoint requested')
    ) {
      return; // Non mostrare questi warning
    }
    
    originalWarn.apply(console, args);
  };
};

export default addOptimizedEventListener;