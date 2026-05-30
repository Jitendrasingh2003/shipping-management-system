import { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { dashboardAPI, shipmentAPI } from '../../services/api';
import { MdLocalShipping, MdPending, MdDirectionsCar, MdCheckCircle, MdPeople, MdAdd } from 'react-icons/md';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function ManagerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setStats(res.data.stats))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AppLayout title="Manager Dashboard" subtitle="Operations overview">
      <div className="loading-container"><div className="spinner" /><div className="loading-text">Loading...</div></div>
    </AppLayout>
  );

  return (
    <AppLayout title="Warehouse Manager Dashboard" subtitle="Monitor and manage all shipment operations">
      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon blue"><MdLocalShipping size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Shipments</div>
            <div className="stat-value">{stats?.total || 0}</div>
          </div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-icon yellow"><MdPending size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{stats?.pending || 0}</div>
            <div className="stat-change down">Need dispatch</div>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple"><MdDirectionsCar size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">In Transit</div>
            <div className="stat-value">{stats?.inTransit || 0}</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><MdCheckCircle size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Delivered</div>
            <div className="stat-value">{stats?.delivered || 0}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-title" style={{ marginBottom: '16px' }}>⚡ Quick Actions</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/manager/create-shipment')}>
            <MdAdd /> Create New Shipment
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/manager/assign')}>
            <MdPeople /> Assign Deliveries
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/manager/shipments')}>
            <MdLocalShipping /> View All Shipments
          </button>
        </div>
      </div>

      <div className="chart-grid">
        {/* Staff Workload */}
        <div className="chart-container">
          <div className="card-header">
            <div className="card-title">👥 Staff Workload</div>
          </div>
          <div className="chart-inner">
            <Bar
              data={{
                labels: stats?.staffWorkload?.map(s => s.name) || [],
                datasets: [{
                  label: 'Active Deliveries',
                  data: stats?.staffWorkload?.map(s => s.activeDeliveries) || [],
                  backgroundColor: stats?.staffWorkload?.map((_, i) => ['#4f8ef7','#22c55e','#f59e0b','#8b5cf6','#06b6d4'][i % 5]),
                  borderRadius: 8,
                }],
              }}
              options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                  y: { ticks: { color: '#64748b', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.04)' } },
                },
              }}
            />
          </div>
        </div>

        {/* Recent Shipments */}
        <div className="chart-container">
          <div className="card-header">
            <div className="card-title">📦 Recent Shipments</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(stats?.recentShipments || []).map(s => (
              <div key={s._id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-primary)', fontFamily: 'monospace' }}>
                    {s.trackingId}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {s.senderName} → {s.receiverName}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span className={`badge badge-${s.status}`}>{s.status?.replace(/_/g,' ')}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
            {(!stats?.recentShipments || stats.recentShipments.length === 0) && (
              <div className="empty-state" style={{ padding: '30px' }}>
                <div className="empty-title">No recent shipments</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
