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

  const handleDemoClick = () => {
    setForm({ email: 'staff1@shiptrack.com', password: 'Staff@123' });
    toast.success('Demo Staff credentials filled!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please enter email and password');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== 'staff') {
        toast.error('This portal is restricted to Delivery Staff & Vessel Crew only');
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
      <div className="role-login-bg">
        <div className="blob blob-1" style={{ background: 'radial-gradient(circle, #e8380d, transparent)' }} />
        <div className="blob blob-2" style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
        <div className="grid-lines" />
      </div>

      <Link to="/" className="back-to-portal">
        ← Back to Gateways
      </Link>

      <div className="role-login-card slide-up">
        <div className="role-login-badge staff-badge" style={{ borderColor: '#e8380d', color: '#e8380d' }}>
          <MdBadge size={18} />
          STAFF GATEWAY
        </div>

        <div className="role-login-logo">
          <div className="role-login-icon staff-icon" style={{ background: 'linear-gradient(135deg, #e8380d, #f59e0b)' }}>👷</div>
          <h1 className="role-login-title">Operations Portal</h1>
          <p className="role-login-subtitle">Report logbooks, view active routes & assign status</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Operations Email</label>
            <div className="input-group">
              <MdEmail className="input-icon" size={18} />
              <input
                name="email" type="email" value={form.email}
                onChange={handleChange}
                className="form-input input-with-icon role-input"
                placeholder="staff1@shiptrack.com"
                required
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
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="role-login-btn staff-login-btn" style={{ background: 'linear-gradient(135deg, #e8380d, #f59e0b)' }} disabled={loading}>
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: 'white' }} /> Initializing...</>
            ) : '🔐 Staff Login'}
          </button>
        </form>

        <div className="demo-credentials-card" onClick={handleDemoClick}>
          <div className="demo-badge" style={{ background: '#fff5f5', color: '#e8380d' }}>DEMO ACCESS</div>
          <div className="demo-details">
            <div><strong>Email:</strong> staff1@shiptrack.com</div>
            <div><strong>Pass:</strong> Staff@123</div>
          </div>
          <div className="demo-click-hint">Click here to auto-fill</div>
        </div>

        <div className="role-login-footer">
          🔒 TLS 1.3 Encrypted • Operations Terminal Active
        </div>
      </div>
    </div>
  );
}
