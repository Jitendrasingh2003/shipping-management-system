import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MdVisibility, MdVisibilityOff, MdBusiness } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function ManagerLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Email aur password daalein');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== 'manager') {
        toast.error('Yeh portal sirf Company Admin ke liye hai');
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
    <div className="company-login-page">
      {/* Ocean / Ship background */}
      <div className="company-login-bg" />
      <div className="company-login-overlay" />

      {/* Login Card */}
      <div className="company-login-card slide-up">
        {/* Brand */}
        <div className="company-login-brand">
          <MdBusiness size={16} />
          ShipTrack Pro — Shipping Management System
        </div>

        <h1 className="company-login-title">Login</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="clabel">Email Address</label>
            <input
              name="email" type="email" value={form.email}
              onChange={handleChange}
              className="cinput"
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="clabel">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                className="cinput"
                placeholder="Enter your password"
                style={{ paddingRight: '44px' }}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="ceye-btn">
                {showPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className="company-login-row">
            <label className="company-remember">
              <input type="checkbox" name="remember" checked={form.remember} onChange={handleChange}
                className="company-checkbox" />
              Remember Me
            </label>
            <span className="company-forgot">Forgot Password?</span>
          </div>

          <button type="submit" className="company-login-btn" disabled={loading}>
            {loading
              ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</>
              : 'Login'
            }
          </button>
        </form>

        <div className="company-signup-link">
          Don't have an account?{' '}
          <Link to="/manager/register" className="company-signup-anchor">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
