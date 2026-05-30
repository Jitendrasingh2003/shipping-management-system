import { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { userAPI } from '../../services/api';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdBlock, MdCheckCircle } from 'react-icons/md';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import UserModal from '../../components/users/UserModal';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userAPI.getAll({ search, role: roleFilter });
      setUsers(res.data.users);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleActive = async (user) => {
    try {
      await userAPI.update(user.id, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch { toast.error('Failed to update user'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await userAPI.delete(id);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const avatarColors = { admin: 'linear-gradient(135deg, #ef4444, #dc2626)', manager: 'linear-gradient(135deg, #f59e0b, #d97706)', staff: 'linear-gradient(135deg, #22c55e, #16a34a)' };

  return (
    <AppLayout title="User Management" subtitle="Manage system users and access">
      <div className="page-header">
        <div className="page-header-left">
          <h1>User Management</h1>
          <p>Control access and roles for all system users</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><MdAdd /> Add User</button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '20px' }}>
        {[
          { label: 'Total Users', value: users.length, color: 'blue' },
          { label: 'Active', value: users.filter(u => u.isActive).length, color: 'green' },
          { label: 'Inactive', value: users.filter(u => !u.isActive).length, color: 'red' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-info">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-search">
            <MdSearch className="table-search-icon" size={18} />
            <input placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="table-filters">
            <select className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: avatarColors[u.role], display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
                      }}>{initials(u.name)}</div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{u.email}</td>
                  <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                  <td style={{ fontSize: '13px' }}>{u.phone || '—'}</td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-delivered' : 'badge-cancelled'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {u.lastLogin ? format(new Date(u.lastLogin), 'dd MMM yyyy') : 'Never'}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {format(new Date(u.createdAt), 'dd MMM yyyy')}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => setSelectedUser(u)}>
                        <MdEdit size={16} />
                      </button>
                      <button className="btn btn-ghost btn-icon" title={u.isActive ? 'Deactivate' : 'Activate'}
                        onClick={() => handleToggleActive(u)}
                        style={{ color: u.isActive ? 'var(--warning)' : 'var(--success)' }}>
                        {u.isActive ? <MdBlock size={16} /> : <MdCheckCircle size={16} />}
                      </button>
                      <button className="btn btn-ghost btn-icon" title="Delete" onClick={() => handleDelete(u.id)}
                        style={{ color: 'var(--danger)' }}>
                        <MdDelete size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(showCreate || selectedUser) && (
        <UserModal
          user={selectedUser}
          onClose={() => { setSelectedUser(null); setShowCreate(false); }}
          onSuccess={() => { setSelectedUser(null); setShowCreate(false); fetchUsers(); }}
        />
      )}
    </AppLayout>
  );
}
