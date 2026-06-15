import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';
import { jsPDF } from 'jspdf';
import {
  MdDashboard, MdDirectionsBoat, MdPeople, MdBusiness,
  MdTimeline, MdWarning, MdArrowForward, MdDownload,
  MdAttachMoney, MdPublish, MdCalculate, MdLocalShipping,
  MdAssignmentInd, MdCloudUpload, MdInventory2
} from 'react-icons/md';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import MarineLayout from './MarineLayout';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const DEMO_SHIPS = [
  { id: 1, name: 'Mumbai Express', flag: 'India', img: 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=300&q=80', status: 'In Transit' },
  { id: 2, name: 'Atlantic Carrier', flag: 'Panama', img: 'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=300&q=80', status: 'Anchored' },
  { id: 3, name: 'Pacific Star', flag: 'Singapore', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80', status: 'Loading' },
  { id: 4, name: 'Ocean Titan', flag: 'Marshall Islands', img: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&q=80', status: 'Maintenance' },
];

export default function MarineCompanyDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('fleet');

  // Quick Quote state
  const [quoteForm, setQuoteForm] = useState({
    sender: 'Acme Corp Inc',
    receiver: 'Global Logistics Ltd',
    weight: 12,
    service: 'express',
    distance: 450,
    pkgType: 'parcel',
    priority: 'normal'
  });
  const [calculatedQuote, setCalculatedQuote] = useState(null);

  // Bulk Import state
  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importedShipments, setImportedShipments] = useState([]);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setStats(res.data.stats))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/manager/login');
  };

  // Quote Calculator Logic
  const handleQuoteChange = (e) => {
    setQuoteForm({ ...quoteForm, [e.target.name]: e.target.value });
  };

  const calculateQuoteCost = (e) => {
    e.preventDefault();
    const basePrice = quoteForm.service === 'express' ? 120 : 60;
    const distancePrice = Number(quoteForm.distance) * 0.8;
    const weightPrice = Number(quoteForm.weight) * 15;
    const priorityMultiplier = quoteForm.priority === 'urgent' ? 1.5 : quoteForm.priority === 'high' ? 1.25 : 1.0;
    
    const subtotal = (basePrice + distancePrice + weightPrice) * priorityMultiplier;
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;

    setCalculatedQuote({
      base: basePrice.toFixed(2),
      distance: distancePrice.toFixed(2),
      weightCost: weightPrice.toFixed(2),
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2)
    });
    toast.success('Quote generated!');
  };

  // jsPDF Quote Downloader
  const downloadQuotePDF = () => {
    if (!calculatedQuote) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('SHIPTRACK PRO - QUOTE INVOICE', 14, 20);
    doc.setFontSize(10);
    doc.text(`Company Registered: ${user?.companyName || 'Marine Co.'}`, 14, 32);
    doc.text(`Date of Issue: ${format(new Date(), 'dd-MM-yyyy HH:mm')}`, 14, 38);

    // Bill Info
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text('LOGISTICS INFORMATION:', 14, 60);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Sender Entity: ${quoteForm.sender}`, 14, 68);
    doc.text(`Receiver Entity: ${quoteForm.receiver}`, 14, 74);
    doc.text(`Total Weight: ${quoteForm.weight} kg`, 14, 80);
    doc.text(`Estimated Distance: ${quoteForm.distance} km`, 14, 86);
    doc.text(`Service Level: ${quoteForm.service?.toUpperCase()}`, 14, 92);
    doc.text(`Priority Rank: ${quoteForm.priority?.toUpperCase()}`, 14, 98);

    // Pricing Table
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 110, 196, 110);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text('COST SUMMARY BREAKDOWN', 14, 118);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Base Handling Rate:', 14, 128);
    doc.text(`Rs. ${calculatedQuote.base}`, 150, 128);

    doc.text('Distance Tariff (Km):', 14, 134);
    doc.text(`Rs. ${calculatedQuote.distance}`, 150, 134);

    doc.text('Weight Variable Tariff (Kg):', 14, 140);
    doc.text(`Rs. ${calculatedQuote.weightCost}`, 150, 140);

    doc.setDrawColor(230, 230, 230);
    doc.line(14, 145, 196, 145);

    doc.setFontSize(11);
    doc.text('Subtotal Net:', 14, 153);
    doc.text(`Rs. ${calculatedQuote.subtotal}`, 150, 153);

    doc.text('GST Service Tax (18%):', 14, 159);
    doc.text(`Rs. ${calculatedQuote.tax}`, 150, 159);

    doc.setFillColor(248, 250, 252);
    doc.rect(12, 166, 186, 14, 'F');
    doc.setTextColor(232, 56, 13);
    doc.setFontSize(13);
    doc.text('GRAND TOTAL ESTIMATED PRICE:', 14, 175);
    doc.text(`Rs. ${calculatedQuote.total}`, 148, 175);

    // T&C
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text('Terms & Conditions: Prices are estimated and subject to actual dimensions auditing on dispatcher hubs.', 14, 210);
    doc.text('Generated dynamically via ShipTrack Pro manager engine.', 14, 215);

    doc.save(`Quote_${quoteForm.sender.replace(/\s+/g,'_')}.pdf`);
    toast.success('Quote PDF downloaded!');
  };

  // CSV Import simulation
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const simulateCSVImport = (e) => {
    e.preventDefault();
    if (!csvFile) return toast.error('Please select a CSV file first');
    setImporting(true);
    toast.loading('Parsing Excel/CSV shipping payload...');
    
    setTimeout(() => {
      const mockList = [
        { id: 'SHP-M884', sender: 'Reliance Ind', receiver: 'Delhi Delivery Ltd', weight: 45, service: 'cargo', dest: 'Mumbai' },
        { id: 'SHP-M885', sender: 'TCS Infotech', receiver: 'Tech Hub Kolkata', weight: 5, service: 'express', dest: 'Kolkata' },
        { id: 'SHP-M886', sender: 'Infosys Corp', receiver: 'Apex Dist Bangalore', weight: 12, service: 'standard', dest: 'Bangalore' },
      ];
      setImportedShipments(mockList);
      setImporting(false);
      setCsvFile(null);
      toast.dismiss();
      toast.success('Successfully imported 3 shipments into the active queue!');
    }, 2500);
  };

  return (
    <MarineLayout active="/manager">
      {/* Welcome Banner */}
          <div className="marine-welcome-banner" style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderLeft: '5px solid #8b5cf6'
          }}>
            <div>
              <div className="marine-welcome-emoji">⚙️</div>
              <h1 className="marine-welcome-title">Control Workspace, {user?.name || 'Manager'}</h1>
              <p className="marine-welcome-sub">Calculate pricing, monitor ship logs, and dispatch cargo.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['fleet', 'courier', 'quote', 'bulk'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: activeTab === tab ? '#8b5cf6' : 'rgba(255,255,255,0.06)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab === 'fleet' && '🚢 Fleet Registry'}
                  {tab === 'courier' && '🚚 Courier Ops'}
                  {tab === 'quote' && '🧮 Quote Calculator'}
                  {tab === 'bulk' && '📥 Bulk Import'}
                </button>
              ))}
            </div>
          </div>

          {/* ── TAB 1: FLEET REGISTRY & ANALYTICS ── */}
          {activeTab === 'fleet' && (
            <div className="slide-up">
              {/* Vessel Grid */}
              <div className="marine-section">
                <div className="marine-section-header">
                  <div className="marine-section-bar" style={{ background: '#8b5cf6' }} />
                  <h2 className="marine-section-title">Active Vessel Fleet</h2>
                </div>
                <div className="marine-fleet-scroll">
                  <div className="marine-fleet-track" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {DEMO_SHIPS.map(ship => (
                      <div key={ship.id} className="marine-ship-card" style={{ width: 'auto' }}>
                        <div className="marine-ship-img-wrap" style={{ height: '140px' }}>
                          <img src={ship.img} alt={ship.name} className="marine-ship-img" />
                        </div>
                        <div className="marine-ship-info">
                          <div className="marine-ship-name" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{ship.name}</span>
                            <span style={{
                              fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                              background: ship.status === 'In Transit' ? '#dcfce7' : '#f1f5f9',
                              color: ship.status === 'In Transit' ? '#16a34a' : '#475569'
                            }}>{ship.status}</span>
                          </div>
                          <div className="marine-ship-flag">📍 Registry Flag: {ship.flag}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance Chart & Fleet Statistics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginTop: '24px' }}>
                <div className="marine-analytics-card" style={{ border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '15px', marginBottom: '16px' }}>
                    📈 Daily Machinery Load Distribution
                  </div>
                  <div style={{ height: '220px' }}>
                    <Bar
                      data={{
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        datasets: [{
                          label: 'Engine Load (%)',
                          data: [72, 85, 68, 90, 78, 80, 65],
                          backgroundColor: '#8b5cf6',
                          borderRadius: 4,
                        }],
                      }}
                      options={{
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(0,0,0,0.03)' } },
                          y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(0,0,0,0.03)' } },
                        },
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Total Vessels Registered', value: stats?.totalShips || 4, color: '#8b5cf6', desc: 'Active dry cargo fleet' },
                    { label: 'Active Voyage Timelines', value: stats?.activeVoyages || 1, color: '#06b6d4', desc: 'Transit ports synced' },
                    { label: 'Active Alarms Logged', value: stats?.activeAlarms || 0, color: '#ef4444', desc: 'Requires crew review' },
                  ].map((s, idx) => (
                    <div key={idx} style={{
                      border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', background: '#ffffff',
                      borderLeft: `4px solid ${s.color}`
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 900, color: s.color }}>{s.value}</div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>{s.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: COURIER OPERATIONS & ROUTING ── */}
          {activeTab === 'courier' && (
            <div className="slide-up">
              {/* Courier Quick Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ border: '1px solid var(--border)', background: '#ffffff', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontSize: '32px', color: '#3b82f6' }}><MdLocalShipping /></div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Courier Shipments Pool</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {stats?.totalShipments || 0}
                    </div>
                  </div>
                </div>
                <div style={{ border: '1px solid var(--border)', background: '#ffffff', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontSize: '32px', color: '#f59e0b' }}><MdAssignmentInd /></div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Awaiting Staff Assignment</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {stats?.pending || 0}
                    </div>
                  </div>
                </div>
                <div style={{ border: '1px solid var(--border)', background: '#ffffff', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontSize: '32px', color: '#10b981' }}><MdPeople /></div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Registered Delivery Staff</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {stats?.activeStaff || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Grid */}
              <div style={{ border: '1px solid var(--border)', background: '#ffffff', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  🚚 Delivery Assignments Control
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Create manual shipping entries or assign processing packages to couriers.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-primary" onClick={() => navigate('/manager/create-shipment')}>
                    ➕ Create Single Shipment
                  </button>
                  <button className="btn btn-secondary" onClick={() => navigate('/manager/assign-deliveries')}>
                    👤 Assign Couriers
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: QUICK QUOTE COST CALCULATOR ── */}
          {activeTab === 'quote' && (
            <div className="slide-up" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
              {/* Form Card */}
              <div className="card" style={{ padding: '24px', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MdCalculate /> Package Tariff Estimator
                </h3>
                <form onSubmit={calculateQuoteCost} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Sender Name</label>
                    <input className="form-input" name="sender" value={quoteForm.sender} onChange={handleQuoteChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Receiver Name</label>
                    <input className="form-input" name="receiver" value={quoteForm.receiver} onChange={handleQuoteChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Package Weight (kg)</label>
                    <input className="form-input" type="number" name="weight" value={quoteForm.weight} onChange={handleQuoteChange} required min="1" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Transit Distance (km)</label>
                    <input className="form-input" type="number" name="distance" value={quoteForm.distance} onChange={handleQuoteChange} required min="1" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Service Level</label>
                    <select className="form-select" name="service" value={quoteForm.service} onChange={handleQuoteChange}>
                      <option value="standard">Standard Cargo Road</option>
                      <option value="express">Express Air Carrier</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority rank</label>
                    <select className="form-select" name="priority" value={quoteForm.priority} onChange={handleQuoteChange}>
                      <option value="normal">Normal</option>
                      <option value="high">High (+25% Tariff)</option>
                      <option value="urgent">Urgent (+50% Tariff)</option>
                    </select>
                  </div>
                  <button className="btn btn-primary" style={{ gridColumn: 'span 2', height: '42px' }} type="submit">
                    Calculate Invoice Quote
                  </button>
                </form>
              </div>

              {/* Cost Preview & Downloader */}
              <div className="card" style={{ padding: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
                  📋 Estimate Invoice Summary
                </h3>
                {calculatedQuote ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Base Rate</span>
                      <span style={{ fontWeight: 600 }}>Rs. {calculatedQuote.base}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Distance Cost</span>
                      <span style={{ fontWeight: 600 }}>Rs. {calculatedQuote.distance}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Weight Cost</span>
                      <span style={{ fontWeight: 600 }}>Rs. {calculatedQuote.weightCost}</span>
                    </div>
                    <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                      <span style={{ fontWeight: 600 }}>Rs. {calculatedQuote.subtotal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>GST Tax (18%)</span>
                      <span style={{ fontWeight: 600 }}>Rs. {calculatedQuote.tax}</span>
                    </div>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', fontSize: '15px',
                      padding: '10px 12px', background: 'var(--danger-bg)', color: 'var(--danger)',
                      borderRadius: '8px', fontWeight: 800, marginTop: '8px'
                    }}>
                      <span>TOTAL PRICE</span>
                      <span>Rs. {calculatedQuote.total}</span>
                    </div>
                    
                    <button
                      className="btn btn-secondary"
                      onClick={downloadQuotePDF}
                      style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <MdDownload /> Export PDF Quote
                    </button>
                  </div>
                ) : (
                  <div className="empty-state" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Fill details to view quote calculation
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 4: BATCH CSV SHIPMENT IMPORT ── */}
          {activeTab === 'bulk' && (
            <div className="slide-up card" style={{ padding: '24px', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MdCloudUpload /> Batch Shipment CSV Import
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Import bulk orders into ShipTrack. Drag and drop your shipping CSV template file.
              </p>

              <form onSubmit={simulateCSVImport} style={{
                border: '2px dashed var(--border-hover)',
                borderRadius: '16px',
                padding: '40px',
                textAlign: 'center',
                background: '#f8fafc',
                cursor: 'pointer',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '48px', color: '#8b5cf6', marginBottom: '12px' }}><MdInventory2 /></div>
                <input type="file" accept=".csv" id="bulk-csv" style={{ display: 'none' }} onChange={handleFileChange} />
                <label htmlFor="bulk-csv" style={{ cursor: 'pointer' }}>
                  <span style={{ color: '#8b5cf6', fontWeight: 700 }}>Choose CSV File</span> or drag here
                </label>
                {csvFile && (
                  <div style={{ marginTop: '12px', fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>
                    Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
                
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={importing || !csvFile}
                  style={{ display: 'block', margin: '20px auto 0 auto', width: '220px' }}
                >
                  {importing ? 'Processing Import...' : 'Import Bulk Shipments'}
                </button>
              </form>

              {/* Preview Imported List */}
              {importedShipments.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                    📋 Imported Shipment Preview Queue
                  </h4>
                  <div className="table-container" style={{ boxShadow: 'none', border: '1px solid var(--border)' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Temp ID</th>
                          <th>Sender</th>
                          <th>Receiver</th>
                          <th>Weight</th>
                          <th>Service Type</th>
                          <th>Destination</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importedShipments.map((s, i) => (
                          <tr key={i}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#8b5cf6' }}>{s.id}</td>
                            <td>{s.sender}</td>
                            <td>{s.receiver}</td>
                            <td>{s.weight} kg</td>
                            <td style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 700 }}>{s.service}</td>
                            <td>{s.dest}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

    </MarineLayout>
  );
}
