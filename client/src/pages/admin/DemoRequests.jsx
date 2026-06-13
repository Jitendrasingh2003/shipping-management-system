import { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { demoAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { MdAdd, MdClose, MdSearch, MdCalendarToday, MdPerson, MdBusiness, MdPhone, MdEmail } from 'react-icons/md';

const STATUS_STYLE = {
  pending:   { bg: '#fef9c3', color: '#b45309',  label: 'Pending' },
  contacted: { bg: '#dbeafe', color: '#2563eb',  label: 'Contacted' },
  scheduled: { bg: '#ede9fe', color: '#7c3aed',  label: 'Scheduled' },
  completed: { bg: '#dcfce7', color: '#16a34a',  label: 'Completed' },
  closed:    { bg: '#f3f4f6', color: '#6b7280',  label: 'Closed' },
};

export default function DemoRequests() {
  const [demos,   setDemos]   = useState([]);
  const [stats,   setStats]   = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm,setShowForm]= useState(false);
  const [search,  setSearch]  = useState('');
  const [statusF, setStatusF] = useState('');
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([demoAPI.getAll(), demoAPI.getStats()])
      .then(([demosRes, statsRes]) => {
        setDemos(demosRes.data.data || []);
        setStats(statsRes.data.data || {});
      })
      .catch(() => toast.error('Failed to load demo requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return toast.error('Name and email are required');
    setSubmitting(true);
    try {
      await demoAPI.create(form);
      toast.success('Demo request added!');
      setShowForm(false);
      setForm({ name: '', email: '', company: '', phone: '', message: '' });
      fetchAll();
    } catch { toast.error('Failed to add demo request'); }
    finally { setSubmitting(false); }
  };

  const handleStatusChange = async (id, status) => {
    try { await demoAPI.update(id, { status }); toast.success('Status updated'); fetchAll(); }
    catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this demo request?')) return;
    try { await demoAPI.delete(id); toast.success('Deleted'); fetchAll(); }
    catch { toast.error('Failed to delete'); }
  };

  const filtered = demos.filter(d => {
    const q = search.toLowerCase();
    return (!search || d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q) || (d.company || '').toLowerCase().includes(q))
      && (!statusF || d.status === statusF);
  });

  return (
    <AppLayout title="Demo Requests" subtitle="Manage client demo requests and scheduling">

      <div className="dashboard-hero" style={{ marginBottom: '24px' }}>
        <div className="dashboard-hero-top">
          <div><h1>Demo <span>Requests</span></h1><p>Track and manage client demo scheduling requests.</p></div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="fleet-status-badge">📋 {stats.pending || 0} Pending</div>
            <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MdAdd /> Add Request</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {[
          { label: 'Total Requests', value: stats.total     || 0, color: '#374151', bg: '#f9fafb' },
          { label: 'Pending',        value: stats.pending   || 0, color: '#b45309', bg: '#fef9c3' },
          { label: 'Contacted',      value: stats.contacted || 0, color: '#2563eb', bg: '#dbeafe' },
          { label: 'Completed',      value: stats.completed || 0, color: '#16a34a', bg: '#dcfce7' },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <div className="stat-info"><div className="stat-label">{c.label}</div><div className="stat-value" style={{ color: c.color }}>{c.value}</div></div>
            <div className="stat-icon-wrap" style={{ background: c.bg, color: c.color }}><MdCalendarToday /></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
            <MdSearch className="search-icon" />
            <input className="search-input" placeholder="Search by name, email or company…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-input" style={{ width: '160px' }} value={statusF} onChange={e => setStatusF(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Add Demo Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>📋 Add Demo Request</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}><MdClose /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Client name" required />
                </div>
                <div>
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="client@company.com" required />
                </div>
                <div>
                  <label className="form-label">Company</label>
                  <input className="form-input" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Company name" />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" />
                </div>
              </div>
              <div>
                <label className="form-label">Message / Notes</label>
                <textarea className="form-input" rows={3} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Any special requirements…" style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Adding…' : 'Add Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requests Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">📋 Demo Requests</div>
          <div style={{ color: '#6b7280', fontSize: '13px' }}>{filtered.length} requests</div>
        </div>
        {loading ? <div className="loading-container"><div className="spinner" /></div> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Client</th><th>Company</th><th>Phone</th><th>Status</th><th>Received</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => {
                  const sta = STATUS_STYLE[d.status] || STATUS_STYLE.pending;
                  return (
                    <tr key={d._id}>
                      <td style={{ color: '#9ca3af', fontSize: '12px' }}>{i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                            {d.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#111827' }}>{d.name}</div>
                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>{d.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: '#374151' }}>{d.company || '—'}</td>
                      <td style={{ color: '#374151' }}>{d.phone || '—'}</td>
                      <td>
                        <select
                          style={{ background: sta.bg, color: sta.color, border: 'none', borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          value={d.status}
                          onChange={e => handleStatusChange(d._id, e.target.value)}
                        >
                          {Object.keys(STATUS_STYLE).map(s => <option key={s} value={s}>{STATUS_STYLE[s].label}</option>)}
                        </select>
                      </td>
                      <td style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(d.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        <button onClick={() => handleDelete(d._id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: '32px' }}>No demo requests found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
