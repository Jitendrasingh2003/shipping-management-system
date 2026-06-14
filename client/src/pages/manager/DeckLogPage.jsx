import { useEffect, useState } from 'react';
import MarineLayout from './MarineLayout';
import { shipAPI, deckLogAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function DeckLogModal({ log, ships, onClose, onSave }) {
  const [form, setForm] = useState(log || {
    shipId: ships[0]?._id || '', latitude: '', longitude: '',
    speed: '', course: '', weather: '', remarks: '', logDate: '',
  });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (log) { await deckLogAPI.update(log._id, form); toast.success('Log updated!'); }
      else       { await deckLogAPI.create(form);          toast.success('Log entry added!'); }
      onSave();
    } catch(err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="marine-modal-overlay" onClick={onClose}>
      <div className="marine-modal marine-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="marine-modal-header">
          <h3 className="marine-modal-title">{log ? 'Edit Deck Log' : 'Add Deck Log Entry'}</h3>
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
              <label className="marine-label">Log Date</label>
              <input name="logDate" type="date" value={form.logDate} onChange={handle} className="marine-input" />
            </div>
            <div className="form-group">
              <label className="marine-label">Latitude</label>
              <input name="latitude" value={form.latitude} onChange={handle} className="marine-input" placeholder="e.g. 18.9750° N" />
            </div>
            <div className="form-group">
              <label className="marine-label">Longitude</label>
              <input name="longitude" value={form.longitude} onChange={handle} className="marine-input" placeholder="e.g. 72.8258° E" />
            </div>
            <div className="form-group">
              <label className="marine-label">Speed (knots)</label>
              <input name="speed" type="number" value={form.speed} onChange={handle} className="marine-input" placeholder="Speed in knots" />
            </div>
            <div className="form-group">
              <label className="marine-label">Course</label>
              <input name="course" value={form.course} onChange={handle} className="marine-input" placeholder="Course heading" />
            </div>
            <div className="form-group">
              <label className="marine-label">Weather</label>
              <input name="weather" value={form.weather} onChange={handle} className="marine-input" placeholder="Weather conditions" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="marine-label">Remarks</label>
              <textarea name="remarks" value={form.remarks} onChange={handle} className="marine-input" placeholder="Additional remarks" rows={3} style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="marine-modal-footer">
            <button type="button" onClick={onClose} className="marine-btn-sec">Cancel</button>
            <button type="submit" className="marine-btn-red" disabled={loading}>
              {loading ? 'Saving...' : (log ? 'Update' : 'Add Log')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DeckLogPage() {
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
      const r = await deckLogAPI.getAll(params);
      setLogs(r.data.logs);
    } catch { toast.error('Failed to load logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (selectedShip !== undefined) loadLogs(); }, [selectedShip]);

  const handleDelete = async id => {
    if (!window.confirm('Delete this log entry?')) return;
    try { await deckLogAPI.delete(id); toast.success('Deleted'); loadLogs(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <MarineLayout active="/manager/deck">
      <div style={{ marginBottom: 20 }}>
        <label className="marine-label">Select Ship</label>
        <select value={selectedShip} onChange={e => setSelectedShip(e.target.value)} className="marine-filter-select" style={{ minWidth: 200, marginTop: 6 }}>
          <option value="">All Ships</option>
          {ships.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      <div className="marine-page-header">
        <h2 className="marine-page-title">Deck Logbook Information</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="marine-btn-red" onClick={() => setModal('add')}>+ Add Log</button>
          <button className="marine-btn-outline">Audit Trail</button>
        </div>
      </div>

      <div className="marine-table-wrap">
        <table className="marine-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>LATITUDE</th>
              <th>LONGITUDE</th>
              <th>SPEED</th>
              <th>WEATHER</th>
              <th>CREATED DATE</th>
              <th>UPDATED AT</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="marine-empty-state">
                    <div className="marine-empty-icon">📋</div>
                    <div className="marine-empty-text">No data</div>
                  </div>
                </td>
              </tr>
            ) : logs.map((l, i) => (
              <tr key={l._id}>
                <td>{i + 1}</td>
                <td>{l.latitude || '—'}</td>
                <td>{l.longitude || '—'}</td>
                <td>{l.speed ? `${l.speed} kn` : '—'}</td>
                <td>{l.weather || '—'}</td>
                <td>{format(new Date(l.createdAt), 'dd-MM-yyyy')}</td>
                <td>{format(new Date(l.updatedAt), 'dd-MM-yyyy')}</td>
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
        <DeckLogModal
          log={modal === 'add' ? null : modal}
          ships={ships}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadLogs(); }}
        />
      )}
    </MarineLayout>
  );
}
