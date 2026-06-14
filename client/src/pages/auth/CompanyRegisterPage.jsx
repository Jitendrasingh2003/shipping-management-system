import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { MdVisibility, MdVisibilityOff, MdBusiness } from 'react-icons/md';
import toast from 'react-hot-toast';

const COUNTRIES = [
  'India','United States','United Kingdom','United Arab Emirates','Singapore',
  'Australia','Canada','Germany','Japan','China','France','Italy','Spain',
  'Netherlands','Norway','Denmark','Greece','South Korea','Malaysia','Indonesia',
  'Saudi Arabia','Qatar','Kuwait','Bahrain','Oman','Pakistan','Bangladesh',
  'Sri Lanka','Philippines','Thailand','Vietnam','South Africa','Nigeria',
  'Kenya','Egypt','Brazil','Mexico','Argentina','Turkey','Russia',
];

export default function CompanyRegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    companyName: '', companyEmail: '', companyAltEmail: '',
    companyPhone: '', country: '', city: '', state: '', zip: '', officeAddress: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) return toast.error('Please agree to Terms & Conditions');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      const res = await authAPI.register(form);
      const { token, user } = res.data;
      localStorage.setItem('shiptrack_token', token);
      localStorage.setItem('shiptrack_user', JSON.stringify(user));
      toast.success('Company registered successfully! 🎉');
      navigate('/manager/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="company-reg-page">
      {/* Background */}
      <div className="company-reg-bg" />

      <div className="company-reg-wrapper">
        {/* Header */}
        <div className="company-reg-header">
          <div className="company-reg-brand">
            <MdBusiness size={18} />
            ShipTrack Pro — Shipping Management System
          </div>
          <h1 className="company-reg-title">New Company Registration</h1>
        </div>

        <form className="company-reg-form" onSubmit={handleSubmit}>
          {/* ── USER INFORMATION ── */}
          <div className="company-reg-section-title">User Information</div>
          <div className="company-reg-grid-4">
            <div className="form-group">
              <label className="creg-label">Full Name <span className="req">*</span></label>
              <input name="name" type="text" value={form.name} onChange={handleChange}
                className="creg-input" placeholder="Enter your name" required />
            </div>
            <div className="form-group">
              <label className="creg-label">Email Address <span className="req">*</span></label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="creg-input" placeholder="example@domain.com" required />
            </div>
            <div className="form-group">
              <label className="creg-label">Password <span className="req">*</span></label>
              <div style={{ position: 'relative' }}>
                <input name="password" type={showPass ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  className="creg-input" placeholder="Create password" required style={{ paddingRight: '40px' }} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="creg-eye-btn">
                  {showPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="creg-label">Confirm Password <span className="req">*</span></label>
              <div style={{ position: 'relative' }}>
                <input name="confirmPassword" type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword} onChange={handleChange}
                  className="creg-input" placeholder="Repeat password" required style={{ paddingRight: '40px' }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="creg-eye-btn">
                  {showConfirm ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="creg-divider" />

          {/* ── COMPANY INFORMATION ── */}
          <div className="company-reg-section-title">Company Information</div>

          {/* Row 1 */}
          <div className="company-reg-grid-5">
            <div className="form-group">
              <label className="creg-label">Company Name <span className="req">*</span></label>
              <input name="companyName" type="text" value={form.companyName} onChange={handleChange}
                className="creg-input" placeholder="Official company name" required />
            </div>
            <div className="form-group">
              <label className="creg-label">Company Official Email <span className="req">*</span></label>
              <input name="companyEmail" type="email" value={form.companyEmail} onChange={handleChange}
                className="creg-input" placeholder="company@domain.com" />
            </div>
            <div className="form-group">
              <label className="creg-label">Alternate Email (Optional)</label>
              <input name="companyAltEmail" type="email" value={form.companyAltEmail} onChange={handleChange}
                className="creg-input" placeholder="backup@domain.com" />
            </div>
            <div className="form-group">
              <label className="creg-label">Phone Number <span className="req">*</span></label>
              <input name="companyPhone" type="tel" value={form.companyPhone} onChange={handleChange}
                className="creg-input" placeholder="Number" />
            </div>
            <div className="form-group">
              <label className="creg-label">Country <span className="req">*</span></label>
              <select name="country" value={form.country} onChange={handleChange} className="creg-input creg-select" required>
                <option value="">Select Country</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2 */}
          <div className="company-reg-grid-4">
            <div className="form-group">
              <label className="creg-label">City <span className="req">*</span></label>
              <input name="city" type="text" value={form.city} onChange={handleChange}
                className="creg-input" placeholder="City name" />
            </div>
            <div className="form-group">
              <label className="creg-label">State / Region <span className="req">*</span></label>
              <input name="state" type="text" value={form.state} onChange={handleChange}
                className="creg-input" placeholder="State/Region" />
            </div>
            <div className="form-group">
              <label className="creg-label">ZIP / Postal Code <span className="req">*</span></label>
              <input name="zip" type="text" value={form.zip} onChange={handleChange}
                className="creg-input" placeholder="Zip code" />
            </div>
            <div className="form-group">
              <label className="creg-label">Office Address <span className="req">*</span></label>
              <input name="officeAddress" type="text" value={form.officeAddress} onChange={handleChange}
                className="creg-input" placeholder="Complete street address" />
            </div>
          </div>

          {/* Terms */}
          <div className="creg-terms">
            <input type="checkbox" id="terms" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              className="creg-checkbox" />
            <label htmlFor="terms" className="creg-terms-label">
              I agree to the <span className="creg-terms-link">Terms & Conditions</span>
            </label>
          </div>

          {/* Submit */}
          <button type="submit" className="creg-submit-btn" disabled={loading || !agreed}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Registering...</> : 'Submit Registration'}
          </button>

          <div className="creg-login-link">
            Already have an account?{' '}
            <Link to="/manager/login" className="creg-login-anchor">Log in here</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
