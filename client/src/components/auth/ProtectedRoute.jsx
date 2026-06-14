import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ allowedRoles, loginPath = '/admin/login' }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading ShipTrack Pro...</div>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to this role's login page
  if (!isAuthenticated) return <Navigate to={loginPath} replace />;

  // Wrong role → redirect to their own dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const routes = { admin: '/admin', manager: '/manager', staff: '/staff' };
    return <Navigate to={routes[user.role] || '/'} replace />;
  }

  return <Outlet />;
}
