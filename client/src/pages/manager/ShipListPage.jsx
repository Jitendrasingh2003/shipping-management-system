import { useEffect, useState } from 'react';
import MarineLayout from './MarineLayout';
import { shipAPI } from '../../services/api';
import toast from 'react-hot-toast';

const FLAGS = ['India','United States','United Kingdom','UAE','Singapore','Norway','Greece','Denmark','Malta','Panama','Liberia'];
const SHIP_TYPES = ['Container Ship','Bulk Carrier','Tanker','Ro-Ro','Passenger Ship','Fishing Vessel','Tugboat','Other'];

function ShipModal({ ship, ships, onClose, onSave }) {
  const [form, setForm] = useState(ship || { name: '', flag: 'India', imoNumber: '', type: '', status: 'Active' });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (ship) { await shipAPI.update(ship._id, form); toast.success('Ship updated!'); }
      else       { await shipAPI.create(form);           toast.success('Ship added!'); }
      onSave();
    } catch(err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="marine-modal-overlay" onClick={onClose}>
      <div className="marine-modal" onClick={e => e.stopPropagation()}>
        <div className="marine-modal-header">
          <h3 className="marine-modal-title">{ship ? 'Edit Ship' : 'Add New Ship'}</h3>
          <button onClick={onClose} className="marine-modal-close">✕</button>
        </div>
        <form onSubmit={submit} className="marine-modal-body">
          <div className="marine-form-grid">
            <div className="form-group">
              <label className="marine-label">Ship Name <span className="req">*</span></label>
              <input name="name" value={form.name} onChange={handle} required className="marine-input" placeholder="Enter ship name" />
            </div>
            <div className="form-group">
              <label className="marine-label">IMO Number</label>
              <input name="imoNumber" value={form.imoNumber} onChange={handle} className="marine-input" placeholder="IMO Number" />
            </div>
            <div className="form-group">
              <label className="marine-label">Flag</label>
              <select name="flag" value={form.flag} onChange={handle} className="marine-input marine-select">
                {FLAGS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="marine-label">Ship Type</label>
              <select name="type" value={form.type} onChange={handle} className="marine-input marine-select">
                <option value="">Select type</option>
                {SHIP_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="marine-label">Status</label>
              <select name="status" value={form.status} onChange={handle} className="marine-input marine-select">
                <option>Active</option>
                <option>Inactive</option>
                <option>Under Maintenance</option>
              </select>
            </div>
          </div>
          <div className="marine-modal-footer">
            <button type="button" onClick={onClose} className="marine-btn-sec">Cancel</button>
            <button type="submit" className="marine-btn-red" disabled={loading}>
              {loading ? 'Saving...' : (ship ? 'Update Ship' : 'Add Ship')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ShipListPage() {
  const [ships, setShips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | ship object

  const load = async () => {
    try { const r = await shipAPI.getAll(); setShips(r.data.ships); }
    catch { toast.error('Failed to load ships'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ship?')) return;
    try { await shipAPI.delete(id); toast.success('Ship deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const getStatusColor = s => ({ Active: '#16a34a', Inactive: '#6b7280', 'Under Maintenance': '#d97706' }[s] || '#6b7280');

  return (
    <MarineLayout active="/manager/ships">
      <div className="marine-page-header">
        <h2 className="marine-page-title">Ship List</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="marine-btn-red" onClick={() => setModal('add')}>Add Ships</button>
          <button className="marine-btn-outline">Audit Trail</button>
        </div>
      </div>

      <div className="marine-table-wrap">
        <table className="marine-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>SHIP NAME</th>
              <th>FLAG</th>
              <th>IMO NUMBER</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</td></tr>
            ) : ships.length === 0 ? (
              <tr><td colSpan={6} className="marine-no-data">No ships added yet</td></tr>
            ) : ships.map((ship, i) => (
              <tr key={ship._id}>
                <td>{i + 1}</td>
                <td style={{ color: '#dc2626', fontWeight: 600, cursor: 'pointer' }}>{ship.name}</td>
                <td>{ship.flag}</td>
                <td>{ship.imoNumber || '—'}</td>
                <td><span className="marine-status-badge" style={{ color: getStatusColor(ship.status), background: getStatusColor(ship.status) + '18' }}>{ship.status}</span></td>
                <td>
                  <div className="marine-actions">
                    <button className="marine-act-btn marine-act-view" title="View">👁</button>
                    <button className="marine-act-btn marine-act-edit" title="Edit" onClick={() => setModal(ship)}>✏️</button>
                    <button className="marine-act-btn marine-act-arch" title="Archive">📁</button>
                    <button className="marine-act-btn marine-act-del" title="Delete" onClick={() => handleDelete(ship._id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <ShipModal
          ship={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </MarineLayout>
  );
}
