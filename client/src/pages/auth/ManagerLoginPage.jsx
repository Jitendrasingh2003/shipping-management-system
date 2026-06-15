import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdBusiness } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function ManagerLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleDemoClick = () => {
    setForm({ email: 'manager@shiptrack.com', password: 'Manager@123' });
    toast.success('Demo Corporate Manager credentials filled!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please enter email and password');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== 'manager') {
        toast.error('This portal is restricted to Corporate Managers only');
        localStorage.removeItem('shiptrack_token');
        localStorage.removeItem('shiptrack_user');
        return;
      }
      navigate('/manager');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="role-login-page manager-login-page">
      <div className="role-login-bg">
        <div className="blob blob-1" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
        <div className="blob blob-2" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
        <div className="grid-lines" />
      </div>

      <Link to="/" className="back-to-portal">
        ← Back to Gateways
      </Link>

      <div className="role-login-card slide-up">
        <div className="role-login-badge manager-badge" style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}>
          <MdBusiness size={18} />
          CORPORATE PORTAL
        </div>

        <div className="role-login-logo">
          <div className="role-login-icon manager-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}>🏢</div>
          <h1 className="role-login-title">Company Workspace</h1>
          <p className="role-login-subtitle">Control shipping records, vessels & personnel</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Corporate Email</label>
            <div className="input-group">
              <MdEmail className="input-icon" size={18} />
              <input
                name="email" type="email" value={form.email}
                onChange={handleChange}
                className="form-input input-with-icon role-input"
                placeholder="manager@shiptrack.com"
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

          <button type="submit" className="role-login-btn manager-login-btn" style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }} disabled={loading}>
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: 'white' }} /> Initializing...</>
            ) : '🔐 Corporate Login'}
          </button>
        </form>

        <div className="demo-credentials-card" onClick={handleDemoClick}>
          <div className="demo-badge" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>DEMO ACCESS</div>
          <div className="demo-details">
            <div><strong>Email:</strong> manager@shiptrack.com</div>
            <div><strong>Pass:</strong> Manager@123</div>
          </div>
          <div className="demo-click-hint">Click here to auto-fill</div>
        </div>

        <div className="role-login-footer">
          Don't have an account? <Link to="/manager/register" style={{ color: '#8b5cf6', fontWeight: 600, textDecoration: 'none' }}>Register Company</Link>
        </div>
      </div>
    </div>
  );
}
