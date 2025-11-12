import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Allocations from './pages/Allocations';
import Proposals from './pages/Proposals';
import Expenditures from './pages/Expenditures';
import Income from './pages/Income';
import Officials from './pages/Officials';
import InitialSetup from './pages/InitialSetup';
import PublicDashboard from './pages/PublicDashboard';

// Protected Route wrapper
const ProtectedRoute = ({ children, requireChairman = false }) => {
  const { user, isChairman } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check both user state and sessionStorage
    const token = sessionStorage.getItem('token');
    const savedUser = sessionStorage.getItem('user');

    // If either is missing, user is not authenticated
    if (!user || !token || !savedUser) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate, location]);

  // Double check authentication
  const token = sessionStorage.getItem('token');
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (requireChairman && !isChairman) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route wrapper (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicDashboard />} />
        <Route path="/public" element={<PublicDashboard />} />
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
        <Route path="/setup" element={<InitialSetup />} />

        {/* Protected Routes - wrapped in Layout */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="allocations" element={<Allocations />} />
          <Route path="proposals" element={<Proposals />} />
          <Route path="expenditures" element={<Expenditures />} />
          <Route path="income" element={<Income />} />
          <Route
            path="officials"
            element={
              <ProtectedRoute requireChairman>
                <Officials />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch all - redirect to public dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
