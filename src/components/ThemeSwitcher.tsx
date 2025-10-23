import React, { useEffect, useState } from 'react';

const ThemeSwitcher: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('preferred-theme');
    if (stored === 'dark') {
      setDarkMode(true);
      document.body.classList.add('dark-theme');
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('preferred-theme', 'light');
    } else {
      document.body.classList.add('dark-theme');
      localStorage.setItem('preferred-theme', 'dark');
    }
    setDarkMode(!darkMode);
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="theme-switcher-button"
    >
      {darkMode ? '🌞' : '🌙'}
    </button>
  );
};

export default ThemeSwitcher;