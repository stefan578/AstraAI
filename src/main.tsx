import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AstraAI render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '24px',
            fontFamily: 'system-ui, sans-serif',
            background: '#fafafa',
            color: '#222',
          }}
        >
          <section style={{ maxWidth: 520, textAlign: 'center' }}>
            <h1>AstraAI nije mogao da se pokrene</h1>
            <p style={{ color: '#666' }}>
              Došlo je do greške pri učitavanju aplikacije.
            </p>
            {this.state.error && (
              <pre
                style={{
                  marginTop: 16,
                  padding: 16,
                  overflow: 'auto',
                  textAlign: 'left',
                  whiteSpace: 'pre-wrap',
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: 12,
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                marginTop: 16,
                padding: '10px 16px',
                border: 0,
                borderRadius: 10,
                background: '#4f46e5',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Osveži stranicu
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('AstraAI: #root element nije pronađen.');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Remove the old AstraAI service worker.
// The previous worker cached "/" and could keep an outdated blank app shell
// after a new Netlify deployment.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => {
          void registration.unregister();
        });
      })
      .catch((error) => {
        console.warn('Could not unregister old service worker:', error);
      });
  });
}
