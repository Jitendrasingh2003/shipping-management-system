import { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { shipmentAPI, userAPI } from '../../services/api';
import { MdSearch, MdAssignment, MdVisibility, MdRefresh, MdFilterList } from 'react-icons/md';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import AssignModal from '../../components/shipments/AssignModal';
import ShipmentDetailModal from '../../components/shipments/ShipmentDetailModal';

export default function AssignDeliveries() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('created');
  const [selected, setSelected] = useState(null);
  const [viewShipment, setViewShipment] = useState(null);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await shipmentAPI.getAll({ status: statusFilter, limit: 50 });
      setShipments(res.data.shipments);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  const unassigned = shipments.filter(s => !s.assignedTo?.userId);
  const assigned = shipments.filter(s => s.assignedTo?.userId);

  return (
    <AppLayout title="Assign Deliveries" subtitle="Assign shipments to delivery personnel">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Delivery Assignment</h1>
          <p>{unassigned.length} unassigned shipments need attention</p>
        </div>
        <div className="page-header-right">
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="created">Created</option>
            <option value="processing">Processing</option>
            <option value="dispatched">Dispatched</option>
          </select>
          <button className="btn btn-secondary" onClick={fetchShipments}><MdRefresh /></button>
        </div>
      </div>

      {/* Unassigned */}
      <div className="section">
        <div className="section-title">⚠️ Unassigned Shipments ({unassigned.length})</div>
        <div className="section-subtitle">These shipments need to be assigned to delivery personnel</div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : unassigned.length === 0 ? (
          <div className="card">
            <div className="empty-state" style={{ padding: '40px' }}>
              <div className="empty-icon">✅</div>
              <div className="empty-title">All shipments are assigned!</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
            {unassigned.map(s => (
              <div key={s._id} className="card" style={{ border: '1px solid rgba(245,158,11,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ color: 'var(--accent-primary)', fontWeight: 700, fontFamily: 'monospace', fontSize: '14px' }}>
                      {s.trackingId}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  <span className={`badge badge-${s.priority === 'urgent' ? 'failed' : s.priority === 'high' ? 'in_transit' : 'processing'}`}>
                    {s.priority?.toUpperCase()}
                  </span>
                </div>

                <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>From:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500, marginLeft: '6px' }}>{s.senderName}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>({s.senderCity})</span>
                </div>
                <div style={{ fontSize: '13px', marginBottom: '14px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>To:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500, marginLeft: '6px' }}>{s.receiverName}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>({s.receiverCity})</span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => setSelected(s)}>
                    <MdAssignment size={14} /> Assign
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setViewShipment(s)}>
                    <MdVisibility size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assigned */}
      {assigned.length > 0 && (
        <div className="section">
          <div className="section-title">✅ Assigned Shipments ({assigned.length})</div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Sender → Receiver</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assigned.map(s => (
                  <tr key={s._id}>
                    <td style={{ color: 'var(--accent-primary)', fontWeight: 600, fontFamily: 'monospace', fontSize: '13px' }}>{s.trackingId}</td>
                    <td style={{ fontSize: '13px' }}>{s.senderName} → {s.receiverName}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.assignedTo?.name}</td>
                    <td><span className={`badge badge-${s.status}`}>{s.status?.replace(/_/g,' ')}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-icon" onClick={() => setViewShipment(s)}><MdVisibility size={16} /></button>
                        <button className="btn btn-ghost btn-icon" onClick={() => setSelected(s)}>
                          <MdAssignment size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <AssignModal
          shipment={selected}
          onClose={() => setSelected(null)}
          onSuccess={() => { setSelected(null); fetchShipments(); }}
        />
      )}
      {viewShipment && (
        <ShipmentDetailModal
          shipment={viewShipment}
          onClose={() => setViewShipment(null)}
          onRefresh={fetchShipments}
        />
      )}
    </AppLayout>
  );
}
