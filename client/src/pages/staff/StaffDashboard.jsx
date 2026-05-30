import { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { dashboardAPI, shipmentAPI } from '../../services/api';
import {
  MdDeliveryDining, MdCheckCircle, MdDirectionsCar, MdInventory2,
  MdLocationOn, MdUpdate, MdCamera,
} from 'react-icons/md';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import ShipmentDetailModal from '../../components/shipments/ShipmentDetailModal';
import StatusUpdateModal from '../../components/shipments/StatusUpdateModal';

export default function StaffDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [statusShipment, setStatusShipment] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.getStats();
      setStats(res.data.stats);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const getStatusColor = (status) => ({
    dispatched: 'var(--accent-secondary)',
    picked_up: 'var(--accent-cyan)',
    in_transit: 'var(--warning)',
    out_for_delivery: '#f97316',
    delivered: 'var(--success)',
    failed: 'var(--danger)',
  }[status] || 'var(--text-muted)');

  if (loading) return (
    <AppLayout title="My Dashboard" subtitle="Delivery personnel overview">
      <div className="loading-container"><div className="spinner" /></div>
    </AppLayout>
  );

  return (
    <AppLayout title="My Dashboard" subtitle="Your delivery assignments and performance">
      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card yellow">
          <div className="stat-icon yellow"><MdInventory2 size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Assigned</div>
            <div className="stat-value">{stats?.assigned || 0}</div>
            <div className="stat-change">Awaiting pickup</div>
          </div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-icon cyan"><MdDeliveryDining size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">In Transit</div>
            <div className="stat-value">{(stats?.pickedUp || 0) + (stats?.inTransit || 0)}</div>
            <div className="stat-change">Active routes</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><MdCheckCircle size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Delivered</div>
            <div className="stat-value">{stats?.delivered || 0}</div>
            <div className="stat-change up">Completed</div>
          </div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon blue"><MdDirectionsCar size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Assigned</div>
            <div className="stat-value">{stats?.total || 0}</div>
            <div className="stat-change">All time</div>
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div className="card-title">🎯 My Performance</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--success)' }}>
              {stats?.total ? Math.round((stats.delivered / stats.total) * 100) : 0}%
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Delivery Rate</div>
            <div className="progress" style={{ marginTop: '8px' }}>
              <div className="progress-bar success" style={{ width: `${stats?.total ? (stats.delivered / stats.total) * 100 : 0}%` }} />
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--accent-primary)' }}>{stats?.delivered || 0}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Successfully Delivered</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--warning)' }}>
              {(stats?.assigned || 0) + (stats?.pickedUp || 0) + (stats?.inTransit || 0)}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Currently Active</div>
          </div>
        </div>
      </div>

      {/* Active Deliveries */}
      <div className="section">
        <div className="section-title">🚚 Active Deliveries</div>
        <div className="section-subtitle">Click a delivery to update status or upload proof</div>

        {!stats?.todayDeliveries || stats.todayDeliveries.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">🎉</div>
              <div className="empty-title">No active deliveries!</div>
              <div className="empty-text">Check back when new deliveries are assigned to you.</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats.todayDeliveries.map(s => (
              <div key={s._id} className="card" style={{ border: `1px solid ${getStatusColor(s.status)}33` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-sm)',
                    background: `${getStatusColor(s.status)}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: getStatusColor(s.status), flexShrink: 0, fontSize: 20,
                  }}>🚚</div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 700, fontFamily: 'monospace', fontSize: '14px' }}>
                        {s.trackingId}
                      </span>
                      <span className={`badge badge-${s.status}`}>{s.status?.replace(/_/g,' ')}</span>
                      <span className={`badge ${s.priority === 'urgent' ? 'badge-failed' : s.priority === 'high' ? 'badge-in_transit' : 'badge-processing'}`}>
                        {s.priority}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>From: </span>
                        <span style={{ color: 'var(--text-primary)' }}>{s.senderName} ({s.senderCity})</span>
                      </div>
                      <div style={{ fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>To: </span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.receiverName} ({s.receiverCity})</span>
                      </div>
                      <div style={{ fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Package: </span>
                        <span style={{ color: 'var(--text-secondary)' }}>{s.packageType} • {s.weight}kg</span>
                      </div>
                      <div style={{ fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Address: </span>
                        <span style={{ color: 'var(--text-secondary)' }}>{s.receiverAddress}, {s.receiverCity}</span>
                      </div>
                    </div>

                    {s.specialInstructions && (
                      <div style={{ fontSize: '12px', color: 'var(--warning)', background: 'var(--warning-bg)', padding: '6px 10px', borderRadius: '6px', marginBottom: '10px' }}>
                        ⚠️ {s.specialInstructions}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => setStatusShipment(s)}>
                        <MdUpdate size={14} /> Update Status
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedShipment(s)}>
                        <MdCamera size={14} /> View / Proof
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0, textAlign: 'right' }}>
                    {formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedShipment && (
        <ShipmentDetailModal
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
          onRefresh={fetchStats}
          showProofUpload
        />
      )}
      {statusShipment && (
        <StatusUpdateModal
          shipment={statusShipment}
          onClose={() => setStatusShipment(null)}
          onSuccess={() => { setStatusShipment(null); fetchStats(); }}
        />
      )}
    </AppLayout>
  );
}
