import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import VesselFABs from '../../components/layout/VesselFABs';
import {
  MdDashboard, MdDirectionsBoat, MdPeople, MdBusiness,
  MdRoute, MdSettings, MdCompare, MdReport, MdBook,
  MdCamera, MdWater, MdLocalGasStation, MdInventory,
  MdChevronLeft, MdEmail, MdMenu, MdAdd, MdClose,
  MdBarChart, MdWorkspaces, MdOutlineEngineering,
  MdListAlt, MdNotes, MdLayers, MdWarning, MdTimeline,
  MdLogout, MdPerson
} from 'react-icons/md';

const NAV = [
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

export default function MarineLayout({ children, active }) {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = active || location.pathname;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [showProfile, setShowProfile] = useState(false);

  const isActive = (path) => activePath === path;
  const toggle = (label) => setExpanded(p => ({ ...p, [label]: !p[label] }));

  const handleLogout = () => { logout(); navigate('/manager/login'); };

  return (
    <div className="marine-layout">
      {/* Sidebar */}
      <aside className={`marine-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="marine-brand">
          {!collapsed && <span className="marine-brand-text">MARIN-COMPANY</span>}
          <button className="marine-collapse-btn" onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}>
            <MdChevronLeft size={20} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
          </button>
        </div>
        <nav className="marine-nav">
          {NAV.map(item => (
            <div key={item.label}>
              <div
                className={`marine-nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => { if (item.sub) toggle(item.label); else { navigate(item.path); setMobileOpen(false); } }}
                title={collapsed ? item.label : ''}
              >
                <span className="marine-nav-icon">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="marine-nav-label">{item.label}</span>
                    {item.sub && <span className="marine-nav-arrow" style={{ transform: expanded[item.label] ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>}
                  </>
                )}
              </div>
              {item.sub && expanded[item.label] && !collapsed && (
                <div className="marine-sub-nav">
                  {item.sub.map(s => <div key={s} className="marine-sub-item">{s}</div>)}
                </div>
              )}
            </div>
          ))}
        </nav>
        {/* Sidebar Footer / Logout */}
        <div className="marine-sidebar-footer">
          <button className="marine-logout-btn" onClick={handleLogout} title="Logout">
            <span className="marine-nav-icon"><MdLogout size={18} /></span>
            {!collapsed && <span className="marine-nav-label">Logout</span>}
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="marine-overlay" onClick={() => setMobileOpen(false)} />}

      <div className={`marine-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Topbar */}
        <header className="marine-topbar">
          <div className="marine-topbar-left">
            <button className="marine-mobile-menu" style={{ display: 'flex' }} onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <MdClose size={22} /> : <MdMenu size={22} />}
            </button>
            <div className="marine-topbar-info">
              <span className="marine-topbar-email"><MdEmail size={14} /> {user?.email}</span>
              <span className="marine-topbar-company">🏢 Company: <strong>{user?.companyName || 'Marine Co.'}</strong></span>
            </div>
          </div>
          <div className="marine-topbar-right">
            <span className="marine-topbar-welcome">Welcome:</span>
            <button className="marine-avatar-btn" onClick={() => setShowProfile(true)} title="Company Profile">
              <MdPerson size={20} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="marine-page">
          {children}
        </div>
      </div>

      <VesselFABs />

      {/* Company Profile Modal */}
      {showProfile && (
        <CompanyProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdate={(updatedUser) => updateUser(updatedUser)}
        />
      )}
    </div>
  );
}

function CompanyProfileModal({ user, onClose, onUpdate }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    companyName: user?.companyName || '',
    companyEmail: user?.companyEmail || '',
    companyAltEmail: user?.companyAltEmail || '',
    companyPhone: user?.companyPhone || '',
    country: user?.country || '',
    city: user?.city || '',
    state: user?.state || '',
    zip: user?.zip || '',
    officeAddress: user?.officeAddress || '',
  });
  const [loading, setLoading] = useState(false);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.updateProfile(form);
      toast.success('Company profile updated successfully!');
      onUpdate(res.data.user);
      onClose();
    } catch(err) {
      toast.error(err.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="marine-modal-overlay" onClick={onClose}>
      <div className="marine-modal marine-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="marine-modal-header">
          <h3 className="marine-modal-title">🏢 Company Profile & Settings</h3>
          <button onClick={onClose} className="marine-modal-close">✕</button>
        </div>
        <form onSubmit={submit} className="marine-modal-body">
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: '#e8380d', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 12 }}>Manager Account Information</h4>
            <div className="marine-form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="marine-label">Manager Full Name <span className="req">*</span></label>
                <input name="name" value={form.name} onChange={handle} required className="marine-input" placeholder="Manager Name" />
              </div>
              <div className="form-group">
                <label className="marine-label">Account Email (Login)</label>
                <input value={user?.email} disabled className="marine-input" style={{ background: '#f1f5f9', cursor: 'not-allowed' }} />
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 16, marginBottom: 16 }}>
            <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: '#e8380d', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 12 }}>Corporate Details</h4>
            <div className="marine-form-grid">
              <div className="form-group">
                <label className="marine-label">Company Name <span className="req">*</span></label>
                <input name="companyName" value={form.companyName} onChange={handle} required className="marine-input" placeholder="Company Name" />
              </div>
              <div className="form-group">
                <label className="marine-label">Company Phone</label>
                <input name="companyPhone" value={form.companyPhone} onChange={handle} className="marine-input" placeholder="Company Phone" />
              </div>
              <div className="form-group">
                <label className="marine-label">Company Email</label>
                <input name="companyEmail" type="email" value={form.companyEmail} onChange={handle} className="marine-input" placeholder="Company Email" />
              </div>
              <div className="form-group">
                <label className="marine-label">Alt Contact Email</label>
                <input name="companyAltEmail" type="email" value={form.companyAltEmail} onChange={handle} className="marine-input" placeholder="Alternative Email" />
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 16, marginBottom: 16 }}>
            <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: '#e8380d', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 12 }}>Registered Office Address</h4>
            <div className="marine-form-grid">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="marine-label">Office Address</label>
                <input name="officeAddress" value={form.officeAddress} onChange={handle} className="marine-input" placeholder="Street Address" />
              </div>
              <div className="form-group">
                <label className="marine-label">City</label>
                <input name="city" value={form.city} onChange={handle} className="marine-input" placeholder="City" />
              </div>
              <div className="form-group">
                <label className="marine-label">State / Province</label>
                <input name="state" value={form.state} onChange={handle} className="marine-input" placeholder="State/Province" />
              </div>
              <div className="form-group">
                <label className="marine-label">Zip / Postal Code</label>
                <input name="zip" value={form.zip} onChange={handle} className="marine-input" placeholder="ZIP Code" />
              </div>
              <div className="form-group">
                <label className="marine-label">Country</label>
                <input name="country" value={form.country} onChange={handle} className="marine-input" placeholder="Country" />
              </div>
            </div>
          </div>

          <div className="marine-modal-footer">
            <button type="button" onClick={onClose} className="marine-btn-sec">Close</button>
            <button type="submit" className="marine-btn-red" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
