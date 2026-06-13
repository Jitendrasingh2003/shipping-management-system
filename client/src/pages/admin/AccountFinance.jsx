import { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { dashboardAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { MdAttachMoney, MdTrendingUp, MdReceiptLong, MdAccountBalance, MdPending, MdCheckCircle } from 'react-icons/md';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function AccountFinance() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setStats(res.data.stats))
      .catch(() => toast.error('Failed to load finance data'))
      .finally(() => setLoading(false));
  }, []);

  const totalRev   = stats?.totalRevenue   || 0;
  const paidInv    = stats?.paidInvoices   || 0;
  const totalInv   = stats?.totalInvoices  || 0;
  const pendingInv = totalInv - paidInv;
  const avgShipRev = stats?.totalShipments ? (totalRev / stats.totalShipments).toFixed(0) : 0;

  const invoiceChartData = {
    labels: ['Paid', 'Pending'],
    datasets: [{
      data: [paidInv, pendingInv],
      backgroundColor: ['#22c55e', '#f59e0b'],
      borderColor: '#fff',
      borderWidth: 3,
      hoverOffset: 8,
    }],
  };

  const serviceData = stats?.serviceTypeDist || [];
  const revenueByServiceData = {
    labels: serviceData.map(s => s._id?.toUpperCase() || ''),
    datasets: [{
      label: 'Shipments',
      data: serviceData.map(s => s.count),
      backgroundColor: ['#4f8ef7', '#22c55e', '#f59e0b', '#8b5cf6'],
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  if (loading) return (
    <AppLayout title="Account & Finance" subtitle="Financial overview and revenue tracking">
      <div className="loading-container"><div className="spinner" /><div className="loading-text">Loading finance data…</div></div>
    </AppLayout>
  );

  return (
    <AppLayout title="Account & Finance" subtitle="Revenue, invoices and financial performance">

      <div className="dashboard-hero" style={{ marginBottom: '24px' }}>
        <div className="dashboard-hero-top">
          <div>
            <h1>Account & <span>Finance</span></h1>
            <p>Financial overview, revenue tracking and invoice summary.</p>
          </div>
          <div className="fleet-status-badge">💰 Finance Dashboard</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        {[
          { label: 'Total Revenue',   value: `₹${(totalRev / 1000).toFixed(1)}K`,   color: '#16a34a', bg: '#dcfce7', icon: <MdAttachMoney />,   tag: `${paidInv} paid invoices` },
          { label: 'Total Invoices',  value: totalInv,                                color: '#2563eb', bg: '#dbeafe', icon: <MdReceiptLong />,   tag: 'All invoices' },
          { label: 'Paid Invoices',   value: paidInv,                                 color: '#059669', bg: '#d1fae5', icon: <MdCheckCircle />,   tag: 'Completed' },
          { label: 'Pending Invoices',value: pendingInv,                               color: '#d97706', bg: '#fef3c7', icon: <MdPending />,       tag: 'Awaiting payment' },
          { label: 'Avg per Shipment',value: `₹${Number(avgShipRev).toLocaleString()}`,color: '#7c3aed', bg: '#ede9fe', icon: <MdTrendingUp />,   tag: 'Per delivery' },
          { label: 'Total Shipments', value: stats?.totalShipments || 0,              color: '#0891b2', bg: '#cffafe', icon: <MdAccountBalance />, tag: 'Billed' },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <div className="stat-info">
              <div className="stat-label">{c.label}</div>
              <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
              <div className="stat-tag live">{c.tag}</div>
            </div>
            <div className="stat-icon-wrap" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="chart-grid">
        <div className="chart-container">
          <div className="card-header"><div className="card-title">🍩 Invoice Status</div></div>
          <div className="chart-inner">
            <Doughnut data={invoiceChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '62%' }} />
          </div>
        </div>
        <div className="chart-container">
          <div className="card-header"><div className="card-title">📊 Shipments by Service</div></div>
          <div className="chart-inner">
            <Bar data={revenueByServiceData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(0,0,0,0.04)' } }, y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(0,0,0,0.04)' } } } }} />
          </div>
        </div>
      </div>

      {/* Performance Grid */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header"><div className="card-title">🎯 Financial KPIs</div></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { label: 'Invoice Payment Rate', value: totalInv ? `${((paidInv / totalInv) * 100).toFixed(1)}%` : '0%', color: '#16a34a', bg: '#dcfce7' },
            { label: 'Revenue per User',     value: stats?.totalUsers ? `₹${((totalRev / stats.totalUsers) / 1000).toFixed(1)}K` : '₹0', color: '#2563eb', bg: '#dbeafe' },
            { label: 'On-Time Delivery',     value: `${stats?.onTimeRate || 0}%`, color: '#7c3aed', bg: '#ede9fe' },
          ].map(k => (
            <div key={k.label} style={{ background: k.bg, borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: k.color, opacity: 0.8, marginTop: '4px' }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
