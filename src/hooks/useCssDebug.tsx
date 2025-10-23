import { useEffect } from 'react';

export const useCssDebug = (
  classNames: string[],
  componentName: string,
  cssVariables?: string[],
  checkDarkTheme: boolean = false
) => {
  useEffect(() => {
    console.groupCollapsed(`🧪 CSS Debug: ${componentName}`);

    // Verifica classi nel DOM
    classNames.forEach((className) => {
      const exists = document.querySelector(`.${className}`);
      if (exists) {
        console.log(`✅ .${className} found in DOM`);
      } else {
        console.warn(`❌ .${className} NOT found in DOM`);
      }
    });

    // Verifica variabili CSS
    if (cssVariables && cssVariables.length > 0) {
      console.groupCollapsed('🎨 CSS Variables');
      cssVariables.forEach((variable) => {
        const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
        if (value) {
          console.log(`✅ ${variable}: ${value}`);
        } else {
          console.warn(`❌ ${variable} is NOT defined`);
        }
      });
      console.groupEnd();
    }

    // Verifica modalità scura
    if (checkDarkTheme) {
      const isDark = document.body.classList.contains('dark-theme');
      console.log(`🌙 Dark theme is ${isDark ? 'ACTIVE ✅' : 'INACTIVE ❌'}`);

      if (cssVariables && cssVariables.length > 0 && isDark) {
        console.groupCollapsed('🌙 Dark Theme Overrides');
        cssVariables.forEach((variable) => {
          const value = getComputedStyle(document.body).getPropertyValue(variable).trim();
          if (value) {
            console.log(`🌙 ${variable} override: ${value}`);
          } else {
            console.warn(`🌙 ${variable} has NO override`);
          }
        });
        console.groupEnd();
      }
    }

    console.groupEnd();
  }, [classNames, componentName, cssVariables, checkDarkTheme]);
};