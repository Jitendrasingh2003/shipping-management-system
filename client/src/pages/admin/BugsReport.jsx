import { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { bugAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { MdBugReport, MdAdd, MdClose, MdSearch } from 'react-icons/md';

const PRIORITY_STYLE = {
  low:      { bg: '#f0fdf4', color: '#16a34a', label: 'Low' },
  medium:   { bg: '#fef9c3', color: '#b45309', label: 'Medium' },
  high:     { bg: '#ffedd5', color: '#c2410c', label: 'High' },
  critical: { bg: '#fee2e2', color: '#dc2626', label: 'Critical' },
};
const STATUS_STYLE = {
  open:        { bg: '#fee2e2', color: '#dc2626', label: 'Open' },
  'in-progress':{ bg: '#dbeafe', color: '#2563eb', label: 'In Progress' },
  resolved:    { bg: '#dcfce7', color: '#16a34a', label: 'Resolved' },
  closed:      { bg: '#f3f4f6', color: '#6b7280', label: 'Closed' },
};

export default function BugsReport() {
  const [bugs,    setBugs]    = useState([]);
  const [stats,   setStats]   = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm,setShowForm]= useState(false);
  const [search,  setSearch]  = useState('');
  const [statusF, setStatusF] = useState('');
  const [priorityF,setPriorityF]=useState('');
  const [form,    setForm]    = useState({ title: '', description: '', priority: 'medium', category: 'Other' });
  const [submitting,setSubmitting]=useState(false);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([bugAPI.getAll(), bugAPI.getStats()])
      .then(([bugsRes, statsRes]) => {
        setBugs(bugsRes.data.data || []);
        setStats(statsRes.data.data || {});
      })
      .catch(() => toast.error('Failed to load bugs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) return toast.error('Please fill all required fields');
    setSubmitting(true);
    try {
      await bugAPI.create(form);
      toast.success('Bug report submitted!');
      setShowForm(false);
      setForm({ title: '', description: '', priority: 'medium', category: 'Other' });
      fetchAll();
    } catch { toast.error('Failed to submit bug report'); }
    finally { setSubmitting(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await bugAPI.update(id, { status });
      toast.success('Status updated');
      fetchAll();
    } catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bug report?')) return;
    try { await bugAPI.delete(id); toast.success('Deleted'); fetchAll(); }
    catch { toast.error('Failed to delete'); }
  };

  const filtered = bugs.filter(b => {
    const q = search.toLowerCase();
    return (!search || b.title.toLowerCase().includes(q) || b.description.toLowerCase().includes(q))
      && (!statusF   || b.status   === statusF)
      && (!priorityF || b.priority === priorityF);
  });

  return (
    <AppLayout title="Bugs & Reports" subtitle="Track and manage bug reports and system issues">

      <div className="dashboard-hero" style={{ marginBottom: '24px' }}>
        <div className="dashboard-hero-top">
          <div><h1>Bugs & <span>Reports</span></h1><p>Track, assign, and resolve system issues.</p></div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="fleet-status-badge">🐛 {stats.open || 0} Open</div>
            <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MdAdd /> Report Bug
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {[
          { label: 'Total Bugs',   value: stats.total      || 0, color: '#374151', bg: '#f9fafb' },
          { label: 'Open',         value: stats.open       || 0, color: '#dc2626', bg: '#fee2e2' },
          { label: 'In Progress',  value: stats.inProgress || 0, color: '#2563eb', bg: '#dbeafe' },
          { label: 'Resolved',     value: stats.resolved   || 0, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Critical',     value: stats.critical   || 0, color: '#7c3aed', bg: '#ede9fe' },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <div className="stat-info"><div className="stat-label">{c.label}</div><div className="stat-value" style={{ color: c.color }}>{c.value}</div></div>
            <div className="stat-icon-wrap" style={{ background: c.bg, color: c.color }}><MdBugReport /></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
            <MdSearch className="search-icon" />
            <input className="search-input" placeholder="Search bugs…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-input" style={{ width: '160px' }} value={statusF} onChange={e => setStatusF(e.target.value)}>
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select className="form-input" style={{ width: '160px' }} value={priorityF} onChange={e => setPriorityF(e.target.value)}>
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Report Bug Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>🐛 Report a Bug</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}><MdClose /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
              <div>
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Brief bug title…" required />
              </div>
              <div>
                <label className="form-label">Description *</label>
                <textarea className="form-input" rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the bug in detail…" required style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Priority</label>
                  <select className="form-input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <select className="form-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {['UI', 'Backend', 'Database', 'Performance', 'Security', 'Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Bug Report'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bug Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">🐛 Bug Reports</div>
          <div style={{ color: '#6b7280', fontSize: '13px' }}>{filtered.length} reports</div>
        </div>
        {loading ? <div className="loading-container"><div className="spinner" /></div> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Reporter</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((bug, i) => {
                  const pri = PRIORITY_STYLE[bug.priority] || PRIORITY_STYLE.medium;
                  const sta = STATUS_STYLE[bug.status]   || STATUS_STYLE.open;
                  return (
                    <tr key={bug._id}>
                      <td style={{ color: '#9ca3af', fontSize: '12px' }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{bug.title}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bug.description}</div>
                      </td>
                      <td><span style={{ background: '#f3f4f6', color: '#374151', padding: '3px 10px', borderRadius: '20px', fontSize: '12px' }}>{bug.category}</span></td>
                      <td><span style={{ background: pri.bg, color: pri.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>{pri.label}</span></td>
                      <td>
                        <select
                          style={{ background: sta.bg, color: sta.color, border: 'none', borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          value={bug.status}
                          onChange={e => handleStatusChange(bug._id, e.target.value)}
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                      <td style={{ fontSize: '13px', color: '#374151' }}>{bug.reporterName || '—'}</td>
                      <td style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(bug.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        <button onClick={() => handleDelete(bug._id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: '32px' }}>No bug reports found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
