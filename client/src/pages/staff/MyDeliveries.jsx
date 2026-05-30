import { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { shipmentAPI } from '../../services/api';
import { MdSearch, MdUpdate, MdVisibility, MdRefresh, MdLocationOn } from 'react-icons/md';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import StatusUpdateModal from '../../components/shipments/StatusUpdateModal';
import ShipmentDetailModal from '../../components/shipments/ShipmentDetailModal';

export default function MyDeliveries() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [statusShipment, setStatusShipment] = useState(null);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await shipmentAPI.getAssigned({ status: statusFilter });
      setShipments(res.data.shipments);
    } catch { toast.error('Failed to load deliveries'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  const STATUS_FLOW = {
    dispatched: ['picked_up'],
    picked_up: ['in_transit'],
    in_transit: ['out_for_delivery'],
    out_for_delivery: ['delivered', 'failed'],
  };

  return (
    <AppLayout title="My Deliveries" subtitle="All deliveries assigned to you">
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Deliveries</h1>
          <p>{shipments.length} deliveries found</p>
        </div>
        <div className="page-header-right">
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="dispatched">Dispatched</option>
            <option value="picked_up">Picked Up</option>
            <option value="in_transit">In Transit</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
          </select>
          <button className="btn btn-secondary" onClick={fetchDeliveries}><MdRefresh /></button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : shipments.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-title">No deliveries found</div>
            <div className="empty-text">No deliveries match your current filter</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {shipments.map(s => {
            const nextStatuses = STATUS_FLOW[s.status] || [];
            const isComplete = s.status === 'delivered';
            const isFailed = s.status === 'failed';

            return (
              <div key={s._id} className="card" style={{
                border: isComplete ? '1px solid rgba(34,197,94,0.3)' : isFailed ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border)',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 700, fontFamily: 'monospace', fontSize: '15px' }}>
                      {s.trackingId}
                    </span>
                    <span className={`badge badge-${s.status}`}>{s.status?.replace(/_/g,' ')}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Est. {s.estimatedDelivery ? format(new Date(s.estimatedDelivery), 'dd MMM yyyy') : 'N/A'}
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      Pickup From
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{s.senderName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.senderAddress}</div>
                    <div style={{ fontSize: '12px', color: 'var(--accent-primary)' }}>{s.senderCity}, {s.senderState}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>📞 {s.senderPhone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      Deliver To
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{s.receiverName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.receiverAddress}</div>
                    <div style={{ fontSize: '12px', color: 'var(--success)' }}>{s.receiverCity}, {s.receiverState}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>📞 {s.receiverPhone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      Package Info
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                      {s.packageType?.toUpperCase()} • {s.weight}kg
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {s.dimensions?.length}×{s.dimensions?.width}×{s.dimensions?.height} cm
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Service: {s.serviceType?.toUpperCase()}
                    </div>
                  </div>
                </div>

                {s.specialInstructions && (
                  <div style={{ fontSize: '12px', color: 'var(--warning)', background: 'var(--warning-bg)', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px' }}>
                    ⚠️ Special Instructions: {s.specialInstructions}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {nextStatuses.length > 0 && (
                    <button className="btn btn-primary btn-sm" onClick={() => setStatusShipment(s)}>
                      <MdUpdate size={14} /> Update Status
                    </button>
                  )}
                  <button className="btn btn-secondary btn-sm" onClick={() => setSelectedShipment(s)}>
                    <MdVisibility size={14} /> View Details
                  </button>
                  {isComplete && s.proofOfDelivery?.image && (
                    <span style={{ fontSize: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ✅ Proof uploaded
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedShipment && (
        <ShipmentDetailModal
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
          onRefresh={fetchDeliveries}
          showProofUpload
        />
      )}
      {statusShipment && (
        <StatusUpdateModal
          shipment={statusShipment}
          onClose={() => setStatusShipment(null)}
          onSuccess={() => { setStatusShipment(null); fetchDeliveries(); }}
        />
      )}
    </AppLayout>
  );
}
