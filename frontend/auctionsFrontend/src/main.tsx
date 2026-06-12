import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '@/store';

/* Styles */
import '@/styles/globals.css';
import '@/styles/theme.css';

/* i18n — must be imported before any component that uses useTranslation */
import '@/i18n';

import App from './App';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found in DOM');

createRoot(rootEl).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
