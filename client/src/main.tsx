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

// Global Error Logging for Production Debugging
window.onerror = (message, source, lineno, colno, error) => {
  console.error('GLOBAL ERROR:', { message, source, lineno, colno, error });
  // You could also send this to a service like Sentry
};

window.onunhandledrejection = (event) => {
  console.error('UNHANDLED REJECTION:', event.reason);
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
