import { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { companyAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { MdBusiness, MdEdit, MdSave, MdClose, MdLocationOn, MdPhone, MdEmail, MdLanguage, MdDirectionsBoat } from 'react-icons/md';

const FLEET_STATUS_COLORS = {
  Optimal:     { bg: '#dcfce7', color: '#16a34a', dot: '#22c55e' },
  Degraded:    { bg: '#fef9c3', color: '#b45309', dot: '#f59e0b' },
  Maintenance: { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  Critical:    { bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' },
};

export default function CompanySettings() {
  const [company, setCompany] = useState(null);
  const [form,    setForm]    = useState({});
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCompany = () => {
    setLoading(true);
    companyAPI.get()
      .then(res => { setCompany(res.data.data); setForm(res.data.data); })
      .catch(() => toast.error('Failed to load company info'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCompany(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await companyAPI.update(form);
      setCompany(res.data.data);
      setEditing(false);
      toast.success('Company profile updated!');
    } catch {
      toast.error('Failed to update company profile');
    } finally {
      setSaving(false);
    }
  };

  const statusStyle = FLEET_STATUS_COLORS[company?.fleetStatus] || FLEET_STATUS_COLORS.Optimal;

  if (loading) return (
    <AppLayout title="Company Settings" subtitle="Manage your company profile">
      <div className="loading-container"><div className="spinner" /><div className="loading-text">Loading...</div></div>
    </AppLayout>
  );

  return (
    <AppLayout title="Company Settings" subtitle="Manage company profile and fleet status">

      {/* Hero */}
      <div className="dashboard-hero" style={{ marginBottom: '24px' }}>
        <div className="dashboard-hero-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: '#fff' }}>
              <MdBusiness />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>{company?.name || 'Company Name'}</h1>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{company?.tagline || 'Your company tagline'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ background: statusStyle.bg, color: statusStyle.color, padding: '8px 16px', borderRadius: '20px', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusStyle.dot, display: 'inline-block' }} />
              Fleet: {company?.fleetStatus || 'Optimal'}
            </div>
            {!editing
              ? <button className="btn btn-primary" onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MdEdit /> Edit Profile</button>
              : <>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MdSave /> {saving ? 'Saving…' : 'Save Changes'}</button>
                  <button className="btn btn-secondary" onClick={() => { setEditing(false); setForm(company); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MdClose /> Cancel</button>
                </>
            }
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Basic Info */}
        <div className="card">
          <div className="card-header"><div className="card-title">🏢 Basic Information</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
            {[
              { label: 'Company Name',  key: 'name',    icon: <MdBusiness /> },
              { label: 'Tagline',       key: 'tagline', icon: <MdBusiness /> },
              { label: 'Website',       key: 'website', icon: <MdLanguage /> },
              { label: 'Founded Year',  key: 'founded', icon: <MdBusiness /> },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '4px', display: 'block' }}>{f.label}</label>
                {editing
                  ? <input className="form-input" value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  : <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111827', fontWeight: 500 }}>{f.icon} {company?.[f.key] || '—'}</div>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="card">
          <div className="card-header"><div className="card-title">📞 Contact Information</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
            {[
              { label: 'Email',    key: 'email',   icon: <MdEmail /> },
              { label: 'Phone',    key: 'phone',   icon: <MdPhone /> },
              { label: 'Address',  key: 'address', icon: <MdLocationOn /> },
              { label: 'City',     key: 'city',    icon: <MdLocationOn /> },
              { label: 'Country',  key: 'country', icon: <MdLocationOn /> },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '4px', display: 'block' }}>{f.label}</label>
                {editing
                  ? <input className="form-input" value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  : <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111827', fontWeight: 500 }}>{f.icon} {company?.[f.key] || '—'}</div>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Legal & Fleet */}
        <div className="card">
          <div className="card-header"><div className="card-title">📄 Legal & Compliance</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
            {[
              { label: 'GST Number',    key: 'gstNumber'  },
              { label: 'PAN Number',    key: 'panNumber'  },
              { label: 'License No.',   key: 'licenseNo'  },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '4px', display: 'block' }}>{f.label}</label>
                {editing
                  ? <input className="form-input" value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  : <div style={{ color: '#111827', fontWeight: 500, fontFamily: 'monospace' }}>{company?.[f.key] || '—'}</div>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Fleet Status */}
        <div className="card">
          <div className="card-header"><div className="card-title"><MdDirectionsBoat style={{ verticalAlign: 'middle' }} /> Fleet Configuration</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '4px', display: 'block' }}>Fleet Status</label>
              {editing
                ? <select className="form-input" value={form.fleetStatus || 'Optimal'} onChange={e => setForm(p => ({ ...p, fleetStatus: e.target.value }))}>
                    {['Optimal', 'Degraded', 'Maintenance', 'Critical'].map(s => <option key={s}>{s}</option>)}
                  </select>
                : <div style={{ background: statusStyle.bg, color: statusStyle.color, padding: '8px 16px', borderRadius: '12px', fontWeight: 700, display: 'inline-block' }}>
                    {company?.fleetStatus || 'Optimal'}
                  </div>
              }
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '4px', display: 'block' }}>Total Fleet Size</label>
              {editing
                ? <input className="form-input" type="number" value={form.totalFleet || 0} onChange={e => setForm(p => ({ ...p, totalFleet: Number(e.target.value) }))} />
                : <div style={{ fontSize: '32px', fontWeight: 800, color: '#4f8ef7' }}>{company?.totalFleet || 0} <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>vessels</span></div>
              }
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
