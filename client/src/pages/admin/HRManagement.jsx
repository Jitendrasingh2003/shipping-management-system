import { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { userAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { MdPeople, MdSearch, MdVerified, MdBlock, MdDeliveryDining, MdSupervisorAccount } from 'react-icons/md';

const ROLE_BADGE = {
  admin:   { bg: '#ede9fe', color: '#7c3aed', label: 'Admin' },
  manager: { bg: '#dbeafe', color: '#2563eb', label: 'Manager' },
  staff:   { bg: '#d1fae5', color: '#059669', label: 'Staff' },
};

export default function HRManagement() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    userAPI.getAll({ limit: 200 })
      .then(res => setUsers(res.data.data || []))
      .catch(() => toast.error('Failed to load employees'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole   = roleFilter ? u.role === roleFilter : true;
    return matchSearch && matchRole;
  });

  const totalActive   = users.filter(u => u.isActive).length;
  const totalInactive = users.filter(u => !u.isActive).length;
  const staffCount    = users.filter(u => u.role === 'staff').length;
  const managerCount  = users.filter(u => u.role === 'manager').length;

  return (
    <AppLayout title="HR Management" subtitle="Employee records and human resource overview">

      <div className="dashboard-hero" style={{ marginBottom: '24px' }}>
        <div className="dashboard-hero-top">
          <div>
            <h1>HR <span>Management</span></h1>
            <p>Employee directory, status, and resource management.</p>
          </div>
          <div className="fleet-status-badge">👥 {users.length} Total Employees</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {[
          { label: 'Total Employees', value: users.length,    color: '#4f8ef7', bg: '#eff6ff', icon: <MdPeople /> },
          { label: 'Active',          value: totalActive,     color: '#16a34a', bg: '#dcfce7', icon: <MdVerified /> },
          { label: 'Inactive',        value: totalInactive,   color: '#dc2626', bg: '#fee2e2', icon: <MdBlock /> },
          { label: 'Delivery Staff',  value: staffCount,      color: '#059669', bg: '#d1fae5', icon: <MdDeliveryDining /> },
          { label: 'Managers',        value: managerCount,    color: '#2563eb', bg: '#dbeafe', icon: <MdSupervisorAccount /> },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <div className="stat-info">
              <div className="stat-label">{c.label}</div>
              <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
            </div>
            <div className="stat-icon-wrap" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
            <MdSearch className="search-icon" />
            <input className="search-input" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-input" style={{ width: '160px' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
          </select>
        </div>
      </div>

      {/* Employee Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">👨‍💼 Employee Directory</div>
          <div style={{ color: '#6b7280', fontSize: '13px' }}>{filtered.length} employees found</div>
        </div>
        {loading
          ? <div className="loading-container"><div className="spinner" /></div>
          : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const badge = ROLE_BADGE[u.role] || ROLE_BADGE.staff;
                  return (
                    <tr key={u._id}>
                      <td style={{ color: '#9ca3af', fontSize: '12px' }}>{i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: badge.bg, color: badge.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#111827' }}>{u.name}</div>
                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: '20px', fontWeight: 600, fontSize: '12px' }}>{badge.label}</span></td>
                      <td style={{ color: '#374151' }}>{u.phone || '—'}</td>
                      <td>
                        <span style={{ background: u.isActive ? '#dcfce7' : '#fee2e2', color: u.isActive ? '#16a34a' : '#dc2626', padding: '3px 10px', borderRadius: '20px', fontWeight: 600, fontSize: '12px' }}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ color: '#374151', fontSize: '13px' }}>
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : 'Never'}
                      </td>
                      <td style={{ color: '#374151', fontSize: '13px' }}>
                        {new Date(u.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: '32px' }}>No employees found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
