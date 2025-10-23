import React from 'react';

interface CookieToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

const CookieToggle: React.FC<CookieToggleProps> = ({ label, checked, onChange }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange();
    }
  };

  return (
    <div
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={onChange}
      onKeyDown={handleKeyDown}
      className={`cookie-toggle ${checked ? 'on' : 'off'}`}
    >
      <span>{label}</span>
    </div>
  );
};

export default CookieToggle;