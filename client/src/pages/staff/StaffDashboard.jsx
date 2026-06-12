import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import { dashboardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  MdDashboard, MdDirectionsBoat, MdTimeline, MdWarning,
  MdMenuBook, MdWater, MdLocalGasStation, MdInventory,
  MdBarChart, MdEngineering, MdUpdate, MdCamera, MdNotificationsActive,
  MdCalendarToday, MdChevronRight, MdAdd, MdInfo, MdSpeed, MdCompassCalibration,
  MdAnchor,
} from 'react-icons/md';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ShipmentDetailModal from '../../components/shipments/ShipmentDetailModal';
import StatusUpdateModal from '../../components/shipments/StatusUpdateModal';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'dashboard';

  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [statusShipment, setStatusShipment]     = useState(null);

  // Dummy data for records
  const [odsEntries, setOdsEntries] = useState([
    { id: 1, date: '2026-06-10', system: 'Air Conditioning System 1', gasType: 'R-134a', qty: '2.5 kg', operation: 'Recharged', person: 'Chief Officer' },
    { id: 2, date: '2026-06-05', system: 'Provisions Refrigerator', gasType: 'R-404A', qty: '1.2 kg', operation: 'Leak repaired', person: 'Second Engineer' }
  ]);

  const [ballastLogs, setBallastLogs] = useState([
    { id: 1, date: '2026-06-11', tank: '3P Double Bottom', volume: '450 m³', salinity: '32 PSU', status: 'Ballasted', location: 'Arabian Sea' },
    { id: 2, date: '2026-06-08', tank: 'Aft Peak Tank', volume: '180 m³', salinity: '28 PSU', status: 'De-ballasted', location: 'Port of Mumbai' }
  ]);

  const [bunkerLogs, setBunkerLogs] = useState([
    { id: 1, date: '2026-06-09', fuelType: 'VLSFO (Very Low Sulfur Fuel Oil)', qty: '320 MT', viscosity: '380 cSt', sulfur: '0.48%', supplier: 'Marine Fuel Corp' },
    { id: 2, date: '2026-06-02', fuelType: 'MGO (Marine Gas Oil)', qty: '45 MT', viscosity: '15 cSt', sulfur: '0.08%', supplier: 'Global Bunkering Ltd' }
  ]);

  const [cargoLogs, setCargoLogs] = useState([
    { id: 1, date: '2026-06-12', operation: 'Discharging', cargoType: 'Crude Oil', qty: '12,500 bbls', rate: '2,400 bbls/hr', status: 'Completed' },
    { id: 2, date: '2026-06-11', operation: 'Loading', cargoType: 'MGO Fuel Cargo', qty: '5,000 bbls', rate: '1,500 bbls/hr', status: 'Completed' }
  ]);

  const [alarmLogs, setAlarmLogs] = useState([
    { id: 1, time: '10:42 PM', category: 'Machinery', title: 'Jacket Cooling Water High Temp Alarm', status: 'Active', severity: 'high' },
    { id: 2, time: '08:15 PM', category: 'Navigation', title: 'GPS Signal Integrity Warning', status: 'Resolved', severity: 'warning' },
    { id: 3, time: '06:30 PM', category: 'Safety', title: 'Bilge Well No. 2 High Level Alarm', status: 'Resolved', severity: 'urgent' }
  ]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.getStats();
      setStats(res.data.stats);
    } catch { toast.error('Failed to load stats'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const today = format(new Date(), 'dd MMM yyyy');
  const greeting = 'Welcome back';

  const activeDeliveries = stats?.todayDeliveries || [];
  const firstActive = activeDeliveries[0];

  const handleAddOds = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const newEntry = {
      id: Date.now(),
      date: data.get('date'),
      system: data.get('system'),
      gasType: data.get('gasType'),
      qty: data.get('qty') + ' kg',
      operation: data.get('operation'),
      person: user?.name || 'Chief Officer'
    };
    setOdsEntries([newEntry, ...odsEntries]);
    toast.success('ODS Record entry logged! 📋');
    e.target.reset();
  };

  const handleAddBallast = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const newEntry = {
      id: Date.now(),
      date: data.get('date'),
      tank: data.get('tank'),
      volume: data.get('volume') + ' m³',
      salinity: data.get('salinity') + ' PSU',
      status: data.get('status'),
      location: data.get('location')
    };
    setBallastLogs([newEntry, ...ballastLogs]);
    toast.success('Ballast Water operation logged! 🌊');
    e.target.reset();
  };

  if (loading) return (
    <AppLayout title="Staff Dashboard" subtitle="Redesigning Overview">
      <div className="loading-container"><div className="spinner" /></div>
    </AppLayout>
  );

  // Calculate Voyage stages
  const voyageStages = ['DEPARTURE', 'IN TRANSIT', 'ARRIVAL'];
  let currentStageIndex = 0; // default DEPARTURE
  if (firstActive) {
    if (firstActive.status === 'in_transit' || firstActive.status === 'picked_up' || firstActive.status === 'dispatched') {
      currentStageIndex = 1;
    } else if (firstActive.status === 'out_for_delivery' || firstActive.status === 'delivered') {
      currentStageIndex = 2;
    }
  }

  // Calculate progress percentage
  const progressPercent = (currentStageIndex / 2) * 100;

  return (
    <AppLayout title="Staff Dashboard" subtitle="Marine vessel operations overview">
      
      {/* ── HEADER BANNER (Dark Navy like MARIN-STAFF) ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f1e36 0%, #061124 100%)',
        borderRadius: '16px',
        padding: '24px 32px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        borderLeft: '5px solid #e8380d'
      }}>
        <div>
          <h2 style={{
            fontSize: '24px', fontWeight: 800, color: '#ffffff',
            marginBottom: '4px', letterSpacing: '-0.5px',
            textTransform: 'lowercase', fontFamily: 'system-ui, sans-serif'
          }}>
            👋 {greeting}, {user?.name?.toLowerCase() || 'tuesday today'}
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, fontWeight: 500 }}>
            Here's your ship operations overview for today
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            background: '#e8380d', color: 'white',
            padding: '6px 16px', borderRadius: '20px',
            fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px',
          }}>
            CHIEF OFFICER
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            color: '#ffffff', border: '1px solid rgba(255,255,255,0.12)',
            padding: '6px 14px', borderRadius: '10px',
            fontWeight: 600, fontSize: '12.5px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <MdCalendarToday size={14} style={{ color: '#e8380d' }} /> {today}
          </div>
        </div>
      </div>

      {/* ── TAB PANELS CONTENT ── */}
      {tab === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '28px' }}>
          
          {/* LEFT: Voyage Status Card */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: 'system-ui, sans-serif' }}>
                  Voyage Status
                </h3>
                <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 700, marginTop: '4px', letterSpacing: '1px' }}>
                  VOYAGE NO. {firstActive?.trackingId || '23424'}
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0',
                padding: '6px 14px', borderRadius: '30px', fontSize: '12px', fontWeight: 600,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }}/>
                Online Sync Active
              </div>
            </div>

            {/* Visual Progress Line */}
            <div style={{ position: 'relative', padding: '0 20px', marginBottom: '40px' }}>
              {/* Background grey track */}
              <div style={{ height: '4px', background: '#e2e8f0', width: '100%', borderRadius: '4px', position: 'absolute', top: '24px', left: 0, right: 0 }} />
              {/* Active blue track */}
              <div style={{
                height: '4px',
                background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                width: `${progressPercent}%`,
                borderRadius: '4px',
                position: 'absolute', top: '24px', left: 0,
                transition: 'width 0.4s ease'
              }} />

              {/* Pins and Labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                {voyageStages.map((stage, i) => {
                  const isActive = i <= currentStageIndex;
                  const isCurrent = i === currentStageIndex;
                  return (
                    <div key={stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      {/* Location Pin above the current stage */}
                      <div style={{ height: '24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                        {isCurrent && (
                          <span style={{ fontSize: '20px', animation: 'bounce 1s infinite', transformOrigin: 'bottom' }}>📍</span>
                        )}
                      </div>
                      {/* Node Circle */}
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%',
                        background: isCurrent ? '#ffffff' : isActive ? '#3b82f6' : '#e2e8f0',
                        border: isCurrent ? '5px solid #ef4444' : isActive ? 'none' : '3px solid #cbd5e1',
                        boxShadow: isCurrent ? '0 0 0 4px rgba(239, 68, 68, 0.2)' : 'none',
                        margin: '6px 0 10px',
                        transition: 'all 0.3s'
                      }} />
                      {/* Stage Label */}
                      <div style={{
                        fontSize: '11px', fontWeight: 700,
                        color: isCurrent ? '#ef4444' : isActive ? '#0f172a' : '#64748b',
                        letterSpacing: '0.5px'
                      }}>{stage}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Split Details Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: 'auto' }}>
              {/* Red-accented section */}
              <div style={{
                borderTop: '3px solid #ef4444',
                paddingTop: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>🚢 Voyage No</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{firstActive?.trackingId || '23424'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Route</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>
                    {firstActive ? `${firstActive.senderCity} → ${firstActive.receiverCity}` : 'testing → testing'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Status / Stay</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>
                    {firstActive ? firstActive.status?.replace(/_/g,' ').toUpperCase() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Blue-accented section */}
              <div style={{
                borderTop: '3px solid #3b82f6',
                paddingTop: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>📍 Position</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>
                    {firstActive?.currentLocation || firstActive?.senderCity || 'testing, testing'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Course (COG)</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{firstActive?.weight ? Math.round(firstActive.weight * 5 % 360) : '45'}°</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Speed (SOG)</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{firstActive?.weight ? Math.round(firstActive.weight / 10 + 2) : '4'} kts</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {firstActive && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <button className="btn btn-primary btn-sm" style={{ background: '#3b82f6' }} onClick={() => setStatusShipment(firstActive)}>
                  <MdUpdate size={15} /> Update Status
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedShipment(firstActive)}>
                  <MdCamera size={15} /> View Proof / Details
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Ship Details Card */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ef4444', fontSize: '22px', display: 'flex', alignItems: 'center' }}><MdDirectionsBoat /></span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>i4 ship</h3>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: '#ecfdf5', color: '#10b981',
                padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                Active
              </div>
            </div>

            {/* Attributes List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {[
                { icon: <MdFlagStyle />, label: 'Flag', value: 'India' },
                { icon: <MdEngineering />, label: 'Type', value: 'Oil Tanker' },
                { icon: <MdAnchor />, label: 'Class', value: 'CCS' },
                { icon: <MdInventory />, label: 'Deadweight', value: '100 Tons' },
                { icon: <MdSpeed />, label: 'Max Draft', value: '222 m' },
              ].map((row, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', justifySelf: 'stretch',
                  padding: '10px 12px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #f1f5f9'
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: '#eff6ff', color: '#3b82f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', marginRight: '12px', flexShrink: 0
                  }}>
                    {row.icon}
                  </div>
                  <div style={{ flex: 1, fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{row.label}</div>
                  <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 700 }}>{row.value}</div>
                </div>
              ))}
            </div>

            {/* Interactive Live Map Radar Mockup */}
            <div style={{
              background: '#0f172a',
              borderRadius: '12px',
              height: '130px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
            }}>
              {/* Radar Rings */}
              <div style={{ position: 'absolute', width: '220px', height: '220px', borderRadius: '50%', border: '1px solid rgba(16, 185, 129, 0.15)' }} />
              <div style={{ position: 'absolute', width: '150px', height: '150px', borderRadius: '50%', border: '1px solid rgba(16, 185, 129, 0.25)' }} />
              <div style={{ position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', border: '1px solid rgba(16, 185, 129, 0.35)' }} />
              
              {/* Radar Sweeper Sweep */}
              <div className="radar-sweep" style={{
                position: 'absolute', width: '100%', height: '100%',
                background: 'conic-gradient(from 0deg at 50% 50%, rgba(16, 185, 129, 0.15) 0deg, transparent 90deg)',
                animation: 'spin 4s linear infinite',
                transformOrigin: 'center'
              }} />

              {/* Pulsing Target Dot */}
              <div style={{
                position: 'absolute', top: '45%', left: '55%',
                width: '10px', height: '10px', borderRadius: '50%',
                background: '#ef4444', boxShadow: '0 0 10px #ef4444',
                animation: 'pulse 1.5s infinite'
              }} />

              {/* Radar Text */}
              <div style={{
                position: 'absolute', bottom: '8px', left: '12px',
                fontSize: '9px', fontFamily: 'monospace', color: '#10b981',
                textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600
              }}>
                🛰️ Live GPS Map Track
              </div>
              <div style={{
                position: 'absolute', top: '8px', right: '12px',
                fontSize: '9px', fontFamily: 'monospace', color: '#ef4444',
                textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700
              }}>
                Speed: 4.0 KTS
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ── SHIP TAB ── */}
      {tab === 'ship' && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🚢 Vessel Profile: i4 ship
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>General Dimensions</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  {[
                    { l: 'Length Overall (LOA)', v: '182.5 m' },
                    { l: 'Beam (Width)', v: '32.2 m' },
                    { l: 'Gross Tonnage', v: '29,450 GT' },
                    { l: 'Net Tonnage', v: '14,120 NT' },
                    { l: 'IMO Number', v: '9845634' },
                  ].map(r => (
                    <tr key={r.l} style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '8px 0', color: '#64748b' }}>{r.l}</td><td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{r.v}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Machinery & Engine</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  {[
                    { l: 'Main Engine Model', v: 'MAN B&W 6S50ME-C' },
                    { l: 'Max Power output', v: '9,480 kW' },
                    { l: 'Auxiliary Generators', v: '3 x Yanmar 6EY18AL' },
                    { l: 'Propeller Type', v: 'Fixed Pitch (4 blades)' },
                    { l: 'Fuel Consumption', v: '24.5 MT/day (eco)' },
                  ].map(r => (
                    <tr key={r.l} style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '8px 0', color: '#64748b' }}>{r.l}</td><td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{r.v}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ALARM TAB ── */}
      {tab === 'alarm' && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              🚨 Machinery & Navigation Alarms
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => toast.success('All alarms acknowledged! ✅')}>Acknowledge All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alarmLogs.map(a => (
              <div key={a.id} style={{
                border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: a.status === 'Active' ? '#fff5f5' : '#f8fafc',
                borderLeft: `5px solid ${a.severity === 'high' || a.severity === 'urgent' ? '#ef4444' : '#f59e0b'}`
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                      background: a.status === 'Active' ? '#fee2e2' : '#cbd5e1',
                      color: a.status === 'Active' ? '#dc2626' : '#475569'
                    }}>{a.status.toUpperCase()}</span>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>{a.category} • {a.time}</span>
                  </div>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14.5px' }}>{a.title}</div>
                </div>
                {a.status === 'Active' && (
                  <button className="btn btn-secondary btn-sm" style={{ background: 'white' }} onClick={() => {
                    setAlarmLogs(alarmLogs.map(al => al.id === a.id ? {...al, status: 'Resolved'} : al));
                    toast.success('Alarm acknowledged');
                  }}>Ack</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ODS RECORD BOOK TAB ── */}
      {tab === 'ods' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* New Entry Form */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✍️ Log Ozone Depleting Substances (ODS) Entry
            </h3>
            <form onSubmit={handleAddOds} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date</label>
                <input className="form-input" type="date" name="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">System / Machinery</label>
                <input className="form-input" name="system" placeholder="e.g. AC Pack 2" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Gas Type</label>
                <select className="form-select" name="gasType">
                  <option value="R-134a">R-134a</option>
                  <option value="R-404A">R-404A</option>
                  <option value="R-407C">R-407C</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Quantity (kg)</label>
                <input className="form-input" type="number" step="0.1" name="qty" placeholder="e.g. 1.5" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Operation Type</label>
                <select className="form-select" name="operation">
                  <option value="Recharged">Recharged</option>
                  <option value="Recovered">Recovered / Discharged</option>
                  <option value="Leak Test">Leak Test / Maintenance</option>
                </select>
              </div>
              <button className="btn btn-primary" style={{ height: '42px', background: '#3b82f6' }} type="submit"><MdAdd /> Log Entry</button>
            </form>
          </div>

          {/* Records Table */}
          <div className="table-container">
            <div className="table-toolbar">
              <div style={{ fontWeight: 700, color: '#0f172a' }}>ODS Record Book Logs</div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>System</th>
                  <th>Gas Type</th>
                  <th>Quantity</th>
                  <th>Operation</th>
                  <th>Logged By</th>
                </tr>
              </thead>
              <tbody>
                {odsEntries.map(e => (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td style={{ fontWeight: 600 }}>{e.system}</td>
                    <td><span className="badge badge-processing">{e.gasType}</span></td>
                    <td>{e.qty}</td>
                    <td>{e.operation}</td>
                    <td>{e.person}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── BALLAST WATER RECORD BOOK TAB ── */}
      {tab === 'ballast' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🌊 Log Ballast Water Operation
            </h3>
            <form onSubmit={handleAddBallast} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date</label>
                <input className="form-input" type="date" name="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tank Name</label>
                <input className="form-input" name="tank" placeholder="e.g. Forepeak" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Volume (m³)</label>
                <input className="form-input" type="number" name="volume" placeholder="e.g. 200" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Salinity (PSU)</label>
                <input className="form-input" type="number" name="salinity" placeholder="e.g. 30" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Operation</label>
                <select className="form-select" name="status">
                  <option value="Ballasted">Ballasted</option>
                  <option value="De-ballasted">De-ballasted</option>
                  <option value="Exchanged">Exchanged</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Location</label>
                <input className="form-input" name="location" placeholder="e.g. Port of Mumbai" required />
              </div>
              <button className="btn btn-primary" style={{ height: '42px', background: '#3b82f6' }} type="submit"><MdAdd /> Log</button>
            </form>
          </div>

          <div className="table-container">
            <div className="table-toolbar">
              <div style={{ fontWeight: 700, color: '#0f172a' }}>Ballast Water Operations Log</div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Tank</th>
                  <th>Volume</th>
                  <th>Salinity</th>
                  <th>Operation</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {ballastLogs.map(l => (
                  <tr key={l.id}>
                    <td>{l.date}</td>
                    <td style={{ fontWeight: 600 }}>{l.tank}</td>
                    <td>{l.volume}</td>
                    <td>{l.salinity}</td>
                    <td><span className={`badge ${l.status === 'Ballasted' ? 'badge-processing' : 'badge-delivered'}`}>{l.status}</span></td>
                    <td>{l.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── BUNKER RECORD BOOK TAB ── */}
      {tab === 'bunker' && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⛽ Bunker Fuel Operations Log
          </h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Fuel Grade</th>
                  <th>Quantity Loaded</th>
                  <th>Viscosity</th>
                  <th>Sulfur %</th>
                  <th>Supplier</th>
                </tr>
              </thead>
              <tbody>
                {bunkerLogs.map(b => (
                  <tr key={b.id}>
                    <td>{b.date}</td>
                    <td style={{ fontWeight: 600 }}>{b.fuelType}</td>
                    <td>{b.qty}</td>
                    <td>{b.viscosity}</td>
                    <td><span className="badge badge-warning" style={{ background: '#fef3c7', color: '#b45309' }}>{b.sulfur}</span></td>
                    <td>{b.supplier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CARGO RECORD BOOK TAB ── */}
      {tab === 'cargo' && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📦 Cargo Transfer & Discharge Log
          </h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Operation</th>
                  <th>Cargo Type</th>
                  <th>Quantity Transfered</th>
                  <th>Average Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {cargoLogs.map(c => (
                  <tr key={c.id}>
                    <td>{c.date}</td>
                    <td><span className={`badge ${c.operation === 'Loading' ? 'badge-processing' : 'badge-dispatched'}`}>{c.operation}</span></td>
                    <td style={{ fontWeight: 600 }}>{c.cargoType}</td>
                    <td>{c.qty}</td>
                    <td>{c.rate}</td>
                    <td><span className="badge badge-delivered">{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CONSUMPTION LOG TAB ── */}
      {tab === 'consumption' && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>📉 Vessel Fuel & Power Consumption</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Main Engine Average Fuel Load</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#3b82f6' }}>22.4 MT / Day</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Generators (Aux Engine) Load</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>2.1 MT / Day</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Total daily CO2 emissions (est)</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444' }}>76.8 Tons</div>
            </div>
          </div>
          {/* Simple Visual Bar Chart */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, marginBottom: '14px', fontSize: '14px' }}>Hourly Fuel Feed Rate (Ltrs/hr)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { time: '00:00 - 04:00', val: 780, max: 1000 },
                { time: '04:00 - 08:00', val: 820, max: 1000 },
                { time: '08:00 - 12:00', val: 940, max: 1000 },
                { time: '12:00 - 16:00', val: 910, max: 1000 },
                { time: '16:00 - 20:00', val: 860, max: 1000 },
              ].map(h => (
                <div key={h.time} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                  <span style={{ width: '100px', color: '#64748b' }}>{h.time}</span>
                  <div style={{ flex: 1, height: '14px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#3b82f6', width: `${(h.val / h.max) * 100}%` }} />
                  </div>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{h.val} L/hr</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DECK LOG BOOK TAB ── */}
      {tab === 'deck' && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>📝 Navigational Deck Log Book</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time / Watch</th>
                  <th>Officer on Watch</th>
                  <th>Compass Heading</th>
                  <th>Wind & Sea State</th>
                  <th>Remarks / Operational Notes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { time: '00:00 - 04:00', officer: 'Second Mate', heading: '045°', weather: 'NW Force 3 / Smooth Sea', remarks: 'Vessel on autopilot. Navigational lights checked. Position logged hourly.' },
                  { time: '04:00 - 08:00', officer: 'Chief Mate', heading: '045°', weather: 'W Force 2 / Ripple Sea', remarks: 'Lookout posted. Handover watch. Completed daily safety checklist.' },
                  { time: '08:00 - 12:00', officer: 'Third Mate', heading: '048°', weather: 'Calm / Mirror Sea', remarks: 'Vessel trimmed. Hand steering tests completed. Fire drill completed.' }
                ].map((l, i) => (
                  <tr key={i}>
                    <td>{l.time}</td>
                    <td style={{ fontWeight: 600 }}>{l.officer}</td>
                    <td>{l.heading}</td>
                    <td>{l.weather}</td>
                    <td style={{ fontSize: '12.5px', color: '#475569' }}>{l.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ENGINE LOG BOOK TAB ── */}
      {tab === 'engine' && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>⚙️ Engine Machinery Parameters Log</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Standard Value</th>
                  <th>Current Reading</th>
                  <th>Engine Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { p: 'Main Engine RPM', std: '78 - 84 RPM', cur: '82 RPM', s: 'Normal' },
                  { p: 'Jacket Cooling Water Inlet Temp', std: '68 - 72 °C', cur: '70.5 °C', s: 'Normal' },
                  { p: 'Lube Oil Pump Outlet Pressure', std: '3.2 - 3.8 bar', cur: '3.45 bar', s: 'Normal' },
                  { p: 'Turbocharger RPM', std: '11,200 RPM', cur: '11,450 RPM', s: 'Normal' },
                  { p: 'Scavenge Air Temperature', std: '40 - 45 °C', cur: '42.1 °C', s: 'Normal' }
                ].map((l, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{l.p}</td>
                    <td>{l.std}</td>
                    <td style={{ color: '#3b82f6', fontWeight: 700 }}>{l.cur}</td>
                    <td><span className="badge badge-delivered">{l.s}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Action Buttons in bottom-right corner */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 100 }}>
        {/* Chat / Message Button */}
        <button style={{
          width: '54px', height: '54px', borderRadius: '50%',
          background: '#ef4444', color: 'white', border: 'none',
          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', cursor: 'pointer', transition: 'transform 0.2s',
        }} onClick={() => toast.success('Ship messaging channel is active 📡')}
           className="btn-hover-bounce">
          💬
        </button>

        {/* Plus Button */}
        <button style={{
          width: '54px', height: '54px', borderRadius: '50%',
          background: '#ef4444', color: 'white', border: 'none',
          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', cursor: 'pointer', transition: 'transform 0.2s',
        }} onClick={() => {
          if (firstActive) { setStatusShipment(firstActive); }
          else { toast.error('No active voyage to update'); }
        }}
           className="btn-hover-bounce">
          +
        </button>
      </div>

      {/* Modals */}
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

// Extra inline SVG mockup icons for simplicity & premium design
function MdFlagStyle() {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"></path>
    </svg>
  );
}
