import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI, shipmentAPI } from '../../services/api';
import {
  MdDashboard, MdDirectionsBoat, MdPeople, MdBusiness,
  MdRoute, MdSettings, MdCompare, MdReport, MdBook,
  MdCamera, MdWater, MdLocalGasStation, MdInventory,
  MdChevronLeft, MdEmail, MdMenu, MdAdd, MdClose,
  MdBarChart, MdWorkspaces, MdOutlineEngineering,
  MdListAlt, MdNotes, MdLayers, MdWarning, MdTimeline
} from 'react-icons/md';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const SIDEBAR_NAV = [
  { label: 'Dashboard', icon: <MdDashboard />, path: '/manager' },
  { label: 'Ship', icon: <MdDirectionsBoat />, path: '/manager/ships' },
  { label: 'Staff', icon: <MdPeople />, path: '/manager/company-staff' },
  { label: 'Voyage', icon: <MdTimeline />, path: '/manager/voyage' },
  { label: 'Alarm', icon: <MdWarning />, path: '/manager/alarm' },
  { label: 'ODS Record Book', icon: <MdBook />, path: '/manager/ods' },
  { label: 'Ballast Water Record B...', icon: <MdWater />, path: '/manager/ballast' },
  { label: 'Bunker Record Book', icon: <MdLocalGasStation />, path: '/manager/bunker' },
  { label: 'Cargo Record Book', icon: <MdInventory />, path: '/manager/cargo' },
  { label: 'Consumption Log Book', icon: <MdBarChart />, path: '/manager/consumption' },
  { label: 'Deck Log Book', icon: <MdNotes />, path: '/manager/deck' },
  { label: 'Engine Log Book', icon: <MdOutlineEngineering />, path: '/manager/engine' },
];

// Demo ships for fleet overview
const DEMO_SHIPS = [
  { id: 1, name: 'Mumbai Ship', flag: 'India', img: 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=300&q=80' },
  { id: 2, name: 'Atlantic Carrier', flag: 'India', img: 'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=300&q=80' },
  { id: 3, name: 'Pacific Star', flag: 'India', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80' },
  { id: 4, name: 'Ocean Titan', flag: 'India', img: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&q=80' },
];

export default function MarineCompanyDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setStats(res.data.stats))
      .catch(() => {});
  }, []);

  const toggleExpand = (label) => {
    setExpandedItems(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/manager/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="marine-layout">
      {/* ── SIDEBAR ── */}
      <aside className={`marine-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand */}
        <div className="marine-brand">
          {!sidebarCollapsed && <span className="marine-brand-text">MARIN-COMPANY</span>}
          <button className="marine-collapse-btn" onClick={() => { setSidebarCollapsed(!sidebarCollapsed); setMobileOpen(false); }}>
            <MdChevronLeft size={20} style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
          </button>
        </div>

        {/* Nav */}
        <nav className="marine-nav">
          {SIDEBAR_NAV.map((item) => (
            <div key={item.label}>
              <div
                className={`marine-nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => {
                  if (item.sub) { toggleExpand(item.label); }
                  else { navigate(item.path); setMobileOpen(false); }
                }}
                title={sidebarCollapsed ? item.label : ''}
              >
                <span className="marine-nav-icon">{item.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span className="marine-nav-label">{item.label}</span>
                    {item.sub && (
                      <span className="marine-nav-arrow" style={{ transform: expandedItems[item.label] ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
                    )}
                  </>
                )}
              </div>
              {/* Sub items */}
              {item.sub && expandedItems[item.label] && !sidebarCollapsed && (
                <div className="marine-sub-nav">
                  {item.sub.map(s => (
                    <div key={s} className="marine-sub-item">{s}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="marine-overlay" onClick={() => setMobileOpen(false)} />}

      {/* ── MAIN ── */}
      <div className="marine-main">
        {/* Top Bar */}
        <header className="marine-topbar">
          <div className="marine-topbar-left">
            <button className="marine-mobile-menu" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <MdClose size={22} /> : <MdMenu size={22} />}
            </button>
            <div className="marine-topbar-info">
              <span className="marine-topbar-email">
                <MdEmail size={14} /> {user?.email || 'company@domain.com'}
              </span>
              <span className="marine-topbar-company">
                🏢 Company: <strong>{user?.companyName || 'Marine Co.'}</strong>
              </span>
            </div>
          </div>
          <div className="marine-topbar-right">
            <span className="marine-topbar-welcome">Welcome:</span>
            <button className="marine-avatar-btn" onClick={handleLogout} title="Logout">
              <MdPeople size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="marine-page">
          {/* Welcome Banner */}
          <div className="marine-welcome-banner">
            <div>
              <div className="marine-welcome-emoji">👋</div>
              <h1 className="marine-welcome-title">Welcome back, {user?.name || 'User'}</h1>
              <p className="marine-welcome-sub">Your fleet management overview at a glance.</p>
            </div>
            <div className="marine-welcome-right">
              <span className="marine-admin-badge">COMPANY ADMIN</span>
              <span className="marine-date-badge">
                📅 {format(new Date(), 'dd MMM yyyy')}
              </span>
            </div>
          </div>

          {/* Fleet Overview */}
          <div className="marine-section">
            <div className="marine-section-header">
              <div className="marine-section-bar" />
              <h2 className="marine-section-title">Fleet Overview</h2>
            </div>
            <div className="marine-fleet-scroll">
              <div className="marine-fleet-track">
                {DEMO_SHIPS.map(ship => (
                  <div key={ship.id} className="marine-ship-card">
                    <div className="marine-ship-img-wrap">
                      <img src={ship.img} alt={ship.name} className="marine-ship-img"
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=300&q=80'; }} />
                    </div>
                    <div className="marine-ship-info">
                      <div className="marine-ship-name">{ship.name}</div>
                      <div className="marine-ship-flag">🚩 Flag: {ship.flag}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Analytics */}
          <div className="marine-section">
            <div className="marine-section-header">
              <div className="marine-section-bar" />
              <h2 className="marine-section-title">Performance Analytics</h2>
            </div>
            <div className="marine-analytics-card">
              <div className="marine-analytics-filters">
                <div className="marine-filter-group">
                  <label className="marine-filter-label">• SELECT SHIP</label>
                  <select className="marine-filter-select"><option>Mumbai Ship</option></select>
                </div>
                <div className="marine-filter-group">
                  <label className="marine-filter-label">• SELECT DATE RANGE</label>
                  <input type="date" className="marine-filter-input" defaultValue="2026-06-12" />
                  <span style={{ margin: '0 4px', color: '#888' }}>→</span>
                  <input type="date" className="marine-filter-input" defaultValue="2026-06-14" />
                </div>
                <div className="marine-filter-group">
                  <label className="marine-filter-label">• SELECT LOGBOOK</label>
                  <select className="marine-filter-select"><option>Engine Logbook</option></select>
                </div>
                <div className="marine-filter-group">
                  <label className="marine-filter-label">• SELECT MACHINERY TYPE</label>
                  <select className="marine-filter-select"><option>Select machinery type</option></select>
                </div>
              </div>
              <div className="marine-analytics-filters" style={{ marginTop: '12px' }}>
                <div className="marine-filter-group">
                  <label className="marine-filter-label">• SELECT PARAMETERS</label>
                  <select className="marine-filter-select"><option>Select Parameters</option></select>
                </div>
                <div className="marine-filter-group">
                  <label className="marine-filter-label">• SELECT CHART TYPE</label>
                  <select className="marine-filter-select"><option>Bar Chart</option></select>
                </div>
                <div className="marine-filter-group">
                  <label className="marine-filter-label">• TIME FORMAT</label>
                  <select className="marine-filter-select"><option>Daily</option></select>
                </div>
                <div className="marine-filter-group" style={{ alignItems: 'flex-end' }}>
                  <label className="marine-filter-label" style={{ opacity: 0 }}>.</label>
                  <button className="marine-generate-btn">Generate Graph</button>
                </div>
              </div>

              {/* Chart */}
              <div style={{ marginTop: '24px' }}>
                <div className="marine-chart-title">Bar Chart (Daily)</div>
                <div style={{ height: '220px', marginTop: '12px' }}>
                  <Bar
                    data={{
                      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                      datasets: [{
                        label: 'Performance',
                        data: [65, 78, 52, 91, 83, 74, 60],
                        backgroundColor: '#e8380d',
                        borderRadius: 6,
                      }],
                    }}
                    options={{
                      responsive: true, maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { ticks: { color: '#888' }, grid: { color: 'rgba(0,0,0,0.05)' } },
                        y: { ticks: { color: '#888' }, grid: { color: 'rgba(0,0,0,0.05)' } },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fleet Statistics */}
          <div className="marine-section">
            <div className="marine-section-header">
              <div className="marine-section-bar" />
              <h2 className="marine-section-title">Fleet Statistics</h2>
            </div>
            <div className="marine-stats-row">
              {[
                { label: 'Total Vessels', value: stats?.totalShips || 0, color: '#4f8ef7', icon: '🚢' },
                { label: 'Active Voyages', value: stats?.activeVoyages || 0, color: '#f59e0b', icon: '🗺️' },
                { label: 'Active Alarms', value: stats?.activeAlarms || 0, color: '#dc2626', icon: '🚨' },
                { label: 'Total Crew / Staff', value: stats?.totalCrew || 0, color: '#16a34a', icon: '👷' },
              ].map(s => (
                <div key={s.label} className="marine-stat-box" style={{ borderTop: `3px solid ${s.color}` }}>
                  <div className="marine-stat-emoji">{s.icon}</div>
                  <div className="marine-stat-num" style={{ color: s.color }}>{s.value}</div>
                  <div className="marine-stat-lbl">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FAB Buttons */}
      <div className="marine-fab-group">
        <button className="marine-fab marine-fab-chat" title="Support">💬</button>
        <button className="marine-fab marine-fab-add" title="Add Vessel" onClick={() => navigate('/manager/ships')}>
          <MdAdd size={24} />
        </button>
      </div>
    </div>
  );
}
