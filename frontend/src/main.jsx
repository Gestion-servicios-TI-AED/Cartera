import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import App from './App.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { AvisoErrores } from './components/AvisoErrores.jsx';
// Inter alojada en el proyecto (sin Google Fonts): variable, eje de peso 100-900.
import '@fontsource-variable/inter';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* import.meta.env.BASE_URL refleja el `base` de vite.config.js (VITE_BASE_PATH). */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
        <AvisoErrores />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
