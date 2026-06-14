import { useEffect, useState } from 'react';
import MarineLayout from './MarineLayout';
import { shipAPI, voyageAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function VoyageModal({ voyage, ships, defaultShipId, onClose, onSave }) {
  const [form, setForm] = useState(voyage || {
    shipId: defaultShipId || ships[0]?._id || '', voyageNo: '', voyageType: 'laden',
    voyageStatus: 'Planned', departurePort: '', arrivalPort: '',
    departureDate: '', arrivalDate: '', role: 'staff',
  });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (voyage) { await voyageAPI.update(voyage._id, form); toast.success('Voyage updated!'); }
      else         { await voyageAPI.create(form);             toast.success('Voyage created!'); }
      onSave();
    } catch(err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="marine-modal-overlay" onClick={onClose}>
      <div className="marine-modal marine-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="marine-modal-header">
          <h3 className="marine-modal-title">{voyage ? 'Edit Voyage' : 'Add New Voyage'}</h3>
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
              <label className="marine-label">Voyage No <span className="req">*</span></label>
              <input name="voyageNo" value={form.voyageNo} onChange={handle} required className="marine-input" placeholder="e.g. V-2024-001" />
            </div>
            <div className="form-group">
              <label className="marine-label">Voyage Type</label>
              <select name="voyageType" value={form.voyageType} onChange={handle} className="marine-input marine-select">
                <option value="laden">Laden</option>
                <option value="ballast">Ballast</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="marine-label">Voyage Status</label>
              <select name="voyageStatus" value={form.voyageStatus} onChange={handle} className="marine-input marine-select">
                <option>Planned</option>
                <option>Running</option>
                <option>Completed</option>
              </select>
            </div>
            <div className="form-group">
              <label className="marine-label">Departure Port</label>
              <input name="departurePort" value={form.departurePort} onChange={handle} className="marine-input" placeholder="Port of departure" />
            </div>
            <div className="form-group">
              <label className="marine-label">Arrival Port</label>
              <input name="arrivalPort" value={form.arrivalPort} onChange={handle} className="marine-input" placeholder="Port of arrival" />
            </div>
            <div className="form-group">
              <label className="marine-label">Departure Date</label>
              <input name="departureDate" type="date" value={form.departureDate} onChange={handle} className="marine-input" />
            </div>
            <div className="form-group">
              <label className="marine-label">Arrival Date</label>
              <input name="arrivalDate" type="date" value={form.arrivalDate} onChange={handle} className="marine-input" />
            </div>
          </div>
          <div className="marine-modal-footer">
            <button type="button" onClick={onClose} className="marine-btn-sec">Cancel</button>
            <button type="submit" className="marine-btn-red" disabled={loading}>
              {loading ? 'Saving...' : (voyage ? 'Update' : 'Create Voyage')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VoyagePage() {
  const [ships, setShips] = useState([]);
  const [voyages, setVoyages] = useState([]);
  const [selectedShip, setSelectedShip] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    shipAPI.getAll().then(r => {
      setShips(r.data.ships);
      if (r.data.ships.length > 0) setSelectedShip(r.data.ships[0]._id);
    }).catch(() => {});
  }, []);

  const loadVoyages = async () => {
    try {
      const params = selectedShip ? { shipId: selectedShip } : {};
      const r = await voyageAPI.getAll(params);
      setVoyages(r.data.voyages);
    } catch { toast.error('Failed to load voyages'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (selectedShip !== undefined) loadVoyages(); }, [selectedShip]);

  const handleDelete = async id => {
    if (!window.confirm('Delete this voyage?')) return;
    try { await voyageAPI.delete(id); toast.success('Deleted'); loadVoyages(); }
    catch { toast.error('Delete failed'); }
  };

  const statusColor = s => ({ Running: '#d97706', Completed: '#16a34a', Planned: '#2563eb' }[s] || '#888');

  return (
    <MarineLayout active="/manager/voyage">
      <div style={{ marginBottom: 20 }}>
        <label className="marine-label">Select Ship</label>
        <select value={selectedShip} onChange={e => setSelectedShip(e.target.value)} className="marine-filter-select" style={{ minWidth: 200, marginTop: 6 }}>
          <option value="">All Ships</option>
          {ships.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      <div className="marine-page-header">
        <h2 className="marine-page-title">Voyage List</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="marine-btn-red" onClick={() => setModal('add')}>+ Add Voyage</button>
          <button className="marine-btn-outline">Audit Trail</button>
        </div>
      </div>

      <div className="marine-table-wrap">
        <table className="marine-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ROLE</th>
              <th>VESSEL NAME</th>
              <th>VOYAGE NO</th>
              <th>VOYAGE TYPE</th>
              <th>VOYAGE STATUS</th>
              <th>CREATED DATE</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</td></tr>
            ) : voyages.length === 0 ? (
              <tr><td colSpan={8} className="marine-no-data">No voyages added yet</td></tr>
            ) : voyages.map((v, i) => (
              <tr key={v._id}>
                <td>{i + 1}</td>
                <td>{v.role}</td>
                <td style={{ color: '#dc2626', fontWeight: 500 }}>{v.shipId?.name || '—'}</td>
                <td>{v.voyageNo}</td>
                <td>{v.voyageType}</td>
                <td><span style={{ color: statusColor(v.voyageStatus), fontWeight: 600 }}>{v.voyageStatus}</span></td>
                <td>{format(new Date(v.createdAt), 'dd-MM-yyyy')}</td>
                <td>
                  <div className="marine-actions">
                    <button className="marine-act-btn marine-act-view" title="View">👁</button>
                    <button className="marine-act-btn marine-act-edit" title="Edit" onClick={() => setModal(v)}>✏️</button>
                    <button className="marine-act-btn marine-act-del" title="Delete" onClick={() => handleDelete(v._id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination placeholder */}
      {voyages.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, alignItems: 'center' }}>
          <button className="marine-page-btn">‹</button>
          <button className="marine-page-btn active">1</button>
          <button className="marine-page-btn">›</button>
        </div>
      )}

      {modal && (
        <VoyageModal
          voyage={modal === 'add' ? null : modal}
          ships={ships}
          defaultShipId={selectedShip}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadVoyages(); }}
        />
      )}
    </MarineLayout>
  );
}
