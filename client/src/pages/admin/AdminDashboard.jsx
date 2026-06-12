import { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { dashboardAPI } from '../../services/api';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import {
  MdLocalShipping, MdCheckCircle, MdPending, MdError,
  MdPeople, MdTrendingUp, MdAttachMoney, MdSpeed,
} from 'react-icons/md';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#6b7280', font: { size: 12, family: 'Inter' } } },
  },
  scales: {
    x: {
      ticks: { color: '#9ca3af', font: { size: 11 } },
      grid: { color: 'rgba(0,0,0,0.04)' },
    },
    y: {
      ticks: { color: '#9ca3af', font: { size: 11 } },
      grid: { color: 'rgba(0,0,0,0.04)' },
    },
  },
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setStats(res.data.stats))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AppLayout title="Admin Dashboard" subtitle="Overview of all operations">
      <div className="loading-container">
        <div className="spinner" />
        <div className="loading-text">Loading dashboard...</div>
      </div>
    </AppLayout>
  );

  const monthlyLabels = stats?.monthlyTrend?.map(m => `${MONTHS[m._id.month - 1]} ${m._id.year}`) || [];
  const monthlyData  = stats?.monthlyTrend?.map(m => m.count) || [];

  const statusLabels = stats?.statusDist?.map(s => s._id.replace(/_/g,' ').toUpperCase()) || [];
  const statusData   = stats?.statusDist?.map(s => s.count) || [];
  const statusColors = ['#4f8ef7','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#94a3b8'];

  const serviceLabels = stats?.serviceTypeDist?.map(s => s._id.toUpperCase()) || [];
  const serviceData   = stats?.serviceTypeDist?.map(s => s.count) || [];

  return (
    <AppLayout title="Admin Dashboard" subtitle="Complete system overview & analytics">

      {/* ── Dashboard Hero Header ── */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-top">
          <div>
            <h1>ShipTrack <span>Admin Hub</span></h1>
            <p>System analytics and fleet operations overview.</p>
          </div>
          <div className="fleet-status-badge">
            <span className="fleet-status-icon">🚢</span>
            Fleet Status: Optimal
          </div>
        </div>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="stats-grid">

        {/* Total Shipments */}
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Shipments</div>
            <div className="stat-value">{stats?.totalShipments?.toLocaleString() || 0}</div>
            <div className="stat-tag live">Live</div>
          </div>
          <div className="stat-icon-wrap green">
            <MdTrendingUp />
          </div>
        </div>

        {/* In Transit */}
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Active In Transit</div>
            <div className="stat-value">{stats?.inTransit?.toLocaleString() || 0}</div>
            <div className="stat-tag live">Live</div>
          </div>
          <div className="stat-icon-wrap blue">
            <MdLocalShipping />
          </div>
        </div>

        {/* Pending */}
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Pending Dispatch</div>
            <div className="stat-value">{stats?.pending?.toLocaleString() || 0}</div>
            <div className="stat-tag pending">Pending</div>
          </div>
          <div className="stat-icon-wrap dark">
            <MdPeople />
          </div>
        </div>

        {/* Failed */}
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Failed / Returned</div>
            <div className="stat-value">{stats?.failed?.toLocaleString() || 0}</div>
            <div className="stat-tag reported">Reported</div>
          </div>
          <div className="stat-icon-wrap red">
            <MdError />
          </div>
        </div>

        {/* Delivered */}
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Delivered</div>
            <div className="stat-value">{stats?.delivered?.toLocaleString() || 0}</div>
            <div className="stat-tag live">On-time: {stats?.onTimeRate || 0}%</div>
          </div>
          <div className="stat-icon-wrap teal">
            <MdCheckCircle />
          </div>
        </div>

        {/* Revenue */}
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">
              ₹{stats?.totalRevenue ? (stats.totalRevenue / 1000).toFixed(1) + 'K' : '0'}
            </div>
            <div className="stat-tag active">{stats?.paidInvoices || 0} paid</div>
          </div>
          <div className="stat-icon-wrap purple">
            <MdAttachMoney />
          </div>
        </div>

        {/* Active Users */}
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Active Users</div>
            <div className="stat-value">{stats?.totalUsers || 0}</div>
            <div className="stat-tag info">{stats?.activeStaff || 0} delivery staff</div>
          </div>
          <div className="stat-icon-wrap yellow">
            <MdPeople />
          </div>
        </div>

        {/* This Month */}
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">This Month</div>
            <div className="stat-value">{stats?.thisMonthShipments?.toLocaleString() || 0}</div>
            <div className="stat-tag active">Shipments created</div>
          </div>
          <div className="stat-icon-wrap cyan">
            <MdSpeed />
          </div>
        </div>

      </div>

      {/* ── Charts Row 1: Shipment Trend (full width) ── */}
      <div className="chart-grid">
        <div className="chart-container" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <div>
              <div className="card-title">📈 Shipment Trend</div>
              <div className="card-subtitle">Monthly shipment volume (last 6 months)</div>
            </div>
          </div>
          <div className="chart-inner">
            <Line
              data={{
                labels: monthlyLabels,
                datasets: [{
                  label: 'Shipments',
                  data: monthlyData,
                  borderColor: '#4f8ef7',
                  backgroundColor: 'rgba(79,142,247,0.08)',
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: '#4f8ef7',
                  pointRadius: 5,
                  pointHoverRadius: 7,
                }],
              }}
              options={chartOptions}
            />
          </div>
        </div>
      </div>

      {/* ── Charts Row 2 ── */}
      <div className="chart-grid">
        <div className="chart-container">
          <div className="card-header">
            <div className="card-title">🍩 Status Distribution</div>
          </div>
          <div className="chart-inner">
            <Doughnut
              data={{
                labels: statusLabels,
                datasets: [{
                  data: statusData,
                  backgroundColor: statusColors,
                  borderColor: '#ffffff',
                  borderWidth: 3,
                  hoverOffset: 8,
                }],
              }}
              options={{ ...chartOptions, scales: undefined, cutout: '62%' }}
            />
          </div>
        </div>

        <div className="chart-container">
          <div className="card-header">
            <div className="card-title">📊 Service Types</div>
          </div>
          <div className="chart-inner">
            <Bar
              data={{
                labels: serviceLabels,
                datasets: [{
                  label: 'Shipments',
                  data: serviceData,
                  backgroundColor: ['#4f8ef7','#22c55e','#f59e0b','#8b5cf6'],
                  borderRadius: 8,
                  borderSkipped: false,
                }],
              }}
              options={{ ...chartOptions, plugins: { legend: { display: false } } }}
            />
          </div>
        </div>
      </div>

      {/* ── Performance Summary ── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">🎯 Performance Summary</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {[
            { label: 'On-Time Rate',  value: `${stats?.onTimeRate || 0}%`,  color: '#16a34a', bg: '#dcfce7' },
            { label: 'Paid Invoices', value: `${stats?.paidInvoices || 0}/${stats?.totalInvoices || 0}`, color: '#2563eb', bg: '#dbeafe' },
            { label: 'Active Staff',  value: stats?.activeStaff || 0,        color: '#d97706', bg: '#fef3c7' },
            { label: 'Failed Rate',   value: stats?.totalShipments
              ? `${((stats.failed / stats.totalShipments) * 100).toFixed(1)}%` : '0%',
              color: '#dc2626', bg: '#fee2e2' },
          ].map(item => (
            <div key={item.label} style={{
              textAlign: 'center',
              background: item.bg,
              borderRadius: '12px',
              padding: '20px 12px',
            }}>
              <div style={{ fontSize: '30px', fontWeight: 800, color: item.color, marginBottom: '4px' }}>
                {item.value}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: item.color, opacity: 0.8 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

    </AppLayout>
  );
}
