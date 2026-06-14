import { useEffect, useState } from 'react';
import MarineLayout from './MarineLayout';
import { shipAPI, cargoAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function CargoModal({ log, ships, onClose, onSave }) {
  const [form, setForm] = useState(log || {
    shipId: ships[0]?._id || '', logDate: format(new Date(), 'yyyy-MM-dd'),
    operation: 'Loading', cargoType: '', qty: '', rate: '', status: 'Completed',
  });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (log) { await cargoAPI.update(log._id, form); toast.success('Log updated!'); }
      else     { await cargoAPI.create(form);           toast.success('Log entry added!'); }
      onSave();
    } catch(err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="marine-modal-overlay" onClick={onClose}>
      <div className="marine-modal" onClick={e => e.stopPropagation()}>
        <div className="marine-modal-header">
          <h3 className="marine-modal-title">{log ? 'Edit Cargo Entry' : 'Log Cargo Operation'}</h3>
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
              <label className="marine-label">Operation</label>
              <select name="operation" value={form.operation} onChange={handle} className="marine-input marine-select">
                <option>Loading</option>
                <option>Discharging</option>
                <option>Transfer</option>
              </select>
            </div>
            <div className="form-group">
              <label className="marine-label">Cargo Type</label>
              <input name="cargoType" value={form.cargoType} onChange={handle} required className="marine-input" placeholder="e.g. Crude Oil, Grain, Containers" />
            </div>
            <div className="form-group">
              <label className="marine-label">Quantity (MT / Bbls)</label>
              <input name="qty" value={form.qty} onChange={handle} required className="marine-input" placeholder="e.g. 12,500 bbls" />
            </div>
            <div className="form-group">
              <label className="marine-label">Transfer Rate</label>
              <input name="rate" value={form.rate} onChange={handle} className="marine-input" placeholder="e.g. 2,400 bbls/hr" />
            </div>
            <div className="form-group">
              <label className="marine-label">Status</label>
              <select name="status" value={form.status} onChange={handle} className="marine-input marine-select">
                <option>Completed</option>
                <option>In Progress</option>
                <option>Pending</option>
              </select>
            </div>
          </div>
          <div className="marine-modal-footer">
            <button type="button" onClick={onClose} className="marine-btn-sec">Cancel</button>
            <button type="submit" className="marine-btn-red" disabled={loading}>
              {loading ? 'Saving...' : (log ? 'Update' : 'Log Cargo')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CargoPage() {
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
      const r = await cargoAPI.getAll(params);
      setLogs(r.data.logs);
    } catch { toast.error('Failed to load Cargo logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (selectedShip !== undefined) loadLogs(); }, [selectedShip]);

  const handleDelete = async id => {
    if (!window.confirm('Delete this entry?')) return;
    try { await cargoAPI.delete(id); toast.success('Deleted'); loadLogs(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <MarineLayout active="/manager/cargo">
      <div style={{ marginBottom: 20 }}>
        <label className="marine-label">Select Ship</label>
        <select value={selectedShip} onChange={e => setSelectedShip(e.target.value)} className="marine-filter-select" style={{ minWidth: 200, marginTop: 6 }}>
          <option value="">All Ships</option>
          {ships.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      <div className="marine-page-header">
        <h2 className="marine-page-title">📦 Cargo Transfer & Discharge Log</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="marine-btn-red" onClick={() => setModal('add')}>+ Log Cargo</button>
        </div>
      </div>

      <div className="marine-table-wrap">
        <table className="marine-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>VESSEL</th>
              <th>DATE</th>
              <th>OPERATION</th>
              <th>CARGO TYPE</th>
              <th>QUANTITY</th>
              <th>RATE</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={9} className="marine-no-data">No cargo transfers logged yet</td></tr>
            ) : logs.map((l, i) => (
              <tr key={l._id}>
                <td>{i + 1}</td>
                <td>{l.shipId?.name || '—'}</td>
                <td>{l.logDate}</td>
                <td>
                  <span className="marine-status-badge" style={{ color: l.operation === 'Loading' ? '#3b82f6' : '#ef4444', background: (l.operation === 'Loading' ? '#3b82f6' : '#ef4444') + '18' }}>
                    {l.operation}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{l.cargoType}</td>
                <td>{l.qty}</td>
                <td>{l.rate || '—'}</td>
                <td>
                  <span className="marine-status-badge" style={{ color: '#16a34a', background: '#dcfce7' }}>
                    {l.status}
                  </span>
                </td>
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
        <CargoModal
          log={modal === 'add' ? null : modal}
          ships={ships}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadLogs(); }}
        />
      )}
    </MarineLayout>
  );
}
