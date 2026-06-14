import { useEffect, useState } from 'react';
import MarineLayout from './MarineLayout';
import { shipAPI, odsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function OdsModal({ log, ships, onClose, onSave }) {
  const [form, setForm] = useState(log || {
    shipId: ships[0]?._id || '', logDate: format(new Date(), 'yyyy-MM-dd'),
    system: '', gasType: 'R-134a', qty: '', operation: 'Recharged',
  });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (log) { await odsAPI.update(log._id, form); toast.success('Log updated!'); }
      else     { await odsAPI.create(form);           toast.success('Log entry added!'); }
      onSave();
    } catch(err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="marine-modal-overlay" onClick={onClose}>
      <div className="marine-modal" onClick={e => e.stopPropagation()}>
        <div className="marine-modal-header">
          <h3 className="marine-modal-title">{log ? 'Edit ODS Entry' : 'Log ODS Entry'}</h3>
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
              <label className="marine-label">System / Machinery</label>
              <input name="system" value={form.system} onChange={handle} required className="marine-input" placeholder="e.g. AC Pack 1" />
            </div>
            <div className="form-group">
              <label className="marine-label">Gas Type</label>
              <select name="gasType" value={form.gasType} onChange={handle} className="marine-input marine-select">
                <option>R-134a</option>
                <option>R-404A</option>
                <option>R-407C</option>
                <option>Halon 1301</option>
              </select>
            </div>
            <div className="form-group">
              <label className="marine-label">Quantity (kg)</label>
              <input name="qty" value={form.qty} onChange={handle} required className="marine-input" placeholder="e.g. 2.5" />
            </div>
            <div className="form-group">
              <label className="marine-label">Operation Type</label>
              <select name="operation" value={form.operation} onChange={handle} className="marine-input marine-select">
                <option>Recharged</option>
                <option>Recovered</option>
                <option>Discharged</option>
                <option>Leak Test</option>
              </select>
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

export default function OdsPage() {
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
      const r = await odsAPI.getAll(params);
      setLogs(r.data.logs);
    } catch { toast.error('Failed to load ODS logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (selectedShip !== undefined) loadLogs(); }, [selectedShip]);

  const handleDelete = async id => {
    if (!window.confirm('Delete this entry?')) return;
    try { await odsAPI.delete(id); toast.success('Deleted'); loadLogs(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <MarineLayout active="/manager/ods">
      <div style={{ marginBottom: 20 }}>
        <label className="marine-label">Select Ship</label>
        <select value={selectedShip} onChange={e => setSelectedShip(e.target.value)} className="marine-filter-select" style={{ minWidth: 200, marginTop: 6 }}>
          <option value="">All Ships</option>
          {ships.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      <div className="marine-page-header">
        <h2 className="marine-page-title">📝 Ozone Depleting Substances (ODS) Record Book</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="marine-btn-red" onClick={() => setModal('add')}>+ Log Entry</button>
        </div>
      </div>

      <div className="marine-table-wrap">
        <table className="marine-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>VESSEL</th>
              <th>DATE</th>
              <th>SYSTEM</th>
              <th>GAS TYPE</th>
              <th>QUANTITY</th>
              <th>OPERATION</th>
              <th>LOGGED BY</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={9} className="marine-no-data">No ODS entries logged yet</td></tr>
            ) : logs.map((l, i) => (
              <tr key={l._id}>
                <td>{i + 1}</td>
                <td>{l.shipId?.name || '—'}</td>
                <td>{l.logDate}</td>
                <td style={{ fontWeight: 600 }}>{l.system}</td>
                <td><span className="marine-status-badge" style={{ color: '#2563eb', background: '#eff6ff' }}>{l.gasType}</span></td>
                <td>{l.qty}</td>
                <td>{l.operation}</td>
                <td>{l.loggedBy}</td>
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
        <OdsModal
          log={modal === 'add' ? null : modal}
          ships={ships}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadLogs(); }}
        />
      )}
    </MarineLayout>
  );
}
