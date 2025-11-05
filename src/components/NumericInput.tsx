import React from 'react';
import { useNumericInput } from '../hooks/useNumericInput';

interface NumericInputProps {
  id?: string;
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  suffix?: string; // Per aggiungere €, %, etc.
}

/**
 * Componente di input numerico migliorato che risolve i problemi di editing
 * - Non si blocca sullo 0
 * - Permette editing temporaneo di valori vuoti
 * - Applica automaticamente min/max al blur
 * - Supporta suffissi visivi (€, %, etc.)
 */
const NumericInput: React.FC<NumericInputProps> = ({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  placeholder,
  className = 'admin-input-small',
  disabled = false,
  required = false,
  suffix
}) => {
  const numericInput = useNumericInput({
    initialValue: value,
    min,
    max,
    step,
    allowEmpty: true
  });

  // Sincronizza il valore esterno con il componente
  React.useEffect(() => {
    if (value !== numericInput.numericValue) {
      onChange(numericInput.numericValue);
    }
  }, [numericInput.numericValue, onChange]);

  // Aggiorna il componente quando il valore esterno cambia
  React.useEffect(() => {
    if (value !== numericInput.numericValue && !isNaN(value)) {
      numericInput.handleChange(value.toString());
    }
  }, [value]);

  return (
    <div className="numeric-input-container">
      {label && (
        <label htmlFor={id} className="admin-label">
          {label}
          {required && <span className="required-asterisk"> *</span>}
        </label>
      )}
      <div className="input-wrapper">
        <input
          {...numericInput.inputProps}
          id={id}
          placeholder={placeholder}
          className={`${className} ${disabled ? 'disabled' : ''}`}
          disabled={disabled}
          required={required}
        />
        {suffix && (
          <span className="input-suffix">{suffix}</span>
        )}
      </div>
      {min !== undefined && max !== Infinity && (
        <small className="input-hint">
          Range: {min} - {max}
        </small>
      )}
    </div>
  );
};

export default NumericInput;