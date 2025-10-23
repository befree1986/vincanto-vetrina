import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { CookieProvider } from './components/CookieContext';
import './i18n';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <CookieProvider>
      <App />
    </CookieProvider>
    </BrowserRouter>
  </StrictMode>
);
