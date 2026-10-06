import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './app/App';
import { AuthProvider } from './core/auth';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles.css';
import './theme/styles/global.css';
import { ThemeProvider } from './theme/theme.provider';
import { applyTheme, readTheme } from './theme/theme.utils';

// Apply stored tokens before React mounts, including its loading/error states.
applyTheme(readTheme());
const client = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false, staleTime: 30_000 },
    mutations: { retry: false },
  },
});
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <QueryClientProvider client={client}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>,
);
