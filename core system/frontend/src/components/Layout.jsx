import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  DollarSign,
  FileText,
  ShoppingCart,
  Wallet,
  Users,
  LogOut,
  Menu,
  ArrowRight,
} from 'lucide-react';

const Layout = () => {
  const { user, logout, isChairman } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Set a flag when page loads to track if it's a refresh
    sessionStorage.setItem('isAppActive', 'true');

    // Detect when user navigates away or closes tab
    const handlePageHide = (e) => {
      // Check if this is triggered by page navigation (not refresh)
      // If persisted is true, it's going into back/forward cache (likely refresh or back button)
      // If persisted is false, it's actually leaving the page
      if (!e.persisted) {
        // Clear session when actually leaving, not refreshing
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }
      sessionStorage.removeItem('isAppActive');
    };

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  useEffect(() => {
    // Check authentication status on every render
    const token = sessionStorage.getItem('token');
    if (!user || !token) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    // Clear browser history and redirect
    window.history.pushState(null, '', '/login');
    navigate('/login', { replace: true });
  };

  const handleNavClick = () => {
    setIsNavigating(true);
    // Reset navigation state after a short delay
    setTimeout(() => {
      setIsNavigating(false);
    }, 500);
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Chairman', 'Treasurer'] },
    { path: '/allocations', label: 'Allocations', icon: DollarSign, roles: ['Chairman', 'Treasurer'] },
    { path: '/proposals', label: 'Proposals', icon: FileText, roles: ['Chairman', 'Treasurer'] },
    { path: '/expenditures', label: 'Expenditures', icon: ShoppingCart, roles: ['Chairman', 'Treasurer'] },
    { path: '/income', label: 'Income', icon: Wallet, roles: ['Chairman', 'Treasurer'] },
    { path: '/officials', label: 'Officials', icon: Users, roles: ['Chairman'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? '250px' : '0',
          backgroundColor: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          position: window.innerWidth <= 768 ? 'fixed' : 'relative',
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          zIndex: 100,
          transition: 'width 0.3s ease',
        }}
      >
        <div style={{ width: '250px' }}>
          {/* Header with Close Button */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                Barangay Finance
              </h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="btn btn-outline"
                style={{ padding: '0.5rem' }}
                title="Close sidebar"
              >
                <ArrowRight size={20} />
              </button>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Financial Management System
            </p>
          </div>

          {/* Navigation */}
          <nav style={{ padding: '1rem' }}>
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    handleNavClick();
                    window.innerWidth <= 768 && setSidebarOpen(false);
                  }}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.375rem',
                    marginBottom: '0.25rem',
                    textDecoration: 'none',
                    color: isActive ? 'var(--primary)' : 'var(--text)',
                    backgroundColor: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                    fontWeight: isActive ? '500' : '400',
                    transition: 'all 0.2s',
                  })}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User Info and Logout */}
          <div style={{ padding: '1rem', marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
            <div style={{ marginBottom: '1rem', padding: '0 0.5rem' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>{user?.fullName}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {user?.role}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-outline"
              style={{ width: '100%' }}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && window.innerWidth <= 768 && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99,
          }}
        />
      )}

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <header
          style={{
            backgroundColor: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="btn btn-outline"
            >
              <Menu size={20} />
            </button>
          )}
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
            Welcome, {user?.fullName}
          </h2>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', position: 'relative' }}>
          {/* Loading overlay */}
          {isNavigating && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
                animation: 'fadeIn 0.2s ease-in',
              }}
            >
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  border: '4px solid var(--border)',
                  borderTop: '4px solid var(--primary)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            </div>
          )}
          <Outlet />
        </div>
      </main>

      {/* Add keyframes for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Layout;
