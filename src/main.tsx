import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx' 
import { ErrorBoundary } from './components/ErrorBoundary'

// Lazy load App to catch import errors
const App = lazy(() => import('./App.tsx'));

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<div className="text-white p-10">Carregando Sistema...</div>}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
)
