import { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { enquiryAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { MdClose, MdSearch, MdMail, MdReply, MdDelete } from 'react-icons/md';

const STATUS_STYLE = {
  new:     { bg: '#fee2e2', color: '#dc2626', label: 'New' },
  read:    { bg: '#fef9c3', color: '#b45309', label: 'Read' },
  replied: { bg: '#dcfce7', color: '#16a34a', label: 'Replied' },
  closed:  { bg: '#f3f4f6', color: '#6b7280', label: 'Closed' },
};

export default function GeneralEnquiry() {
  const [enquiries, setEnquiries] = useState([]);
  const [stats,     setStats]     = useState({});
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [statusF,   setStatusF]   = useState('');
  const [selected,  setSelected]  = useState(null);
  const [reply,     setReply]     = useState('');
  const [replying,  setReplying]  = useState(false);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([enquiryAPI.getAll(), enquiryAPI.getStats()])
      .then(([enqRes, statsRes]) => {
        setEnquiries(enqRes.data.data || []);
        setStats(statsRes.data.data || {});
      })
      .catch(() => toast.error('Failed to load enquiries'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const openEnquiry = async (enq) => {
    setSelected(enq);
    setReply('');
    if (enq.status === 'new') {
      try {
        await enquiryAPI.update(enq._id, { status: 'read' });
        fetchAll();
      } catch { /* silent */ }
    }
  };

  const handleReply = async () => {
    if (!reply.trim()) return toast.error('Please write a reply');
    setReplying(true);
    try {
      await enquiryAPI.update(selected._id, { reply, status: 'replied' });
      toast.success('Reply saved!');
      setSelected(null);
      fetchAll();
    } catch { toast.error('Failed to save reply'); }
    finally { setReplying(false); }
  };

  const handleStatusChange = async (id, status) => {
    try { await enquiryAPI.update(id, { status }); fetchAll(); }
    catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this enquiry?')) return;
    try { await enquiryAPI.delete(id); toast.success('Deleted'); fetchAll(); if (selected?._id === id) setSelected(null); }
    catch { toast.error('Failed to delete'); }
  };

  const filtered = enquiries.filter(e => {
    const q = search.toLowerCase();
    return (!search || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q))
      && (!statusF || e.status === statusF);
  });

  return (
    <AppLayout title="General Enquiry" subtitle="Manage customer and public enquiries">

      <div className="dashboard-hero" style={{ marginBottom: '24px' }}>
        <div className="dashboard-hero-top">
          <div><h1>General <span>Enquiry</span></h1><p>Manage incoming customer enquiries and messages.</p></div>
          <div className="fleet-status-badge">📩 {stats.new || 0} New</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {[
          { label: 'Total',   value: stats.total   || 0, color: '#374151', bg: '#f9fafb' },
          { label: 'New',     value: stats.new     || 0, color: '#dc2626', bg: '#fee2e2' },
          { label: 'Read',    value: stats.read    || 0, color: '#b45309', bg: '#fef9c3' },
          { label: 'Replied', value: stats.replied || 0, color: '#16a34a', bg: '#dcfce7' },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <div className="stat-info"><div className="stat-label">{c.label}</div><div className="stat-value" style={{ color: c.color }}>{c.value}</div></div>
            <div className="stat-icon-wrap" style={{ background: c.bg, color: c.color }}><MdMail /></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
            <MdSearch className="search-icon" />
            <input className="search-input" placeholder="Search enquiries…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-input" style={{ width: '160px' }} value={statusF} onChange={e => setStatusF(e.target.value)}>
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* View Enquiry Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>📩 Enquiry Details</h3>
              <button className="modal-close" onClick={() => setSelected(null)}><MdClose /></button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#111827', fontSize: '16px' }}>{selected.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '13px' }}>{selected.email} {selected.phone && `· ${selected.phone}`}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(selected.createdAt).toLocaleString('en-IN')}</div>
                </div>
                <div style={{ fontWeight: 700, color: '#374151', marginBottom: '8px' }}>Subject: {selected.subject}</div>
                <div style={{ color: '#374151', lineHeight: 1.6 }}>{selected.message}</div>
              </div>
              {selected.reply && (
                <div style={{ background: '#dcfce7', borderRadius: '12px', padding: '16px', borderLeft: '4px solid #16a34a' }}>
                  <div style={{ fontWeight: 700, color: '#16a34a', marginBottom: '8px' }}>✅ Previous Reply</div>
                  <div style={{ color: '#374151' }}>{selected.reply}</div>
                </div>
              )}
              <div>
                <label className="form-label">Write Reply</label>
                <textarea className="form-input" rows={4} value={reply} onChange={e => setReply(e.target.value)} placeholder="Type your reply here…" style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
                <button className="btn btn-primary" onClick={handleReply} disabled={replying} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MdReply /> {replying ? 'Saving…' : 'Save Reply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enquiry Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">📩 Enquiries Inbox</div>
          <div style={{ color: '#6b7280', fontSize: '13px' }}>{filtered.length} enquiries</div>
        </div>
        {loading ? <div className="loading-container"><div className="spinner" /></div> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Sender</th><th>Subject</th><th>Status</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => {
                  const sta = STATUS_STYLE[e.status] || STATUS_STYLE.new;
                  return (
                    <tr key={e._id} style={{ cursor: 'pointer', fontWeight: e.status === 'new' ? 700 : 400 }}>
                      <td style={{ color: '#9ca3af', fontSize: '12px' }}>{i + 1}</td>
                      <td onClick={() => openEnquiry(e)}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{e.name}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>{e.email}</div>
                      </td>
                      <td onClick={() => openEnquiry(e)} style={{ color: '#374151', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.subject}</td>
                      <td>
                        <select
                          style={{ background: sta.bg, color: sta.color, border: 'none', borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          value={e.status}
                          onChange={ev => handleStatusChange(e._id, ev.target.value)}
                          onClick={ev => ev.stopPropagation()}
                        >
                          {Object.keys(STATUS_STYLE).map(s => <option key={s} value={s}>{STATUS_STYLE[s].label}</option>)}
                        </select>
                      </td>
                      <td style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(e.createdAt).toLocaleDateString('en-IN')}</td>
                      <td style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openEnquiry(e)} style={{ background: '#dbeafe', color: '#2563eb', border: 'none', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>View</button>
                        <button onClick={() => handleDelete(e._id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Del</button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: '32px' }}>No enquiries found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
