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
  MdSettingsInputComponent, MdMap, MdDns, MdOutlineAnalytics,
  MdSync, MdWifi, MdCircle
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
  const [activeTab, setActiveTab] = useState('overview');

  // E-commerce simulation states
  const [syncedOrders, setSyncedOrders] = useState([
    { id: 'ORD-9932', platform: 'Shopify', customer: 'Aarav Mehta', cost: '₹1,240', status: 'Synced', time: '5 mins ago' },
    { id: 'ORD-9841', platform: 'WooCommerce', customer: 'Priya Sharma', cost: '₹3,450', status: 'Synced', time: '12 mins ago' },
    { id: 'ORD-9788', platform: 'Shopify', customer: 'Amit Patel', cost: '₹890', status: 'Synced', time: '45 mins ago' },
  ]);
  const [syncing, setSyncing] = useState(false);

  // System Diagnostics states
  const [latency, setLatency] = useState(45);
  const [sysLogs, setSysLogs] = useState([
    '[21:49:10] INFO: MongoDB connected successfully on port 27017',
    '[21:49:12] WARNING: MySQL connection skipped. Running in MongoDB fallback mode.',
    '[21:49:15] INFO: Socket.io server initialized and listening for events',
    '[21:49:20] GET /api/dashboard/stats - 200 OK (15ms)',
  ]);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setStats(res.data.stats))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  // System logs simulation
  useEffect(() => {
    if (activeTab !== 'diagnostics') return;
    const interval = setInterval(() => {
      // update latency slightly
      setLatency(prev => Math.max(20, Math.min(120, prev + Math.floor(Math.random() * 21) - 10)));
      
      const endpoints = ['GET /api/shipments', 'POST /api/auth/login', 'PATCH /api/shipments/:id/status', 'GET /api/reports/shipment'];
      const statuses = ['200 OK', '201 Created', '400 Bad Request', '304 Not Modified'];
      const randomEp = endpoints[Math.floor(Math.random() * endpoints.length)];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const randomTime = Math.floor(Math.random() * 80) + 10;
      
      const now = new Date().toTimeString().split(' ')[0];
      setSysLogs(prev => [
        `[${now}] INFO: ${randomEp} - ${randomStatus} (${randomTime}ms)`,
        ...prev.slice(0, 15)
      ]);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const triggerMockSync = () => {
    if (syncing) return;
    setSyncing(true);
    toast.loading('Connecting to Shopify Webhook Channel...');
    
    setTimeout(() => {
      const names = ['Karan Malhotra', 'Neha Reddy', 'Vikram Singh', 'Deepika Rao'];
      const platforms = ['Shopify', 'WooCommerce'];
      const price = '₹' + (Math.floor(Math.random() * 5000) + 500).toLocaleString();
      const mockOrder = {
        id: 'ORD-' + Math.floor(Math.random() * 9000 + 1000),
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        customer: names[Math.floor(Math.random() * names.length)],
        cost: price,
        status: 'Synced',
        time: 'Just now'
      };
      
      setSyncedOrders(prev => [mockOrder, ...prev]);
      toast.dismiss();
      toast.success(`Webhook Synced! Order ${mockOrder.id} generated a new shipment.`);
      setSyncing(false);
    }, 2000);
  };

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
    <AppLayout title="Admin Command Center" subtitle="Real-time control hub, routing, and platform analytics">
      
      {/* ── Dashboard Hero & Tab Navigation ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="dashboard-hero-top" style={{ position: 'relative', zIndex: 2 }}>
          <div>
            <h1 style={{ color: '#ffffff', fontSize: '28px', fontWeight: 800, margin: 0, fontFamily: 'Poppins' }}>
              ShipTrack <span>Control Tower</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
              System level metrics, webhook listeners, and dispatch network routing.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{
              background: 'rgba(34,197,94,0.15)', color: '#22c55e',
              border: '1px solid rgba(34,197,94,0.3)', borderRadius: '20px',
              padding: '6px 14px', fontSize: '12px', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <MdWifi className="blink-element" /> NETWORK LIVE
            </span>
          </div>
        </div>

        {/* Tab Headers */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: '2px',
          position: 'relative',
          zIndex: 2
        }}>
          {[
            { id: 'overview', label: 'Overview Analytics', icon: <MdOutlineAnalytics /> },
            { id: 'ecommerce', label: 'E-Commerce Sync', icon: <MdSync /> },
            { id: 'hubmap', label: 'Hub Routing Map', icon: <MdMap /> },
            { id: 'diagnostics', label: 'System Diagnostics', icon: <MdDns /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: activeTab === tab.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #4f8ef7' : '2px solid transparent',
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '-2px'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB 1: OVERVIEW ANALYTICS ── */}
      {activeTab === 'overview' && (
        <div className="slide-up">
          {/* KPI Stat Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Total Shipments</div>
                <div className="stat-value">{stats?.totalShipments?.toLocaleString() || 0}</div>
                <div className="stat-tag live">All time</div>
              </div>
              <div className="stat-icon-wrap blue">
                <MdTrendingUp />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Active In Transit</div>
                <div className="stat-value">{stats?.inTransit?.toLocaleString() || 0}</div>
                <div className="stat-tag live">On Road</div>
              </div>
              <div className="stat-icon-wrap yellow">
                <MdLocalShipping />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Pending Dispatch</div>
                <div className="stat-value">{stats?.pending?.toLocaleString() || 0}</div>
                <div className="stat-tag pending">Waiting</div>
              </div>
              <div className="stat-icon-wrap dark">
                <MdPending />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Delivered on Time</div>
                <div className="stat-value">{stats?.delivered?.toLocaleString() || 0}</div>
                <div className="stat-tag active">Rate: {stats?.onTimeRate || 0}%</div>
              </div>
              <div className="stat-icon-wrap green">
                <MdCheckCircle />
              </div>
            </div>
          </div>

          {/* Charts Rows */}
          <div className="chart-grid">
            <div className="chart-container" style={{ gridColumn: 'span 2' }}>
              <div className="card-header">
                <div>
                  <div className="card-title">📈 Shipment Volume Trends</div>
                  <div className="card-subtitle">Aggregated system logistics load history</div>
                </div>
              </div>
              <div className="chart-inner" style={{ height: '260px' }}>
                {monthlyLabels.length > 0 ? (
                  <Line
                    data={{
                      labels: monthlyLabels,
                      datasets: [{
                        label: 'Shipments',
                        data: monthlyData,
                        borderColor: '#4f8ef7',
                        backgroundColor: 'rgba(79,142,247,0.06)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#4f8ef7',
                        pointRadius: 5,
                      }],
                    }}
                    options={chartOptions}
                  />
                ) : (
                  <div className="empty-state">No trend statistics found</div>
                )}
              </div>
            </div>
          </div>

          <div className="chart-grid">
            <div className="chart-container">
              <div className="card-header">
                <div className="card-title">🍩 Status Distribution</div>
              </div>
              <div className="chart-inner" style={{ height: '220px' }}>
                {statusLabels.length > 0 ? (
                  <Doughnut
                    data={{
                      labels: statusLabels,
                      datasets: [{
                        data: statusData,
                        backgroundColor: statusColors,
                        borderColor: '#ffffff',
                        borderWidth: 2,
                      }],
                    }}
                    options={{ ...chartOptions, scales: undefined, cutout: '65%' }}
                  />
                ) : (
                  <div className="empty-state">No status statistics found</div>
                )}
              </div>
            </div>

            <div className="chart-container">
              <div className="card-header">
                <div className="card-title">📊 Service Preferences</div>
              </div>
              <div className="chart-inner" style={{ height: '220px' }}>
                {serviceLabels.length > 0 ? (
                  <Bar
                    data={{
                      labels: serviceLabels,
                      datasets: [{
                        label: 'Shipments',
                        data: serviceData,
                        backgroundColor: ['#4f8ef7','#8b5cf6','#14b8a6','#ef4444'],
                        borderRadius: 6,
                      }],
                    }}
                    options={{ ...chartOptions, plugins: { legend: { display: false } } }}
                  />
                ) : (
                  <div className="empty-state">No service distribution found</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: E-COMMERCE SYNC SIMULATOR ── */}
      {activeTab === 'ecommerce' && (
        <div className="slide-up card" style={{ padding: '28px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                🔌 E-Commerce Webhook Channels
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Sync incoming orders directly from e-commerce checkouts into ShipTrack logistics creation pipeline.
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={triggerMockSync}
              disabled={syncing}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <MdSync className={syncing ? 'spin-element' : ''} />
              {syncing ? 'Processing Webhook...' : 'Simulate Order Webhook'}
            </button>
          </div>

          {/* Connected Channels status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {[
              { title: 'Shopify Store Connection', status: 'Active', color: '#16a34a', bg: '#dcfce7', logo: '🟢 Shopify API v2026.04' },
              { title: 'WooCommerce Webhook', status: 'Active', color: '#8b5cf6', bg: '#f5f3ff', logo: '💜 Woo Webhook Triggered' },
              { title: 'Amazon Seller Central', status: 'Inactive', color: '#dc2626', bg: '#fee2e2', logo: '⚠️ Pending Auth credentials' },
            ].map((channel, i) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', background: '#f8fafc' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {channel.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>{channel.logo}</span>
                  <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '10px', background: channel.bg, color: channel.color }}>
                    {channel.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Synced orders table */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              📡 Latest Synced Webhook Payloads
            </h4>
            <div className="table-container" style={{ boxShadow: 'none', border: '1px solid var(--border)' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Payload ID</th>
                    <th>Source Platform</th>
                    <th>Buyer Name</th>
                    <th>Declared Value</th>
                    <th>Sync State</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {syncedOrders.map((order, idx) => (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4f8ef7' }}>{order.id}</td>
                      <td>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px',
                          background: order.platform === 'Shopify' ? '#eefbfa' : '#f5f3ff',
                          color: order.platform === 'Shopify' ? '#14b8a6' : '#8b5cf6',
                          border: `1px solid ${order.platform === 'Shopify' ? '#ccfbf1' : '#ddd6fe'}`
                        }}>
                          {order.platform}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{order.customer}</td>
                      <td>{order.cost}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 600, fontSize: '13px' }}>
                          <MdCircle size={8} /> {order.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{order.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: HUB ROUTING MAP ── */}
      {activeTab === 'hubmap' && (
        <div className="slide-up card" style={{ padding: '24px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                🗺️ Regional Dispatch Routing Grid
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Active shipment distribution pipelines and hub loads across India.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4f8ef7' }}>🔵 Air Route</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8b5cf6' }}>🟣 Land Route</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>🟢 Delivery Hub</span>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 300px',
            gap: '20px',
            alignItems: 'stretch'
          }}>
            {/* SVG MAP MOCKUP */}
            <div style={{
              background: '#0f172a',
              borderRadius: '16px',
              height: '400px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)'
            }}>
              {/* Animated Map Grid lines */}
              <div className="portal-grid-lines" style={{ opacity: 0.05 }} />

              {/* Map Canvas */}
              <svg width="100%" height="100%" viewBox="0 0 500 400" style={{ position: 'absolute', inset: 0 }}>
                {/* Simulated India Outline */}
                <path d="M 250,50 L 290,120 L 320,160 L 340,210 L 320,280 L 260,370 L 250,370 L 200,280 L 160,240 L 170,180 L 190,140 Z" 
                      fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                
                {/* Route lines */}
                {/* Delhi -> Mumbai */}
                <path d="M 230,120 Q 180,200 200,250" fill="none" stroke="#4f8ef7" strokeWidth="2" strokeDasharray="5,5" className="dash-move-line" />
                {/* Delhi -> Kolkata */}
                <path d="M 230,120 Q 300,160 330,190" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5,5" />
                {/* Mumbai -> Bangalore */}
                <path d="M 200,250 Q 210,280 220,310" fill="none" stroke="#4f8ef7" strokeWidth="2" strokeDasharray="5,5" />
                {/* Kolkata -> Chennai */}
                <path d="M 330,190 Q 300,280 260,320" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5,5" />

                {/* Hub Dots */}
                {/* Delhi */}
                <circle cx="230" cy="120" r="7" fill="#10b981" />
                <circle cx="230" cy="120" r="14" fill="none" stroke="#10b981" strokeWidth="1.5" className="radar-ping" />
                {/* Mumbai */}
                <circle cx="200" cy="250" r="7" fill="#10b981" />
                <circle cx="200" cy="250" r="14" fill="none" stroke="#10b981" strokeWidth="1.5" className="radar-ping" />
                {/* Kolkata */}
                <circle cx="330" cy="190" r="7" fill="#10b981" />
                <circle cx="330" cy="190" r="14" fill="none" stroke="#10b981" strokeWidth="1.5" className="radar-ping" />
                {/* Bangalore */}
                <circle cx="220" cy="310" r="7" fill="#10b981" />
                <circle cx="220" cy="310" r="14" fill="none" stroke="#10b981" strokeWidth="1.5" className="radar-ping" />
              </svg>

              {/* Legend overlay */}
              <div style={{
                position: 'absolute', bottom: '16px', left: '16px',
                background: 'rgba(15,23,42,0.85)', padding: '12px 16px', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '11px',
                fontFamily: 'monospace'
              }}>
                <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '4px' }}>📡 DISPATCH CHANNELS ACTIVE</div>
                <div>• IND-DEL (Delhi Hub): 24 Shipments in pool</div>
                <div>• IND-BOM (Mumbai Hub): 42 Shipments in pool</div>
                <div>• IND-BLR (Bangalore Hub): 19 Shipments in pool</div>
              </div>
            </div>

            {/* Hub Metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { name: 'Delhi Hub (NCR)', shipments: '45 Dispatched', load: 'Medium Load', percent: 60, status: 'Normal' },
                { name: 'Mumbai Hub (West)', shipments: '82 Dispatched', load: 'High Load', percent: 85, status: 'Congested' },
                { name: 'Kolkata Hub (East)', shipments: '21 Dispatched', load: 'Low Load', percent: 30, status: 'Clear' },
                { name: 'Bangalore Hub (South)', shipments: '38 Dispatched', load: 'Medium Load', percent: 52, status: 'Clear' },
              ].map((h, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{h.name}</span>
                    <span style={{
                      fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '8px',
                      background: h.status === 'Congested' ? '#fee2e2' : '#ecfdf5',
                      color: h.status === 'Congested' ? '#dc2626' : '#10b981'
                    }}>{h.status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>{h.shipments}</span>
                    <span>{h.load}</span>
                  </div>
                  <div className="progress" style={{ height: '5px' }}>
                    <div className={`progress-bar ${h.status === 'Congested' ? 'danger' : 'success'}`} style={{ width: `${h.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: SYSTEM DIAGNOSTICS ── */}
      {activeTab === 'diagnostics' && (
        <div className="slide-up" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
          
          {/* Health Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: '20px', border: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
                🖥️ Server Resource Health
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', fontWeight: 600 }}>
                    <span>CPU Usage</span>
                    <span>24%</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}><div className="progress-bar success" style={{ width: '24%' }} /></div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', fontWeight: 600 }}>
                    <span>Memory Usage</span>
                    <span>68% (5.4 GB / 8.0 GB)</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}><div className="progress-bar warning" style={{ width: '68%' }} /></div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', fontWeight: 600 }}>
                    <span>Database Pool Connections</span>
                    <span>18 Active</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}><div className="progress-bar success" style={{ width: '36%' }} /></div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⚡ API RESPONSE TIME
              </div>
              <div style={{ fontSize: '42px', fontWeight: 900, color: latency > 80 ? '#f59e0b' : '#10b981', margin: '8px 0', fontFamily: 'monospace' }}>
                {latency}ms
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Average ping load from active sockets
              </div>
            </div>
          </div>

          {/* Real-time Streaming Logs Terminal */}
          <div className="card" style={{
            background: '#090d16',
            border: '1px solid #111827',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-card)',
            color: '#10b981',
            fontFamily: 'Consolas, monospace',
            fontSize: '13px',
            display: 'flex',
            flexDirection: 'column',
            height: '420px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(16,185,129,0.15)',
              paddingBottom: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ color: '#ffffff', fontWeight: 700, marginLeft: '8px', fontSize: '12px' }}>
                  console@shiptrack:~/server-logs
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(16,185,129,0.5)' }}>Stream Active</span>
            </div>
            
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column-reverse',
              gap: '6px',
              paddingRight: '6px',
              lineHeight: '1.5'
            }}>
              {sysLogs.map((log, idx) => (
                <div key={idx} style={{
                  color: log.includes('WARNING') ? '#f59e0b' : log.includes('ERROR') ? '#ef4444' : '#10b981'
                }}>
                  {log}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </AppLayout>
  );
}
