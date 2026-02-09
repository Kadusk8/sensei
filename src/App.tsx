// import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard, Students, Classes, Financial, PDV, Settings, Login } from './pages';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function PrivateRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Carregando...</div>;
  }

  return session ? <Outlet /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route path="/classes" element={<Classes />} />
              <Route path="/financial" element={<Financial />} />
              <Route path="/pdv" element={<PDV />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
