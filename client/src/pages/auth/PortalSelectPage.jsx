import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function PortalSelectPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Agar pehle se logged in hai toh seedha dashboard pe bhejo
  useEffect(() => {
    if (isAuthenticated && user) {
      const routes = { admin: '/admin', manager: '/manager', staff: '/staff' };
      navigate(routes[user.role] || '/admin', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const portals = [
    {
      role: 'admin',
      icon: '👑',
      title: 'Admin Portal',
      description: 'Full system access — Users, Reports, HR, Finance, Company Settings & more',
      link: '/admin/login',
      className: 'portal-card-admin',
      badge: 'ADMIN',
      features: ['User Management', 'Financial Reports', 'HR Management', 'Audit Logs', 'System Settings'],
      color: '#dc2626',
    },
    {
      role: 'manager',
      icon: '🚢',
      title: 'Company Portal',
      description: 'Marine company management — Register & manage your fleet, voyages, shipments & crew',
      link: '/manager/register',
      className: 'portal-card-manager',
      badge: 'COMPANY',
      features: ['Fleet Management', 'Voyage Tracking', 'Crew Management', 'Ship Analytics', 'Record Books'],
      color: '#d97706',
    },
    {
      role: 'staff',
      icon: '👷',
      title: 'Staff Portal',
      description: 'Marine staff operations — Track voyages, log record books, and report navigational data',
      link: '/staff/login',
      className: 'portal-card-staff',
      badge: 'STAFF',
      features: ['Voyage Tracking', 'Deck Log Book', 'Engine Log Book', 'Record Books Logging', 'Vessel Status'],
      color: '#16a34a',
    },
  ];

  return (
    <div className="portal-select-page">
      {/* Animated Background */}
      <div className="portal-bg">
        <div className="portal-blob portal-blob-1" />
        <div className="portal-blob portal-blob-2" />
        <div className="portal-blob portal-blob-3" />
        <div className="portal-grid-lines" />
      </div>

      <div className="portal-content">
        {/* Header */}
        <div className="portal-header slide-up">
          <div className="portal-logo">
            <div className="portal-logo-icon">🚚</div>
          </div>
          <h1 className="portal-main-title">ShipTrack <span>Pro</span></h1>
          <p className="portal-main-subtitle">
            Codec Technologies — Shipping Management System
          </p>
          <p className="portal-choose-text">Apna portal chunein neeche se 👇</p>
        </div>

        {/* Portal Cards */}
        <div className="portal-cards">
          {portals.map((portal, i) => (
            <Link
              key={portal.role}
              to={portal.link}
              className={`portal-card ${portal.className}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Card glow effect */}
              <div className="portal-card-glow" style={{ background: portal.color }} />

              {/* Badge */}
              <div className="portal-role-badge" style={{ borderColor: portal.color, color: portal.color }}>
                {portal.badge}
              </div>

              {/* Icon */}
              <div className="portal-card-icon">{portal.icon}</div>

              {/* Content */}
              <h2 className="portal-card-title">{portal.title}</h2>
              <p className="portal-card-desc">{portal.description}</p>

              {/* Features */}
              <ul className="portal-features">
                {portal.features.map(f => (
                  <li key={f} className="portal-feature-item">
                    <span className="portal-feature-dot" style={{ background: portal.color }} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="portal-card-cta" style={{ background: portal.color }}>
                Login as {portal.badge} →
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="portal-footer">
          🔒 All portals are secured with JWT Authentication & bcrypt encryption
        </div>
      </div>
    </div>
  );
}
