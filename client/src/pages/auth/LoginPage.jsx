import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import toast from 'react-hot-toast';

const demoCredentials = [
  { role: 'admin', email: 'admin@shiptrack.com', password: 'Admin@123' },
  { role: 'manager', email: 'manager@shiptrack.com', password: 'Manager@123' },
  { role: 'staff', email: 'staff1@shiptrack.com', password: 'Staff@123' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please enter email and password');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const routes = { admin: '/admin', manager: '/manager', staff: '/staff' };
      navigate(routes[user.role] || '/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillCred = (cred) => setForm({ email: cred.email, password: cred.password });

  return (
    <div className="login-page">
      <div className="login-bg" />

      {/* Floating grid lines */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(79,142,247,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(79,142,247,0.03) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        pointerEvents: 'none',
      }} />

      <div className="login-card slide-up">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">🚚</div>
          <h1 className="login-title">ShipTrack Pro</h1>
          <p className="login-subtitle">Codec Technologies — Shipping Management System</p>
        </div>

        {/* Demo Credentials */}
        <div className="demo-creds">
          <div className="demo-creds-title">⚡ Quick Login (Click to fill)</div>
          {demoCredentials.map((c) => (
            <div key={c.role} className="demo-cred-item" onClick={() => fillCred(c)}>
              <span className="demo-cred-role">{c.role.toUpperCase()}</span>
              <span className="demo-cred-email">{c.email}</span>
              <span className="demo-cred-pass">{c.password}</span>
            </div>
          ))}
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
                className="form-input input-with-icon"
                placeholder="Enter your email"
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
                className="form-input input-with-icon"
                placeholder="Enter your password"
                style={{ paddingRight: '42px' }}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</>
            ) : '🔐 Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
          🔒 Secured with JWT Authentication & bcrypt encryption
        </div>
      </div>
    </div>
  );
}
