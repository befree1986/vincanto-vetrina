import { useState, useCallback } from 'react';

interface UseNumericInputOptions {
  initialValue: number;
  min?: number;
  max?: number;
  step?: number;
  allowEmpty?: boolean;
}

/**
 * Hook personalizzato per gestire input numerici con comportamento migliorato
 * Risolve il problema di input che si bloccano su 0 quando vengono cancellati
 */
export const useNumericInput = ({
  initialValue,
  min = 0,
  max = Infinity,
  step = 1,
  allowEmpty = true
}: UseNumericInputOptions) => {
  const [value, setValue] = useState<string>(initialValue.toString());
  const [numericValue, setNumericValue] = useState<number>(initialValue);

  const handleChange = useCallback((inputValue: string) => {
    // Permetti valori vuoti temporaneamente
    if (inputValue === '' || inputValue === '-') {
      if (allowEmpty) {
        setValue(inputValue);
        return;
      }
    }

    // Controlla se è un numero valido
    const parsed = parseFloat(inputValue);
    
    if (!isNaN(parsed)) {
      // Applica limiti min/max
      const clamped = Math.max(min, Math.min(max, parsed));
      setValue(inputValue); // Mantieni l'input dell'utente per l'editing
      setNumericValue(clamped);
    }
  }, [min, max, allowEmpty]);

  const handleBlur = useCallback(() => {
    // Quando l'utente esce dal campo, assicurati che ci sia un valore valido
    if (value === '' || isNaN(parseFloat(value))) {
      const defaultValue = Math.max(min, initialValue);
      setValue(defaultValue.toString());
      setNumericValue(defaultValue);
    } else {
      const parsed = parseFloat(value);
      const clamped = Math.max(min, Math.min(max, parsed));
      setValue(clamped.toString());
      setNumericValue(clamped);
    }
  }, [value, min, max, initialValue]);

  const reset = useCallback(() => {
    setValue(initialValue.toString());
    setNumericValue(initialValue);
  }, [initialValue]);

  return {
    value,
    numericValue,
    handleChange,
    handleBlur,
    reset,
    inputProps: {
      type: 'number' as const,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value),
      onBlur: handleBlur,
      min,
      max,
      step
    }
  };
};

export default useNumericInput;