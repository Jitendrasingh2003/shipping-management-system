import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  MdDashboard, MdLocalShipping, MdPeople, MdBarChart,
  MdLogout, MdDeliveryDining,
  MdAssignment, MdReceiptLong, MdSecurity, MdInventory2,
  MdChevronLeft, MdDirectionsBoat, MdAnchor, MdWarning,
  MdMenuBook, MdWater, MdLocalGasStation, MdInventory,
  MdTimeline, MdEngineering, MdExpandMore,
} from 'react-icons/md';

/* ── nav configs per role ───────────────────────────────────────── */
const navConfig = {
  admin: [
    { section: 'Main', items: [
      { to: '/admin',           icon: <MdDashboard />,      label: 'Dashboard',        exact: true },
      { to: '/admin/shipments', icon: <MdLocalShipping />,  label: 'All Shipments' },
      { to: '/admin/users',     icon: <MdPeople />,         label: 'User Management' },
    ]},
    { section: 'Analytics', items: [
      { to: '/admin/reports',    icon: <MdBarChart />,      label: 'Reports' },
      { to: '/admin/invoices',   icon: <MdReceiptLong />,   label: 'Invoice Management' },
      { to: '/admin/audit-logs', icon: <MdSecurity />,      label: 'Audit Trail' },
    ]},
  ],

  manager: [
    { section: 'Main', items: [
      { to: '/manager',                  icon: <MdDashboard />,   label: 'Dashboard',       exact: true },
      { to: '/manager/shipments',        icon: <MdLocalShipping />,label: 'Shipments' },
      { to: '/manager/create-shipment',  icon: <MdInventory2 />,  label: 'Create Shipment' },
      { to: '/manager/assign',           icon: <MdAssignment />,  label: 'Assign Deliveries' },
    ]},
    { section: 'Analytics', items: [
      { to: '/manager/reports',  icon: <MdBarChart />,    label: 'Reports' },
      { to: '/manager/invoices', icon: <MdReceiptLong />, label: 'Invoices' },
    ]},
  ],

  staff: [
    {
      section: '',
      items: [
        { to: '/staff',                 icon: <MdDashboard />,       label: 'Dashboard', exact: true },
        { to: '/staff?tab=ship',        icon: <MdDirectionsBoat />,  label: 'Ship' },
        { to: '/staff/deliveries',      icon: <MdTimeline />,        label: 'Voyage' },
        { to: '/staff?tab=alarm',       icon: <MdWarning />,         label: 'Alarm' },
        { to: '/staff?tab=ods',         icon: <MdMenuBook />,        label: 'ODS Record Book', hasDropdown: true },
        { to: '/staff?tab=ballast',     icon: <MdWater />,           label: 'Ballast Water Record B...' },
        { to: '/staff?tab=bunker',      icon: <MdLocalGasStation />, label: 'Bunker Record Book' },
        { to: '/staff?tab=cargo',       icon: <MdInventory />,       label: 'Cargo Record Book' },
        { to: '/staff?tab=consumption', icon: <MdBarChart />,        label: 'Consumption Log ...', hasDropdown: true },
        { to: '/staff?tab=deck',        icon: <MdMenuBook />,        label: 'Deck Log Book' },
        { to: '/staff?tab=engine',      icon: <MdEngineering />,     label: 'Engine Log Book' },
      ]
    }
  ],
};

/* ── sidebar label per role ─────────────────────────────────────── */
const PANEL_LABEL = {
  admin:   'ADMIN PANEL',
  manager: 'MANAGER PANEL',
  staff:   'MARIN-STAFF',
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = navConfig[user?.role] || [];

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      {/* ── Brand ── */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">
            {PANEL_LABEL[user?.role] || 'ADMIN PANEL'}
          </span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar-nav">
        {nav.map((section, idx) => (
          <div key={section.section || idx}>
            {section.section && <div className="sidebar-section-label">{section.section}</div>}
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.hasDropdown && (
                  <span style={{ display: 'flex', alignItems: 'center', marginRight: '4px', opacity: 0.7 }}>
                    <MdExpandMore size={16} />
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}

        {/* Logout */}
        <div style={{ marginTop: '16px' }}>
          <div className="sidebar-section-label">Account</div>
          <button className="nav-item" onClick={handleLogout}>
            <span className="nav-icon"><MdLogout /></span>
            Logout
          </button>
        </div>
      </nav>

      {/* ── Footer collapse hint ── */}
      <div className="sidebar-footer">
        <button className="sidebar-collapse-btn" title="Collapse">
          <MdChevronLeft size={16} />
        </button>
      </div>
    </aside>
  );
}
