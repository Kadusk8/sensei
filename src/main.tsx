import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'

const App = lazy(() => import('./App.tsx'));

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<div className="text-white p-10">Carregando Sistema...</div>}>
        <App />
        <Toaster theme="dark" position="top-right" richColors />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
)
