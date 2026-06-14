import { useEffect, useState } from 'react';
import MarineLayout from './MarineLayout';
import { shipAPI, crewAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { MdCheckCircle, MdEdit, MdDelete } from 'react-icons/md';

const DESIGNATIONS = ['Captain','Chief Officer','Second Officer','Third Officer','Chief Engineer','Second Engineer',
  'Third Engineer','Fourth Engineer','Deck Cadet','Engine Cadet','Electrician','Bosun','AB Seaman','OS Seaman',
  'Cook','Steward','Junior Officer','Other'];
const NATIONALITIES = ['India','Philippines','Indonesia','Myanmar','China','Ukraine','Russia','Croatia','Greece','Poland','Other'];

function StaffModal({ member, ships, defaultShipId, onClose, onSave }) {
  const [form, setForm] = useState(member || {
    shipId: defaultShipId || ships[0]?._id || '', name: '', designation: '', email: '',
    dateOfBirth: '', nationality: 'India', phone: '', password: 'Staff@123',
  });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (member) { await crewAPI.update(member._id, form); toast.success('Staff updated!'); }
      else         { await crewAPI.create(form); toast.success('Staff added! Login: ' + form.email + ' / ' + (form.password || 'Staff@123')); }
      onSave();
    } catch(err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };


  return (
    <div className="marine-modal-overlay" onClick={onClose}>
      <div className="marine-modal marine-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="marine-modal-header">
          <h3 className="marine-modal-title">{member ? 'Edit Staff' : 'Add Staff Member'}</h3>
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
              <label className="marine-label">Full Name <span className="req">*</span></label>
              <input name="name" value={form.name} onChange={handle} required className="marine-input" placeholder="Staff name" />
            </div>
            <div className="form-group">
              <label className="marine-label">Designation</label>
              <select name="designation" value={form.designation} onChange={handle} className="marine-input marine-select">
                <option value="">Select designation</option>
                {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="marine-label">Email <span className="req">*</span></label>
              <input name="email" type="email" value={form.email} onChange={handle} required className="marine-input" placeholder="Email for login" />
            </div>
            <div className="form-group">
              <label className="marine-label">Password (for login)</label>
              <input name="password" value={form.password} onChange={handle} className="marine-input" placeholder="Default: Staff@123" />
            </div>
            <div className="form-group">
              <label className="marine-label">Date of Birth</label>
              <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handle} className="marine-input" />
            </div>
            <div className="form-group">
              <label className="marine-label">Nationality</label>
              <select name="nationality" value={form.nationality} onChange={handle} className="marine-input marine-select">
                {NATIONALITIES.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="marine-label">Phone</label>
              <input name="phone" value={form.phone} onChange={handle} className="marine-input" placeholder="Phone number" />
            </div>
          </div>
          {!member && (
            <div style={{ background: '#fef9e7', border: '1px solid #f59e0b', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#92400e' }}>
              ℹ️ A login account will be auto-created for this staff. They can login at <strong>/staff/login</strong>
            </div>
          )}
          <div className="marine-modal-footer">
            <button type="button" onClick={onClose} className="marine-btn-sec">Cancel</button>
            <button type="submit" className="marine-btn-red" disabled={loading}>
              {loading ? 'Saving...' : (member ? 'Update' : 'Add Staff')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CompanyStaffPage() {
  const [ships, setShips] = useState([]);
  const [crew, setCrew] = useState([]);
  const [selectedShip, setSelectedShip] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    shipAPI.getAll().then(r => {
      setShips(r.data.ships);
      if (r.data.ships.length > 0) setSelectedShip(r.data.ships[0]._id);
    }).catch(() => {});
  }, []);

  const loadCrew = async () => {
    try {
      const params = selectedShip ? { shipId: selectedShip } : {};
      const r = await crewAPI.getAll(params);
      setCrew(r.data.crew);
    } catch { toast.error('Failed to load staff'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (selectedShip !== undefined) loadCrew(); }, [selectedShip]);

  const handleDelete = async id => {
    if (!window.confirm('Delete this staff member?')) return;
    try { await crewAPI.delete(id); toast.success('Deleted'); loadCrew(); }
    catch { toast.error('Delete failed'); }
  };

  const toggleStatus = async m => {
    const newStatus = m.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await crewAPI.update(m._id, { ...m, status: newStatus });
      toast.success(`Staff status updated to ${newStatus}`);
      loadCrew();
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <MarineLayout active="/manager/company-staff">
      {/* Select Ship */}
      <div style={{ marginBottom: 20 }}>
        <label className="marine-label">Select Ship</label>
        <select value={selectedShip} onChange={e => setSelectedShip(e.target.value)} className="marine-filter-select" style={{ minWidth: 200, marginTop: 6 }}>
          <option value="">All Ships</option>
          {ships.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      <div className="marine-page-header">
        <h2 className="marine-page-title">Ship Staff List</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="marine-btn-red" onClick={() => setModal('add')}>Add Staff</button>
          <button className="marine-btn-red" onClick={() => toast.info('Audit Trail is logged automatically.')}>Audit Trail</button>
        </div>
      </div>

      <div className="marine-table-wrap">
        <table className="marine-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>NAME</th>
              <th>DESIGNATION</th>
              <th>EMAIL</th>
              <th>DATE OF BIRTH</th>
              <th>NATIONALITY</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</td></tr>
            ) : crew.length === 0 ? (
              <tr><td colSpan={8} className="marine-no-data">No staff added yet</td></tr>
            ) : crew.map((m, i) => (
              <tr key={m._id}>
                <td>{i + 1}</td>
                <td style={{ color: '#0f172a', fontWeight: 600 }}>{m.name}</td>
                <td><span style={{ color: '#475569', fontWeight: 500 }}>{m.designation || '—'}</span></td>
                <td>{m.email}</td>
                <td>{m.dateOfBirth ? m.dateOfBirth.slice(0,10) : '—'}</td>
                <td>{m.nationality || '—'}</td>
                <td>
                  <span className="marine-status-badge" style={{ color: m.status === 'Active' ? '#16a34a' : '#dc2626', background: m.status === 'Active' ? '#dcfce7' : '#fee2e2' }}>
                    {m.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => toggleStatus(m)}
                      title="Toggle Status"
                      style={{
                        background: '#e8380d', color: 'white', border: 'none', borderRadius: '4px',
                        padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
                      onMouseLeave={e => e.currentTarget.style.opacity = 1}
                    >
                      <MdCheckCircle size={15} />
                    </button>
                    <button
                      onClick={() => setModal(m)}
                      title="Edit Staff"
                      style={{
                        background: '#e8380d', color: 'white', border: 'none', borderRadius: '4px',
                        padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
                      onMouseLeave={e => e.currentTarget.style.opacity = 1}
                    >
                      <MdEdit size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(m._id)}
                      title="Delete Staff"
                      style={{
                        background: '#e8380d', color: 'white', border: 'none', borderRadius: '4px',
                        padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
                      onMouseLeave={e => e.currentTarget.style.opacity = 1}
                    >
                      <MdDelete size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <StaffModal
          member={modal === 'add' ? null : modal}
          ships={ships}
          defaultShipId={selectedShip}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadCrew(); }}
        />
      )}
    </MarineLayout>
  );
}
