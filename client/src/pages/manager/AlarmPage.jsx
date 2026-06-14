import { useEffect, useState } from 'react';
import MarineLayout from './MarineLayout';
import { shipAPI, alarmAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function AlarmModal({ alarm, ships, defaultShipId, onClose, onSave }) {
  const [form, setForm] = useState(alarm || {
    shipId: defaultShipId || ships[0]?._id || '', category: 'General', title: '',
    status: 'Active', severity: 'warning', time: format(new Date(), 'HH:mm'),
  });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (alarm) { await alarmAPI.update(alarm._id, form); toast.success('Alarm updated!'); }
      else       { await alarmAPI.create(form);           toast.success('Alarm added!'); }
      onSave();
    } catch(err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="marine-modal-overlay" onClick={onClose}>
      <div className="marine-modal" onClick={e => e.stopPropagation()}>
        <div className="marine-modal-header">
          <h3 className="marine-modal-title">{alarm ? 'Edit Alarm' : 'Trigger Alarm'}</h3>
          <button onClick={onClose} className="marine-modal-close">✕</button>
        </div>
        <form onSubmit={submit} className="marine-modal-body">
          <div className="marine-form-grid">
            <div className="form-group">
              <label className="marine-label">Select Ship <span className="req">*</span></label>
              <select name="shipId" value={form.shipId} onChange={handle} required className="marine-input marine-select">
                <option value="">-- Select Ship --</option>
                {ships.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="marine-label">Alarm Category</label>
              <input name="category" value={form.category} onChange={handle} className="marine-input" placeholder="e.g. Navigation, Machinery" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="marine-label">Alarm Title <span className="req">*</span></label>
              <input name="title" value={form.title} onChange={handle} required className="marine-input" placeholder="e.g. Jacket cooling water high temp" />
            </div>
            <div className="form-group">
              <label className="marine-label">Severity</label>
              <select name="severity" value={form.severity} onChange={handle} className="marine-input marine-select">
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="marine-label">Status</label>
              <select name="status" value={form.status} onChange={handle} className="marine-input marine-select">
                <option value="Active">Active</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
          <div className="marine-modal-footer">
            <button type="button" onClick={onClose} className="marine-btn-sec">Cancel</button>
            <button type="submit" className="marine-btn-red" disabled={loading}>
              {loading ? 'Saving...' : (alarm ? 'Update' : 'Trigger')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AlarmPage() {
  const [ships, setShips] = useState([]);
  const [alarms, setAlarms] = useState([]);
  const [selectedShip, setSelectedShip] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    shipAPI.getAll().then(r => {
      setShips(r.data.ships);
      if (r.data.ships.length > 0) setSelectedShip(r.data.ships[0]._id);
    }).catch(() => {});
  }, []);

  const loadAlarms = async () => {
    try {
      const params = selectedShip ? { shipId: selectedShip } : {};
      const r = await alarmAPI.getAll(params);
      setAlarms(r.data.alarms);
    } catch { toast.error('Failed to load alarms'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (selectedShip !== undefined) loadAlarms(); }, [selectedShip]);

  const handleDelete = async id => {
    if (!window.confirm('Delete this alarm?')) return;
    try { await alarmAPI.delete(id); toast.success('Deleted'); loadAlarms(); }
    catch { toast.error('Delete failed'); }
  };

  const getSeverityColor = s => ({ urgent: '#dc2626', high: '#ef4444', warning: '#f59e0b', info: '#3b82f6' }[s] || '#6b7280');

  return (
    <MarineLayout active="/manager/alarm">
      <div style={{ marginBottom: 20 }}>
        <label className="marine-label">Select Ship</label>
        <select value={selectedShip} onChange={e => setSelectedShip(e.target.value)} className="marine-filter-select" style={{ minWidth: 200, marginTop: 6 }}>
          <option value="">All Ships</option>
          {ships.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      <div className="marine-page-header">
        <h2 className="marine-page-title">🚨 Vessel Alarm Logs</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="marine-btn-red" onClick={() => setModal('add')}>+ Trigger Alarm</button>
        </div>
      </div>

      <div className="marine-table-wrap">
        <table className="marine-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>VESSEL</th>
              <th>CATEGORY</th>
              <th>TITLE</th>
              <th>SEVERITY</th>
              <th>STATUS</th>
              <th>LOGGED TIME</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</td></tr>
            ) : alarms.length === 0 ? (
              <tr><td colSpan={8} className="marine-no-data">No active alarms logged</td></tr>
            ) : alarms.map((a, i) => (
              <tr key={a._id} style={{ background: a.status === 'Active' ? '#fff55510' : 'none' }}>
                <td>{i + 1}</td>
                <td>{a.shipId?.name || '—'}</td>
                <td>{a.category}</td>
                <td style={{ fontWeight: 600 }}>{a.title}</td>
                <td>
                  <span className="marine-status-badge" style={{ color: getSeverityColor(a.severity), background: getSeverityColor(a.severity) + '18' }}>
                    {a.severity.toUpperCase()}
                  </span>
                </td>
                <td>
                  <span className="marine-status-badge" style={{ color: a.status === 'Active' ? '#ef4444' : '#16a34a', background: (a.status === 'Active' ? '#ef4444' : '#16a34a') + '18' }}>
                    {a.status}
                  </span>
                </td>
                <td>{format(new Date(a.createdAt), 'dd-MM-yyyy HH:mm')}</td>
                <td>
                  <div className="marine-actions">
                    <button className="marine-act-btn marine-act-edit" title="Edit" onClick={() => setModal(a)}>✏️</button>
                    <button className="marine-act-btn marine-act-del" title="Delete" onClick={() => handleDelete(a._id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <AlarmModal
          alarm={modal === 'add' ? null : modal}
          ships={ships}
          defaultShipId={selectedShip}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadAlarms(); }}
        />
      )}
    </MarineLayout>
  );
}
