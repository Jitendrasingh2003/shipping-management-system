import { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import { MdClose } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function UserModal({ user, onClose, onSuccess }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'staff',
    phone: user?.phone || '',
    isActive: user?.isActive !== undefined ? user.isActive : true,
  });
  const [loading, setLoading] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return toast.error('Name and email are required');
    if (!isEdit && !form.password) return toast.error('Password is required for new users');

    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (isEdit) {
        await userAPI.update(user.id, payload);
        toast.success('User updated successfully!');
      } else {
        await userAPI.create(payload);
        toast.success('User created successfully!');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? '✏️ Edit User' : '👤 Create New User'}</div>
          <button className="modal-close" onClick={onClose}><MdClose /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name <span className="required">*</span></label>
                <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address <span className="required">*</span></label>
                <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Password {!isEdit && <span className="required">*</span>}
                  {isEdit && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(leave blank to keep current)</span>}
                </label>
                <input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder={isEdit ? 'New password (optional)' : 'Password'} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91-9876543210" />
              </div>
              <div className="form-group">
                <label className="form-label">Role <span className="required">*</span></label>
                <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="admin">👑 Admin</option>
                  <option value="manager">📦 Warehouse Manager</option>
                  <option value="staff">🚚 Delivery Personnel</option>
                </select>
              </div>
              {isEdit && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={String(form.isActive)} onChange={e => set('isActive', e.target.value === 'true')}>
                    <option value="true">✅ Active</option>
                    <option value="false">🚫 Inactive</option>
                  </select>
                </div>
              )}
            </div>

            {!isEdit && (
              <div className="alert alert-info" style={{ marginTop: '8px' }}>
                <span>ℹ️</span>
                <span>Default password is <strong>ShipTrack@123</strong> if not specified. User will receive a welcome notification.</span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> {isEdit ? 'Saving...' : 'Creating...'}</> : isEdit ? '💾 Save Changes' : '✅ Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
