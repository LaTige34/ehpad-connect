import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useSelector } from 'react-redux';

// Layout
import Layout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import PlanningPage from './pages/planning/PlanningPage';
import DocumentList from './pages/documents/DocumentList';
import DocumentDetails from './pages/documents/DocumentDetails';
import SignDocument from './pages/documents/SignDocument';
import ProfilePage from './pages/profile/ProfilePage';
import NotFound from './pages/NotFound';

// Composants du thème
import { frFR } from '@mui/material/locale';

// Fonctions utilitaires pour la protection des routes
const PrivateRoute = ({ children }) => {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  return !isAuthenticated ? children : <Navigate to="/" />;
};

// Création du thème
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
  },
}, frFR);

function App() {
  // Dans une application réelle, vous chargeriez l'état de l'authentification depuis un store Redux
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={
            <PublicRoute>
              <AuthLayout>
                <Login />
              </AuthLayout>
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <AuthLayout>
                <ForgotPassword />
              </AuthLayout>
            </PublicRoute>
          } />
          
          {/* Routes privées */}
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/planning" element={
            <PrivateRoute>
              <Layout>
                <PlanningPage />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/documents" element={
            <PrivateRoute>
              <Layout>
                <DocumentList />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/documents/:id" element={
            <PrivateRoute>
              <Layout>
                <DocumentDetails />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/documents/:id/sign" element={
            <PrivateRoute>
              <Layout>
                <SignDocument />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </PrivateRoute>
          } />
          
          {/* Route 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
