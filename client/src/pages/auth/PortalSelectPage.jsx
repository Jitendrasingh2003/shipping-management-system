import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MdBusiness, MdDeliveryDining, MdSecurity, MdArrowForward } from 'react-icons/md';

export default function PortalSelectPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to appropriate panel
  useEffect(() => {
    if (isAuthenticated && user) {
      const routes = { admin: '/admin', manager: '/manager', staff: '/staff' };
      navigate(routes[user.role] || '/admin', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="portal-select-page">
      {/* Background blobs & grids */}
      <div className="portal-bg">
        <div className="portal-blob portal-blob-1" />
        <div className="portal-blob portal-blob-2" />
        <div className="portal-blob portal-blob-3" />
        <div className="portal-grid-lines" />
      </div>

      <div className="portal-content">
        {/* Floating Administrative Access Link */}
        <div className="portal-admin-corner">
          <Link to="/admin/login" className="portal-admin-link-badge">
            <span className="admin-icon"><MdSecurity /></span>
            Admin Console
          </Link>
        </div>

        {/* Header Section */}
        <div className="portal-header">
          <div className="portal-logo">
            <div className="portal-logo-icon">🚚</div>
          </div>
          <h1 className="portal-main-title">ShipTrack <span>Pro</span></h1>
          <p className="portal-main-subtitle">
            Next-Generation Shipping, Marine Operations & Logistics Management Platform
          </p>
          <div className="portal-choose-text">
            Choose your gateway to sign in to your workspace
          </div>
        </div>

        {/* Dual Cards Container */}
        <div className="portal-cards-container">
          {/* Card 1: Company Manager Portal */}
          <div className="portal-select-card-premium" onClick={() => navigate('/manager/login')}>
            <div className="card-shine" />
            <div className="portal-card-icon-wrap company">
              <MdBusiness size={40} />
            </div>
            <h2 className="portal-card-title">Corporate Portal</h2>
            <p className="portal-card-desc">
              Manage cargo vessels, staff assignments, invoices, voyaging logbooks, and full shipping statistics.
            </p>
            <ul className="portal-features-list">
              <li><span className="dot" /> Fleet & Ship Diagnostics</li>
              <li><span className="dot" /> Courier Dispatch Board</li>
              <li><span className="dot" /> Logbooks & Auditing</li>
            </ul>
            <div className="portal-card-action">
              <span>Enter Workspace</span>
              <MdArrowForward className="arrow-icon" />
            </div>
          </div>

          {/* Card 2: Staff Portal */}
          <div className="portal-select-card-premium" onClick={() => navigate('/staff/login')}>
            <div className="card-shine" />
            <div className="portal-card-icon-wrap staff">
              <MdDeliveryDining size={40} />
            </div>
            <h2 className="portal-card-title">Staff Portal</h2>
            <p className="portal-card-desc">
              Access active deliveries, capture signatures, scan package barcodes, and log vessel parameters.
            </p>
            <ul className="portal-features-list">
              <li><span className="dot" /> My Deliveries & Map</li>
              <li><span className="dot" /> Scanner & Signature Pad</li>
              <li><span className="dot" /> Vessel Operations Logs</li>
            </ul>
            <div className="portal-card-action">
              <span>Access Board</span>
              <MdArrowForward className="arrow-icon" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="portal-footer">
          🔒 Secure SSL Connection • Authorized personnel only • Protected with JWT session tokens
        </div>
      </div>
    </div>
  );
}
