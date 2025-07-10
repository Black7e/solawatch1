// Import polyfills first for Safari compatibility
import './polyfills';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import React from 'react';
import App from './App.tsx';
import './index.css';

// Polyfill for Safari compatibility
if (typeof BigInt === 'undefined') {
  (window as any).BigInt = function(value: any) {
    throw new Error('BigInt is not supported in this browser');
  };
}

// Add error boundary and better mobile support
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Error caught by boundary:', event.error);
      setError(event.error);
      setHasError(true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Promise rejection caught by boundary:', event.reason);
      setError(new Error(String(event.reason)));
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#111827',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '400px',
          color: 'white'
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}>
            Something went wrong
          </h1>
          <p style={{
            color: '#9CA3AF',
            marginBottom: '1rem'
          }}>
            {error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => {
              setHasError(false);
              setError(null);
              window.location.reload();
            }}
            style={{
              background: '#7C3AED',
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Ensure DOM is ready before rendering
function initializeApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Fallback rendering for Safari
    rootElement.innerHTML = `
      <div style="min-height: 100vh; background: #111827; display: flex; align-items: center; justify-content: center; padding: 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="text-align: center; max-width: 400px;">
          <h1 style="color: white; font-size: 1.5rem; margin-bottom: 1rem;">Loading Error</h1>
          <p style="color: #9CA3AF; margin-bottom: 1rem;">Failed to load the application. Please refresh the page.</p>
          <button onclick="window.location.reload()" style="background: #7C3AED; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 1rem;">
            Refresh Page
          </button>
        </div>
      </div>
    `;
  }
}

// Initialize when DOM is ready - Safari compatible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // Use setTimeout to ensure Safari has finished loading
  setTimeout(initializeApp, 0);
}