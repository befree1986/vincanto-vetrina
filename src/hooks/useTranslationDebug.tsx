// src/hooks/useTranslationDebug.ts
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useTranslationDebug = (keys: string[], componentName: string) => {
  const { t } = useTranslation();

  useEffect(() => {
    keys.forEach((key) => {
      const value = t(key);
      if (value === key) {
        console.warn(`🔴 [${componentName}] Missing translation key: ${key}`);
      }
    });
  }, [t, keys, componentName]);
};