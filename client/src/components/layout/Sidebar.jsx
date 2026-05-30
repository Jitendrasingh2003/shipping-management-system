import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  MdDashboard, MdLocalShipping, MdPeople, MdBarChart,
  MdNotifications, MdSettings, MdLogout, MdDeliveryDining,
  MdAssignment, MdReceiptLong, MdSecurity, MdInventory2
} from 'react-icons/md';

const navConfig = {
  admin: [
    { section: 'Main', items: [
      { to: '/admin', icon: <MdDashboard />, label: 'Dashboard', exact: true },
      { to: '/admin/shipments', icon: <MdLocalShipping />, label: 'All Shipments' },
      { to: '/admin/users', icon: <MdPeople />, label: 'User Management' },
    ]},
    { section: 'Analytics', items: [
      { to: '/admin/reports', icon: <MdBarChart />, label: 'Reports' },
      { to: '/admin/invoices', icon: <MdReceiptLong />, label: 'Invoices' },
      { to: '/admin/audit-logs', icon: <MdSecurity />, label: 'Audit Trail' },
    ]},
  ],
  manager: [
    { section: 'Main', items: [
      { to: '/manager', icon: <MdDashboard />, label: 'Dashboard', exact: true },
      { to: '/manager/shipments', icon: <MdLocalShipping />, label: 'Shipments' },
      { to: '/manager/create-shipment', icon: <MdInventory2 />, label: 'Create Shipment' },
      { to: '/manager/assign', icon: <MdAssignment />, label: 'Assign Deliveries' },
    ]},
    { section: 'Analytics', items: [
      { to: '/manager/reports', icon: <MdBarChart />, label: 'Reports' },
      { to: '/manager/invoices', icon: <MdReceiptLong />, label: 'Invoices' },
    ]},
  ],
  staff: [
    { section: 'Main', items: [
      { to: '/staff', icon: <MdDashboard />, label: 'Dashboard', exact: true },
      { to: '/staff/deliveries', icon: <MdDeliveryDining />, label: 'My Deliveries' },
    ]},
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = navConfig[user?.role] || [];

  const initials = user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🚚</div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">ShipTrack Pro</span>
          <span className="sidebar-logo-sub">Codec Technologies</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {nav.map((section) => (
          <div key={section.section}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">
              <span className={`role-badge ${user?.role}`}>{user?.role}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout" style={{ marginLeft: 'auto' }}>
            <MdLogout size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
