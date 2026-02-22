import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { PresenceProvider } from './context/PresenceContext';
import { CallProvider } from './context/CallContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Helper to show error on screen if React fails to mount
const showFatalError = (err: any) => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="background: #1a0000; color: #ff4d4d; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: monospace; padding: 20px; text-align: center;">
        <h1 style="margin-bottom: 20px;">CRITICAL MOUNT ERROR</h1>
        <pre style="background: #000; padding: 20px; border-radius: 8px; max-width: 100%; overflow: auto; border: 1px solid #ff007f;">${err.message || err}</pre>
        <p style="margin-top: 20px; color: #888;">Check Browser Console for more details</p>
      </div>
    `;
  }
};

window.onerror = (message, source, lineno, colno, error) => {
  console.error('GLOBAL ERROR:', { message, source, lineno, colno, error });
  showFatalError(error || message);
};

window.onunhandledrejection = (event) => {
  console.error('UNHANDLED REJECTION:', event.reason);
  showFatalError(event.reason);
};

console.log('App starting...', {
  env: import.meta.env.MODE,
  apiUrl: import.meta.env.VITE_API_URL,
  supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("CRITICAL: Could not find root element to mount to");
  throw new Error("Could not find root element to mount to");
}

try {
  console.log('Mounting React root...');
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <PresenceProvider>
              <CallProvider>
                <ToastProvider>
                  <NotificationProvider>
                    <App />
                  </NotificationProvider>
                </ToastProvider>
              </CallProvider>
            </PresenceProvider>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );

  console.log('React root rendered successfully');
} catch (err) {
  console.error('Mounting failed:', err);
  showFatalError(err);
}

// Register Service Worker for PWA support (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
