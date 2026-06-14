import { useEffect, useState } from 'react';
import MarineLayout from './MarineLayout';
import { shipAPI, engineLogAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function EngineModal({ log, ships, onClose, onSave }) {
  const [form, setForm] = useState(log || {
    shipId: ships[0]?._id || '', logDate: format(new Date(), 'yyyy-MM-dd'),
    rpm: '', jacketTemp: '', lubePressure: '', turboRpm: '', scavengeTemp: '',
  });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (log) { await engineLogAPI.update(log._id, form); toast.success('Log updated!'); }
      else     { await engineLogAPI.create(form);           toast.success('Log entry added!'); }
      onSave();
    } catch(err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="marine-modal-overlay" onClick={onClose}>
      <div className="marine-modal marine-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="marine-modal-header">
          <h3 className="marine-modal-title">{log ? 'Edit Engine Parameters' : 'Log Engine Machinery parameters'}</h3>
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
              <input name="logDate" type="date" value={form.logDate} onChange={handle} required className="marine-input" />
            </div>
            <div className="form-group">
              <label className="marine-label">Main Engine RPM</label>
              <input name="rpm" value={form.rpm} onChange={handle} required className="marine-input" placeholder="e.g. 82 RPM" />
            </div>
            <div className="form-group">
              <label className="marine-label">Jacket Cooling Temp (°C)</label>
              <input name="jacketTemp" value={form.jacketTemp} onChange={handle} required className="marine-input" placeholder="e.g. 70.5 °C" />
            </div>
            <div className="form-group">
              <label className="marine-label">Lube Oil Pressure (bar)</label>
              <input name="lubePressure" value={form.lubePressure} onChange={handle} required className="marine-input" placeholder="e.g. 3.45 bar" />
            </div>
            <div className="form-group">
              <label className="marine-label">Turbocharger Speed (RPM)</label>
              <input name="turboRpm" value={form.turboRpm} onChange={handle} required className="marine-input" placeholder="e.g. 11,450 RPM" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="marine-label">Scavenge Air Temperature (°C)</label>
              <input name="scavengeTemp" value={form.scavengeTemp} onChange={handle} required className="marine-input" placeholder="e.g. 42.1 °C" />
            </div>
          </div>
          <div className="marine-modal-footer">
            <button type="button" onClick={onClose} className="marine-btn-sec">Cancel</button>
            <button type="submit" className="marine-btn-red" disabled={loading}>
              {loading ? 'Saving...' : (log ? 'Update' : 'Log Parameters')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EnginePage() {
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
      const r = await engineLogAPI.getAll(params);
      setLogs(r.data.logs);
    } catch { toast.error('Failed to load Engine logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (selectedShip !== undefined) loadLogs(); }, [selectedShip]);

  const handleDelete = async id => {
    if (!window.confirm('Delete this entry?')) return;
    try { await engineLogAPI.delete(id); toast.success('Deleted'); loadLogs(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <MarineLayout active="/manager/engine">
      <div style={{ marginBottom: 20 }}>
        <label className="marine-label">Select Ship</label>
        <select value={selectedShip} onChange={e => setSelectedShip(e.target.value)} className="marine-filter-select" style={{ minWidth: 200, marginTop: 6 }}>
          <option value="">All Ships</option>
          {ships.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      <div className="marine-page-header">
        <h2 className="marine-page-title">⚙️ Engine Machinery Parameters Log Book</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="marine-btn-red" onClick={() => setModal('add')}>+ Log Parameters</button>
        </div>
      </div>

      <div className="marine-table-wrap">
        <table className="marine-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>VESSEL</th>
              <th>DATE</th>
              <th>MAIN RPM</th>
              <th>JACKET COOLING TEMP</th>
              <th>LUBE OIL PRESS</th>
              <th>TURBO RPM</th>
              <th>SCAVENGE TEMP</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={9} className="marine-no-data">No engine parameters logged yet</td></tr>
            ) : logs.map((l, i) => (
              <tr key={l._id}>
                <td>{i + 1}</td>
                <td>{l.shipId?.name || '—'}</td>
                <td>{l.logDate}</td>
                <td style={{ fontWeight: 700 }}>{l.rpm}</td>
                <td style={{ color: '#2563eb', fontWeight: 600 }}>{l.jacketTemp}</td>
                <td style={{ color: '#16a34a', fontWeight: 600 }}>{l.lubePressure}</td>
                <td>{l.turboRpm}</td>
                <td>{l.scavengeTemp}</td>
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
        <EngineModal
          log={modal === 'add' ? null : modal}
          ships={ships}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadLogs(); }}
        />
      )}
    </MarineLayout>
  );
}
