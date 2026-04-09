import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard, Students, Classes, Financial, PDV, Settings, Login, ForgotPassword, ResetPassword } from './pages';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function LoadingScreen() {
  return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Carregando...</div>;
}

function PrivateRoute() {
  const { session, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return session ? <Outlet /> : <Navigate to="/login" replace />;
}

function AdminOrSecretaryRoute() {
  const { session, role, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;
  if (role !== 'admin' && role !== 'secretary') return <Navigate to="/" replace />;
  return <Outlet />;
}

function AdminRoute() {
  const { session, role, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;
  if (role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route path="/classes" element={<Classes />} />

              <Route element={<AdminOrSecretaryRoute />}>
                <Route path="/financial" element={<Financial />} />
                <Route path="/pdv" element={<PDV />} />
              </Route>

              <Route element={<AdminRoute />}>
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
