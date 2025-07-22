import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Bots from './pages/Bots';
import './App.css';

// Componente para proteger rotas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Componente para redirecionar usuários autenticados
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" /> : children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rotas públicas */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />

          {/* Rotas protegidas */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } 
          />

          {/* Placeholder para outras rotas protegidas */}
          <Route 
            path="/bots" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Bots />
                </Layout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/messages" 
            element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center py-20">
                    <h2 className="text-2xl font-bold mb-4">Página de Mensagens</h2>
                    <p className="text-muted-foreground">Em desenvolvimento...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center py-20">
                    <h2 className="text-2xl font-bold mb-4">Página de Relatórios</h2>
                    <p className="text-muted-foreground">Em desenvolvimento...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center py-20">
                    <h2 className="text-2xl font-bold mb-4">Página de Configurações</h2>
                    <p className="text-muted-foreground">Em desenvolvimento...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center py-20">
                    <h2 className="text-2xl font-bold mb-4">Página de Perfil</h2>
                    <p className="text-muted-foreground">Em desenvolvimento...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } 
          />

          {/* Rota padrão */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          
          {/* Rota 404 */}
          <Route 
            path="*" 
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold mb-4">404</h1>
                  <p className="text-muted-foreground">Página não encontrada</p>
                </div>
              </div>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
