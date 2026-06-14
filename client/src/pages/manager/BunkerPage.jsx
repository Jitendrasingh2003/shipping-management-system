import { useEffect, useState } from 'react';
import MarineLayout from './MarineLayout';
import { shipAPI, bunkerAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function BunkerModal({ log, ships, onClose, onSave }) {
  const [form, setForm] = useState(log || {
    shipId: ships[0]?._id || '', logDate: format(new Date(), 'yyyy-MM-dd'),
    fuelType: 'VLSFO (Very Low Sulfur Fuel Oil)', qty: '', viscosity: '', sulfur: '', supplier: '',
  });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (log) { await bunkerAPI.update(log._id, form); toast.success('Log updated!'); }
      else     { await bunkerAPI.create(form);           toast.success('Log entry added!'); }
      onSave();
    } catch(err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="marine-modal-overlay" onClick={onClose}>
      <div className="marine-modal" onClick={e => e.stopPropagation()}>
        <div className="marine-modal-header">
          <h3 className="marine-modal-title">{log ? 'Edit Bunker Entry' : 'Log Bunker Fuel Operation'}</h3>
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
              <label className="marine-label">Fuel Grade / Type</label>
              <select name="fuelType" value={form.fuelType} onChange={handle} className="marine-input marine-select">
                <option>VLSFO (Very Low Sulfur Fuel Oil)</option>
                <option>MGO (Marine Gas Oil)</option>
                <option>ULSFO (Ultra Low Sulfur Fuel Oil)</option>
                <option>LSMGO (Low Sulfur Marine Gas Oil)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="marine-label">Quantity Loaded (MT)</label>
              <input name="qty" value={form.qty} onChange={handle} required className="marine-input" placeholder="e.g. 320" />
            </div>
            <div className="form-group">
              <label className="marine-label">Viscosity (cSt)</label>
              <input name="viscosity" value={form.viscosity} onChange={handle} className="marine-input" placeholder="e.g. 380 cSt" />
            </div>
            <div className="form-group">
              <label className="marine-label">Sulfur Content %</label>
              <input name="sulfur" value={form.sulfur} onChange={handle} className="marine-input" placeholder="e.g. 0.48%" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="marine-label">Supplier Name</label>
              <input name="supplier" value={form.supplier} onChange={handle} required className="marine-input" placeholder="e.g. Marine Fuel Corp, Shell Marine" />
            </div>
          </div>
          <div className="marine-modal-footer">
            <button type="button" onClick={onClose} className="marine-btn-sec">Cancel</button>
            <button type="submit" className="marine-btn-red" disabled={loading}>
              {loading ? 'Saving...' : (log ? 'Update' : 'Log Bunker')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BunkerPage() {
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
      const r = await bunkerAPI.getAll(params);
      setLogs(r.data.logs);
    } catch { toast.error('Failed to load Bunker logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (selectedShip !== undefined) loadLogs(); }, [selectedShip]);

  const handleDelete = async id => {
    if (!window.confirm('Delete this entry?')) return;
    try { await bunkerAPI.delete(id); toast.success('Deleted'); loadLogs(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <MarineLayout active="/manager/bunker">
      <div style={{ marginBottom: 20 }}>
        <label className="marine-label">Select Ship</label>
        <select value={selectedShip} onChange={e => setSelectedShip(e.target.value)} className="marine-filter-select" style={{ minWidth: 200, marginTop: 6 }}>
          <option value="">All Ships</option>
          {ships.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      <div className="marine-page-header">
        <h2 className="marine-page-title">⛽ Bunker Fuel Operations Log</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="marine-btn-red" onClick={() => setModal('add')}>+ Log Bunker</button>
        </div>
      </div>

      <div className="marine-table-wrap">
        <table className="marine-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>VESSEL</th>
              <th>DATE</th>
              <th>FUEL GRADE</th>
              <th>QUANTITY LOADED</th>
              <th>VISCOSITY</th>
              <th>SULFUR %</th>
              <th>SUPPLIER</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={9} className="marine-no-data">No bunker operations logged yet</td></tr>
            ) : logs.map((l, i) => (
              <tr key={l._id}>
                <td>{i + 1}</td>
                <td>{l.shipId?.name || '—'}</td>
                <td>{l.logDate}</td>
                <td style={{ fontWeight: 600 }}>{l.fuelType}</td>
                <td>{l.qty} MT</td>
                <td>{l.viscosity || '—'}</td>
                <td>
                  <span className="marine-status-badge" style={{ color: '#d97706', background: '#fffbeb' }}>
                    {l.sulfur || '—'}
                  </span>
                </td>
                <td>{l.supplier}</td>
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
        <BunkerModal
          log={modal === 'add' ? null : modal}
          ships={ships}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadLogs(); }}
        />
      )}
    </MarineLayout>
  );
}
