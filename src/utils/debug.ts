// Debug utility per controllare i log in produzione
// Utilizzare questa utility invece di console.log diretto

const isDevelopment = import.meta.env.DEV || import.meta.env.NODE_ENV === 'development';

export const debugLog = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Gli errori li mostriamo sempre per il debug critico
    console.error(...args);
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

// Versione più compatta per retrocompatibilità
export const devLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

export const devError = (...args: any[]) => {
  console.error(...args); // Errori sempre visibili
};

export { isDevelopment };