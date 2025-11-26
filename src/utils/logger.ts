// utils/logger.ts
// Logger condizionale: evita rumore in produzione. Imposta window.__VINCANTO_SILENT__ = true per silenziare anche in DEV.
export const log = (...args: any[]) => {
  if (typeof window !== 'undefined') {
    // In produzione NON loggare (import.meta.env.DEV true solo in dev)
    if (import.meta.env.DEV && !(window as any).__VINCANTO_SILENT__) {
      console.log(...args);
    }
  }
};

export const warn = (...args: any[]) => {
  if (import.meta.env.DEV && !(window as any).__VINCANTO_SILENT__) {
    console.warn(...args);
  }
};

export const error = (...args: any[]) => {
  // Gli errori si mostrano sempre in DEV; in produzione si può decidere se inviarli a un sistema di tracking.
  if (import.meta.env.DEV) {
    console.error(...args);
  }
};