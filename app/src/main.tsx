import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { applyThemeCss } from './lib/library';
import './styles/ds-tokens.css';
import './styles/app.css';
import App from './App';

applyThemeCss();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
