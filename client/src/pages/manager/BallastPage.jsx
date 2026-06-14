import { useEffect, useState } from 'react';
import MarineLayout from './MarineLayout';
import { shipAPI, ballastAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function BallastModal({ log, ships, onClose, onSave }) {
  const [form, setForm] = useState(log || {
    shipId: ships[0]?._id || '', logDate: format(new Date(), 'yyyy-MM-dd'),
    tank: '', volume: '', salinity: '', status: 'Ballasted', location: '',
  });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (log) { await ballastAPI.update(log._id, form); toast.success('Log updated!'); }
      else     { await ballastAPI.create(form);           toast.success('Log entry added!'); }
      onSave();
    } catch(err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="marine-modal-overlay" onClick={onClose}>
      <div className="marine-modal" onClick={e => e.stopPropagation()}>
        <div className="marine-modal-header">
          <h3 className="marine-modal-title">{log ? 'Edit Ballast Entry' : 'Log Ballast Water Operation'}</h3>
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
              <label className="marine-label">Date</label>
              <input name="logDate" type="date" value={form.logDate} onChange={handle} required className="marine-input" />
            </div>
            <div className="form-group">
              <label className="marine-label">Tank Name</label>
              <input name="tank" value={form.tank} onChange={handle} required className="marine-input" placeholder="e.g. Forepeak, Double Bottom" />
            </div>
            <div className="form-group">
              <label className="marine-label">Volume (m³)</label>
              <input name="volume" value={form.volume} onChange={handle} required className="marine-input" placeholder="e.g. 350" />
            </div>
            <div className="form-group">
              <label className="marine-label">Salinity (PSU)</label>
              <input name="salinity" value={form.salinity} onChange={handle} required className="marine-input" placeholder="e.g. 32" />
            </div>
            <div className="form-group">
              <label className="marine-label">Operation</label>
              <select name="status" value={form.status} onChange={handle} className="marine-input marine-select">
                <option>Ballasted</option>
                <option>De-ballasted</option>
                <option>Exchanged</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="marine-label">Location / Port</label>
              <input name="location" value={form.location} onChange={handle} required className="marine-input" placeholder="e.g. Port of Singapore, Arabian Sea" />
            </div>
          </div>
          <div className="marine-modal-footer">
            <button type="button" onClick={onClose} className="marine-btn-sec">Cancel</button>
            <button type="submit" className="marine-btn-red" disabled={loading}>
              {loading ? 'Saving...' : (log ? 'Update' : 'Log Entry')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BallastPage() {
  const [ships, setShips] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedShip, setSelectedShip] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    shipAPI.getAll().then(r => {
      setShips(r.data.ships);
      if (r.data.ships.length > 0) setSelectedShip(r.data.ships[0]._id);
    }).catch(() => {});
  }, []);

  const loadLogs = async () => {
    try {
      const params = selectedShip ? { shipId: selectedShip } : {};
      const r = await ballastAPI.getAll(params);
      setLogs(r.data.logs);
    } catch { toast.error('Failed to load Ballast logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (selectedShip !== undefined) loadLogs(); }, [selectedShip]);

  const handleDelete = async id => {
    if (!window.confirm('Delete this entry?')) return;
    try { await ballastAPI.delete(id); toast.success('Deleted'); loadLogs(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <MarineLayout active="/manager/ballast">
      <div style={{ marginBottom: 20 }}>
        <label className="marine-label">Select Ship</label>
        <select value={selectedShip} onChange={e => setSelectedShip(e.target.value)} className="marine-filter-select" style={{ minWidth: 200, marginTop: 6 }}>
          <option value="">All Ships</option>
          {ships.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      <div className="marine-page-header">
        <h2 className="marine-page-title">🌊 Ballast Water Record Book Logs</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="marine-btn-red" onClick={() => setModal('add')}>+ Log Operation</button>
        </div>
      </div>

      <div className="marine-table-wrap">
        <table className="marine-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>VESSEL</th>
              <th>DATE</th>
              <th>TANK</th>
              <th>VOLUME</th>
              <th>SALINITY</th>
              <th>OPERATION</th>
              <th>LOCATION</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={9} className="marine-no-data">No ballast operations logged yet</td></tr>
            ) : logs.map((l, i) => (
              <tr key={l._id}>
                <td>{i + 1}</td>
                <td>{l.shipId?.name || '—'}</td>
                <td>{l.logDate}</td>
                <td style={{ fontWeight: 600 }}>{l.tank}</td>
                <td>{l.volume} m³</td>
                <td>{l.salinity} PSU</td>
                <td>
                  <span className="marine-status-badge" style={{ color: l.status === 'Ballasted' ? '#3b82f6' : '#10b981', background: (l.status === 'Ballasted' ? '#3b82f6' : '#10b981') + '18' }}>
                    {l.status}
                  </span>
                </td>
                <td>{l.location}</td>
                <td>
                  <div className="marine-actions">
                    <button className="marine-act-btn marine-act-edit" title="Edit" onClick={() => setModal(l)}>✏️</button>
                    <button className="marine-act-btn marine-act-del" title="Delete" onClick={() => handleDelete(l._id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <BallastModal
          log={modal === 'add' ? null : modal}
          ships={ships}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadLogs(); }}
        />
      )}
    </MarineLayout>
  );
}
