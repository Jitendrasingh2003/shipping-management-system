import { useEffect, useState } from 'react';
import MarineLayout from './MarineLayout';
import { shipAPI, crewAPI, voyageAPI } from '../../services/api';
import toast from 'react-hot-toast';

const FLAGS = ['India','United States','United Kingdom','UAE','Singapore','Norway','Greece','Denmark','Malta','Panama','Liberia'];
const SHIP_TYPES = ['Container Ship','Bulk Carrier','Tanker','Ro-Ro','Passenger Ship','Fishing Vessel','Tugboat','Other'];

function ShipDetailModal({ ship, onClose }) {
  const [crew, setCrew] = useState([]);
  const [voyages, setVoyages] = useState([]);
  const [cargoShipments, setCargoShipments] = useState([]);
  const [cargoLogs, setCargoLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'crew' | 'voyages' | 'cargo'

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [crewRes, voyagesRes, cargoRes] = await Promise.all([
          crewAPI.getAll({ shipId: ship._id }),
          voyageAPI.getAll({ shipId: ship._id }),
          shipAPI.getCargo(ship._id)
        ]);
        setCrew(crewRes.data.crew || []);
        setVoyages(voyagesRes.data.voyages || []);
        setCargoShipments(cargoRes.data.shipments || []);
        setCargoLogs(cargoRes.data.cargoLogs || []);
      } catch (err) {
        console.error("Failed to load details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [ship._id]);

  return (
    <div className="marine-modal-overlay" onClick={onClose}>
      <div className="marine-modal marine-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="marine-modal-header">
          <h3 className="marine-modal-title">🚢 {ship.name} — Fleet Details</h3>
          <button onClick={onClose} className="marine-modal-close">✕</button>
        </div>
        <div className="marine-modal-body" style={{ color: '#0f172a' }}>
          {/* Tabs header */}
          <div className="tabs" style={{ marginBottom: 20 }}>
            <button className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>General Info</button>
            <button className={`tab-btn ${activeTab === 'crew' ? 'active' : ''}`} onClick={() => setActiveTab('crew')}>Assigned Crew ({crew.length})</button>
            <button className={`tab-btn ${activeTab === 'voyages' ? 'active' : ''}`} onClick={() => setActiveTab('voyages')}>Voyages ({voyages.length})</button>
            <button className={`tab-btn ${activeTab === 'cargo' ? 'active' : ''}`} onClick={() => setActiveTab('cargo')}>Cargo & Shipments ({cargoShipments.length + cargoLogs.length})</button>
          </div>

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#64748b', fontSize: 12, display: 'block', textTransform: 'uppercase' }}>Vessel Name</strong>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{ship.name}</span>
              </div>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#64748b', fontSize: 12, display: 'block', textTransform: 'uppercase' }}>IMO Number</strong>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{ship.imoNumber || '—'}</span>
              </div>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#64748b', fontSize: 12, display: 'block', textTransform: 'uppercase' }}>Flag State</strong>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>🚩 {ship.flag}</span>
              </div>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#64748b', fontSize: 12, display: 'block', textTransform: 'uppercase' }}>Ship Type</strong>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{ship.type || 'Other'}</span>
              </div>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', gridColumn: 'span 2' }}>
                <strong style={{ color: '#64748b', fontSize: 12, display: 'block', textTransform: 'uppercase' }}>Current Operational Status</strong>
                <span className="marine-status-badge" style={{
                  color: ship.status === 'Active' ? '#16a34a' : ship.status === 'Inactive' ? '#6b7280' : '#d97706',
                  background: (ship.status === 'Active' ? '#16a34a' : ship.status === 'Inactive' ? '#6b7280' : '#d97706') + '18',
                  marginTop: 6, display: 'inline-block'
                }}>{ship.status}</span>
              </div>
            </div>
          )}

          {/* Crew Tab */}
          {activeTab === 'crew' && (
            <div>
              {loading ? <p style={{ color: '#64748b' }}>Loading crew list...</p> : crew.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>No staff members assigned to this ship yet.</p> : (
                <div className="marine-table-wrap" style={{ maxHeight: 300, overflowY: 'auto' }}>
                  <table className="marine-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Designation</th>
                        <th>Nationality</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crew.map(c => (
                        <tr key={c._id}>
                          <td style={{ color: '#0f172a', fontWeight: 600 }}>{c.name}</td>
                          <td>{c.designation}</td>
                          <td>{c.nationality}</td>
                          <td><span className="marine-status-badge" style={{ color: c.status === 'Active' ? '#16a34a' : '#dc2626', background: c.status === 'Active' ? '#dcfce7' : '#fee2e2' }}>{c.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Voyages Tab */}
          {activeTab === 'voyages' && (
            <div>
              {loading ? <p style={{ color: '#64748b' }}>Loading voyages...</p> : voyages.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>No voyages logged for this ship yet.</p> : (
                <div className="marine-table-wrap" style={{ maxHeight: 300, overflowY: 'auto' }}>
                  <table className="marine-table">
                    <thead>
                      <tr>
                        <th>Voyage No</th>
                        <th>Type</th>
                        <th>Route</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voyages.map(v => (
                        <tr key={v._id}>
                          <td style={{ color: '#dc2626', fontWeight: 600 }}>{v.voyageNo}</td>
                          <td>{v.voyageType}</td>
                          <td>{v.departurePort || '—'} → {v.arrivalPort || '—'}</td>
                          <td><span style={{ color: v.voyageStatus === 'Running' ? '#d97706' : v.voyageStatus === 'Completed' ? '#16a34a' : '#2563eb', fontWeight: 600 }}>{v.voyageStatus}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Cargo Tab */}
          {activeTab === 'cargo' && (
            <div>
              {loading ? (
                <p style={{ color: '#64748b' }}>Loading cargo & shipments list...</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Section 1: E-Commerce Packages / Shipments */}
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      📦 Commercial Cargo Shipments ({cargoShipments.length})
                    </h4>
                    {cargoShipments.length === 0 ? (
                      <p style={{ color: '#64748b', fontSize: 13, background: '#f8fafc', padding: '12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        No active package shipments assigned to this vessel's crew.
                      </p>
                    ) : (
                      <div className="marine-table-wrap" style={{ maxHeight: 200, overflowY: 'auto' }}>
                        <table className="marine-table">
                          <thead>
                            <tr>
                              <th>Tracking ID</th>
                              <th>Sender & Receiver</th>
                              <th>Package</th>
                              <th>Weight</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cargoShipments.map(s => (
                              <tr key={s._id}>
                                <td style={{ color: '#dc2626', fontWeight: 600 }}>{s.trackingId}</td>
                                <td>{s.senderName} ({s.senderCity}) → {s.receiverName} ({s.receiverCity})</td>
                                <td>{s.packageType}</td>
                                <td>{s.weight} kg</td>
                                <td>
                                  <span className="marine-status-badge" style={{
                                    color: s.status === 'delivered' ? '#16a34a' : '#2563eb',
                                    background: (s.status === 'delivered' ? '#16a34a' : '#2563eb') + '18'
                                  }}>
                                    {s.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Section 2: Bulk Marine Cargo Operations */}
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      🚢 Logged Cargo Operations ({cargoLogs.length})
                    </h4>
                    {cargoLogs.length === 0 ? (
                      <p style={{ color: '#64748b', fontSize: 13, background: '#f8fafc', padding: '12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        No bulk cargo logs registered for this vessel yet.
                      </p>
                    ) : (
                      <div className="marine-table-wrap" style={{ maxHeight: 200, overflowY: 'auto' }}>
                        <table className="marine-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Operation</th>
                              <th>Cargo Type</th>
                              <th>Quantity</th>
                              <th>Rate</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cargoLogs.map(l => (
                              <tr key={l._id}>
                                <td>{l.logDate}</td>
                                <td>
                                  <span className="marine-status-badge" style={{
                                    color: l.operation === 'Loading' ? '#3b82f6' : '#dc2626',
                                    background: (l.operation === 'Loading' ? '#3b82f6' : '#dc2626') + '18'
                                  }}>
                                    {l.operation}
                                  </span>
                                </td>
                                <td style={{ fontWeight: 600 }}>{l.cargoType}</td>
                                <td>{l.qty}</td>
                                <td>{l.rate || '—'}</td>
                                <td><span className="marine-status-badge" style={{ color: '#16a34a', background: '#dcfce7' }}>{l.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="marine-modal-footer">
          <button onClick={onClose} className="marine-btn-sec">Close Details</button>
        </div>
      </div>
    </div>
  );
}

function ShipModal({ ship, ships, onClose, onSave }) {
  const [form, setForm] = useState(ship || { name: '', flag: 'India', imoNumber: '', type: '', status: 'Active' });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  // Crew registration state
  const [registerStaff, setRegisterStaff] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('Staff@123');
  const [staffDesignation, setStaffDesignation] = useState('Captain');

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (ship) {
        await shipAPI.update(ship._id, form);
        toast.success('Ship updated!');
      } else {
        const res = await shipAPI.create(form);
        const newShip = res.data.ship;
        
        if (registerStaff) {
          await crewAPI.create({
            shipId: newShip._id,
            name: staffName,
            email: staffEmail,
            password: staffPassword,
            designation: staffDesignation,
            nationality: 'India'
          });
          toast.success(`Ship added and Crew member registered!\nLogin: ${staffEmail} / ${staffPassword}`);
        } else {
          toast.success('Ship added successfully!');
        }
      }
      onSave();
    } catch(err) {
      toast.error(err.response?.data?.message || 'Error saving ship');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="marine-modal-overlay" onClick={onClose}>
      <div className="marine-modal marine-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="marine-modal-header">
          <h3 className="marine-modal-title">{ship ? 'Edit Ship' : 'Add New Ship'}</h3>
          <button onClick={onClose} className="marine-modal-close">✕</button>
        </div>
        <form onSubmit={submit} className="marine-modal-body" style={{ color: '#0f172a' }}>
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

            {!ship && (
              <div style={{ gridColumn: 'span 2', marginTop: 12, background: '#f1f5f9', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, color: '#1e293b', marginBottom: registerStaff ? '12px' : '0' }}>
                  <input type="checkbox" checked={registerStaff} onChange={e => setRegisterStaff(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  ➕ Register Primary Crew/Staff Member for this Ship
                </label>
                
                {registerStaff && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                    <div className="form-group">
                      <label className="marine-label">Full Name <span className="req">*</span></label>
                      <input value={staffName} onChange={e => setStaffName(e.target.value)} required={registerStaff} className="marine-input" placeholder="Staff Name" />
                    </div>
                    <div className="form-group">
                      <label className="marine-label">Email (login) <span className="req">*</span></label>
                      <input type="email" value={staffEmail} onChange={e => setStaffEmail(e.target.value)} required={registerStaff} className="marine-input" placeholder="email@vessel.com" />
                    </div>
                    <div className="form-group">
                      <label className="marine-label">Password <span className="req">*</span></label>
                      <input value={staffPassword} onChange={e => setStaffPassword(e.target.value)} required={registerStaff} className="marine-input" placeholder="Password" />
                    </div>
                    <div className="form-group">
                      <label className="marine-label">Designation</label>
                      <select value={staffDesignation} onChange={e => setStaffDesignation(e.target.value)} className="marine-input marine-select">
                        <option>Captain</option>
                        <option>Chief Officer</option>
                        <option>Second Officer</option>
                        <option>Chief Engineer</option>
                        <option>Second Engineer</option>
                        <option>AB Seaman</option>
                        <option>OS Seaman</option>
                        <option>Cook</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: 'span 2', fontSize: '11px', color: '#64748b' }}>
                      ℹ️ An active login account will be auto-created for this staff member so they can immediately sign in to the Staff Panel.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="marine-modal-footer" style={{ marginTop: '20px' }}>
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
  const [viewShip, setViewShip] = useState(null);

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

  const handleArchive = async (ship) => {
    const newStatus = ship.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await shipAPI.update(ship._id, { ...ship, status: newStatus });
      toast.success(`Ship status updated to ${newStatus}`);
      load();
    } catch {
      toast.error('Failed to update ship status');
    }
  };

  const getStatusColor = s => ({ Active: '#16a34a', Inactive: '#6b7280', 'Under Maintenance': '#d97706' }[s] || '#6b7280');

  return (
    <MarineLayout active="/manager/ships">
      <div className="marine-page-header">
        <h2 className="marine-page-title">Ship List</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="marine-btn-red" onClick={() => setModal('add')}>Add Ships</button>
          <button className="marine-btn-outline" onClick={() => toast.info('Audit trail is logged automatically on all ship modifications.')}>Audit Trail</button>
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
                <td style={{ color: '#dc2626', fontWeight: 600, cursor: 'pointer' }} onClick={() => setViewShip(ship)}>{ship.name}</td>
                <td>{ship.flag}</td>
                <td>{ship.imoNumber || '—'}</td>
                <td><span className="marine-status-badge" style={{ color: getStatusColor(ship.status), background: getStatusColor(ship.status) + '18' }}>{ship.status}</span></td>
                <td>
                  <div className="marine-actions">
                    <button className="marine-act-btn marine-act-view" title="View" onClick={() => setViewShip(ship)}>👁</button>
                    <button className="marine-act-btn marine-act-edit" title="Edit" onClick={() => setModal(ship)}>✏️</button>
                    <button className="marine-act-btn marine-act-arch" title="Toggle Status (Active/Inactive)" onClick={() => handleArchive(ship)}>📁</button>
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

      {viewShip && (
        <ShipDetailModal
          ship={viewShip}
          onClose={() => setViewShip(null)}
        />
      )}
    </MarineLayout>
  );
}

