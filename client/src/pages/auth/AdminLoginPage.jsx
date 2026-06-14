import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdAdminPanelSettings } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Email aur password daalein');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== 'admin') {
        toast.error('Yeh portal sirf Admin ke liye hai');
        localStorage.removeItem('shiptrack_token');
        localStorage.removeItem('shiptrack_user');
        return;
      }
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="role-login-page admin-login-page">
      {/* Animated background blobs */}
      <div className="role-login-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="grid-lines" />
      </div>

      {/* Back to portal selector */}
      <Link to="/" className="back-to-portal">
        ← Portal Seçimi
      </Link>

      <div className="role-login-card slide-up">
        {/* Role Badge */}
        <div className="role-login-badge admin-badge">
          <MdAdminPanelSettings size={20} />
          ADMIN PORTAL
        </div>

        {/* Logo */}
        <div className="role-login-logo">
          <div className="role-login-icon admin-icon">👑</div>
          <h1 className="role-login-title">Admin Dashboard</h1>
          <p className="role-login-subtitle">ShipTrack Pro — Administrative Access</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-group">
              <MdEmail className="input-icon" size={18} />
              <input
                name="email" type="email" value={form.email}
                onChange={handleChange}
                className="form-input input-with-icon role-input"
                placeholder="admin@company.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-group" style={{ position: 'relative' }}>
              <MdLock className="input-icon" size={18} />
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                className="form-input input-with-icon role-input"
                placeholder="••••••••"
                style={{ paddingRight: '42px' }}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="role-login-btn admin-login-btn"
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: 'white' }} /> Signing in...</>
            ) : '🔐 Admin Login'}
          </button>
        </form>

        <div className="role-login-footer">
          🔒 Secured with JWT Authentication & bcrypt encryption
        </div>
      </div>
    </div>
  );
}
