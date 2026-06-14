import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdBadge } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function StaffLoginPage() {
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
      if (user.role !== 'staff') {
        toast.error('Yeh portal sirf Staff ke liye hai');
        localStorage.removeItem('shiptrack_token');
        localStorage.removeItem('shiptrack_user');
        return;
      }
      navigate('/staff');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="role-login-page staff-login-page">
      {/* Animated background blobs */}
      <div className="role-login-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="grid-lines" />
      </div>

      {/* Back to portal selector */}
      <Link to="/" className="back-to-portal">
        ← Back to Portal Selection
      </Link>

      <div className="role-login-card slide-up">
        {/* Role Badge */}
        <div className="role-login-badge staff-badge">
          <MdBadge size={20} />
          STAFF PORTAL
        </div>

        {/* Logo */}
        <div className="role-login-logo">
          <div className="role-login-icon staff-icon">👷</div>
          <h1 className="role-login-title">Staff Dashboard</h1>
          <p className="role-login-subtitle">ShipTrack Pro — Delivery Operations</p>
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
                placeholder="staff@company.com"
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
            className="role-login-btn staff-login-btn"
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: 'white' }} /> Signing in...</>
            ) : '🔐 Staff Login'}
          </button>
        </form>

        <div className="role-login-footer">
          🔒 Secured with JWT Authentication & bcrypt encryption
        </div>
      </div>
    </div>
  );
}
