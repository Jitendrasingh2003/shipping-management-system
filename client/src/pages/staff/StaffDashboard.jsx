import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import {
  dashboardAPI, deckLogAPI, voyageAPI, alarmAPI, odsAPI,
  ballastAPI, bunkerAPI, cargoAPI, consumptionAPI, engineLogAPI
} from '../../services/api';
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

export default function StaffDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'dashboard';

  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  // DB Logbooks States
  const [deckLogs, setDeckLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [alarms, setAlarms] = useState([]);
  const [odsEntries, setOdsEntries] = useState([]);
  const [ballastLogs, setBallastLogs] = useState([]);
  const [bunkerLogs, setBunkerLogs] = useState([]);
  const [cargoLogs, setCargoLogs] = useState([]);
  const [consumptionLogs, setConsumptionLogs] = useState([]);
  const [engineLogs, setEngineLogs] = useState([]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.getStats();
      setStats(res.data.stats);
    } catch { toast.error('Failed to load stats'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const ship = stats?.ship || null;
  const crew = stats?.crew || null;
  const currentVoyage = stats?.currentVoyage || null;

  const loadDeckLogs = async () => {
    if (!ship) return;
    setLoadingLogs(true);
    try {
      const r = await deckLogAPI.getAll();
      setDeckLogs(r.data.logs || []);
    } catch {
      toast.error('Failed to load deck logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadAllLogbooks = async () => {
    if (!ship) return;
    alarmAPI.getAll().then(r => setAlarms(r.data.alarms || [])).catch(() => {});
    odsAPI.getAll().then(r => setOdsEntries(r.data.logs || [])).catch(() => {});
    ballastAPI.getAll().then(r => setBallastLogs(r.data.logs || [])).catch(() => {});
    bunkerAPI.getAll().then(r => setBunkerLogs(r.data.logs || [])).catch(() => {});
    cargoAPI.getAll().then(r => setCargoLogs(r.data.logs || [])).catch(() => {});
    consumptionAPI.getAll().then(r => setConsumptionLogs(r.data.logs || [])).catch(() => {});
    engineLogAPI.getAll().then(r => setEngineLogs(r.data.logs || [])).catch(() => {});
  };

  useEffect(() => {
    if (ship) {
      loadDeckLogs();
      loadAllLogbooks();
    }
  }, [ship]);

  const today = format(new Date(), 'dd MMM yyyy');
  const greeting = 'Welcome back';

  const handleUpdateVoyageStatus = async (status) => {
    if (!currentVoyage) return;
    try {
      await voyageAPI.update(currentVoyage._id, { voyageStatus: status });
      toast.success('Voyage status updated to ' + status);
      fetchStats();
    } catch {
      toast.error('Failed to update voyage status');
    }
  };

  const handleTriggerAlarm = async (e) => {
    e.preventDefault();
    if (!ship) return toast.error('No ship assigned');
    const data = new FormData(e.target);
    const formVal = {
      shipId: ship._id,
      category: data.get('category'),
      title: data.get('title'),
      severity: data.get('severity'),
      status: 'Active',
      time: format(new Date(), 'HH:mm')
    };
    try {
      await alarmAPI.create(formVal);
      toast.success('Alarm triggered! 🚨');
      alarmAPI.getAll().then(r => setAlarms(r.data.alarms || [])).catch(() => {});
      e.target.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to trigger alarm');
    }
  };

  const handleAcknowledgeAlarm = async (alarmId) => {
    try {
      await alarmAPI.update(alarmId, { status: 'Resolved' });
      toast.success('Alarm acknowledged!');
      alarmAPI.getAll().then(r => setAlarms(r.data.alarms || [])).catch(() => {});
    } catch {
      toast.error('Failed to acknowledge alarm');
    }
  };

  const handleAddOds = async (e) => {
    e.preventDefault();
    if (!ship) return toast.error('No ship assigned');
    const data = new FormData(e.target);
    const formVal = {
      shipId: ship._id,
      logDate: data.get('date') || new Date().toISOString().slice(0, 10),
      system: data.get('system'),
      gasType: data.get('gasType'),
      qty: data.get('qty') + ' kg',
      operation: data.get('operation'),
      loggedBy: user?.name || 'Chief Officer'
    };
    try {
      await odsAPI.create(formVal);
      toast.success('ODS Record entry logged! 📋');
      odsAPI.getAll().then(r => setOdsEntries(r.data.logs || [])).catch(() => {});
      e.target.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add ODS entry');
    }
  };

  const handleAddBallast = async (e) => {
    e.preventDefault();
    if (!ship) return toast.error('No ship assigned');
    const data = new FormData(e.target);
    const formVal = {
      shipId: ship._id,
      logDate: data.get('date') || new Date().toISOString().slice(0, 10),
      tank: data.get('tank'),
      volume: data.get('volume') + ' m³',
      salinity: data.get('salinity') + ' PSU',
      status: data.get('status'),
      location: data.get('location')
    };
    try {
      await ballastAPI.create(formVal);
      toast.success('Ballast Water operation logged! 🌊');
      ballastAPI.getAll().then(r => setBallastLogs(r.data.logs || [])).catch(() => {});
      e.target.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add ballast log');
    }
  };

  const handleAddBunker = async (e) => {
    e.preventDefault();
    if (!ship) return toast.error('No ship assigned');
    const data = new FormData(e.target);
    const formVal = {
      shipId: ship._id,
      logDate: data.get('date') || new Date().toISOString().slice(0, 10),
      fuelType: data.get('fuelType'),
      qty: data.get('qty') + ' MT',
      viscosity: data.get('viscosity') + ' cSt',
      sulfur: data.get('sulfur') + '%',
      supplier: data.get('supplier')
    };
    try {
      await bunkerAPI.create(formVal);
      toast.success('Bunkering operation logged! ⛽');
      bunkerAPI.getAll().then(r => setBunkerLogs(r.data.logs || [])).catch(() => {});
      e.target.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add bunker log');
    }
  };

  const handleAddCargo = async (e) => {
    e.preventDefault();
    if (!ship) return toast.error('No ship assigned');
    const data = new FormData(e.target);
    const formVal = {
      shipId: ship._id,
      logDate: data.get('date') || new Date().toISOString().slice(0, 10),
      operation: data.get('operation'),
      cargoType: data.get('cargoType'),
      qty: data.get('qty') + ' MT',
      rate: data.get('rate') + ' MT/hr',
      status: 'Completed'
    };
    try {
      await cargoAPI.create(formVal);
      toast.success('Cargo operation logged! 📦');
      cargoAPI.getAll().then(r => setCargoLogs(r.data.logs || [])).catch(() => {});
      e.target.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add cargo log');
    }
  };

  const handleAddConsumption = async (e) => {
    e.preventDefault();
    if (!ship) return toast.error('No ship assigned');
    const data = new FormData(e.target);
    const formVal = {
      shipId: ship._id,
      logDate: data.get('date') || new Date().toISOString().slice(0, 10),
      mainEngineFuel: data.get('mainEngineFuel') + ' MT/day',
      auxEngineFuel: data.get('auxEngineFuel') + ' MT/day',
      co2Emissions: data.get('co2Emissions') + ' Tons'
    };
    try {
      await consumptionAPI.create(formVal);
      toast.success('Fuel consumption logged! 📉');
      consumptionAPI.getAll().then(r => setConsumptionLogs(r.data.logs || [])).catch(() => {});
      e.target.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add consumption log');
    }
  };

  const handleAddEngineLog = async (e) => {
    e.preventDefault();
    if (!ship) return toast.error('No ship assigned');
    const data = new FormData(e.target);
    const formVal = {
      shipId: ship._id,
      logDate: data.get('date') || new Date().toISOString().slice(0, 10),
      rpm: data.get('rpm') + ' RPM',
      jacketTemp: data.get('jacketTemp') + ' °C',
      lubePressure: data.get('lubePressure') + ' bar',
      turboRpm: data.get('turboRpm') + ' RPM',
      scavengeTemp: data.get('scavengeTemp') + ' °C'
    };
    try {
      await engineLogAPI.create(formVal);
      toast.success('Engine machinery parameters logged! ⚙️');
      engineLogAPI.getAll().then(r => setEngineLogs(r.data.logs || [])).catch(() => {});
      e.target.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add engine parameters log');
    }
  };

  const handleAddDeckLog = async (e) => {
    e.preventDefault();
    if (!ship) return toast.error('No ship assigned to log entries');
    const data = new FormData(e.target);
    const formVal = {
      shipId: ship._id,
      logDate: data.get('logDate') || new Date().toISOString().slice(0, 10),
      latitude: data.get('latitude'),
      longitude: data.get('longitude'),
      speed: Number(data.get('speed') || 0),
      course: data.get('course'),
      weather: data.get('weather'),
      remarks: data.get('remarks'),
    };
    try {
      await deckLogAPI.create(formVal);
      toast.success('Deck Log entry logged! 📋');
      loadDeckLogs();
      e.target.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add log entry');
    }
  };

  if (loading) return (
    <AppLayout title="Staff Dashboard" subtitle="Redesigning Overview">
      <div className="loading-container"><div className="spinner" /></div>
    </AppLayout>
  );

  const voyageStages = ['DEPARTURE', 'IN TRANSIT', 'ARRIVAL'];
  let currentStageIndex = 0;
  if (currentVoyage) {
    if (currentVoyage.voyageStatus === 'Running') {
      currentStageIndex = 1;
    } else if (currentVoyage.voyageStatus === 'Completed') {
      currentStageIndex = 2;
    }
  }

  const progressPercent = (currentStageIndex / 2) * 100;

  return (
    <AppLayout title="Staff Dashboard" subtitle="Marine vessel operations overview">
      
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #061124 100%)',
        borderRadius: '16px',
        padding: '24px 32px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        borderLeft: '5px solid #ef4444'
      }}>
        <div>
          <h2 style={{
            fontSize: '24px', fontWeight: 800, color: '#ffffff',
            marginBottom: '4px', letterSpacing: '-0.5px',
            fontFamily: 'system-ui, sans-serif'
          }}>
            👋 {greeting}, {user?.name || 'Vessel Crew'}
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, fontWeight: 500 }}>
            Here's your ship operations overview for today
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            background: '#ef4444', color: 'white',
            padding: '6px 16px', borderRadius: '20px',
            fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px',
          }}>
            {crew?.designation || 'OPERATIONS'}
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            color: '#ffffff', border: '1px solid rgba(255,255,255,0.12)',
            padding: '6px 14px', borderRadius: '10px',
            fontWeight: 600, fontSize: '12.5px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <MdCalendarToday size={14} style={{ color: '#ef4444' }} /> {today}
          </div>
        </div>
      </div>

      {tab === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '28px' }}>
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
                  VOYAGE NO. {currentVoyage?.voyageNo || 'NO ACTIVE VOYAGE'}
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0',
                padding: '6px 14px', borderRadius: '30px', fontSize: '12px', fontWeight: 600,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}/>
                Online Sync Active
              </div>
            </div>

            <div style={{ position: 'relative', padding: '0 20px', marginBottom: '40px' }}>
              <div style={{ height: '4px', background: '#e2e8f0', width: '100%', borderRadius: '4px', position: 'absolute', top: '24px', left: 0, right: 0 }} />
              <div style={{
                height: '4px',
                background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                width: `${progressPercent}%`,
                borderRadius: '4px',
                position: 'absolute', top: '24px', left: 0,
                transition: 'width 0.4s ease'
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                {voyageStages.map((stage, i) => {
                  const isActive = i <= currentStageIndex;
                  const isCurrent = i === currentStageIndex;
                  return (
                    <div key={stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{ height: '24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                        {isCurrent && (
                          <span style={{ fontSize: '20px', transformOrigin: 'bottom' }}>📍</span>
                        )}
                      </div>
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%',
                        background: isCurrent ? '#ffffff' : isActive ? '#3b82f6' : '#e2e8f0',
                        border: isCurrent ? '5px solid #ef4444' : isActive ? 'none' : '3px solid #cbd5e1',
                        boxShadow: isCurrent ? '0 0 0 4px rgba(239, 68, 68, 0.2)' : 'none',
                        margin: '6px 0 10px',
                        transition: 'all 0.3s'
                      }} />
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: 'auto' }}>
              <div style={{
                borderTop: '3px solid #ef4444',
                paddingTop: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>🚢 Voyage No</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{currentVoyage?.voyageNo || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Route</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>
                    {currentVoyage ? `${currentVoyage.departurePort || '—'} → ${currentVoyage.arrivalPort || '—'}` : 'No active voyage'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Status</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>
                    {currentVoyage ? `${currentVoyage.voyageStatus} / ${currentVoyage.voyageType?.toUpperCase()}` : 'N/A'}
                  </span>
                </div>
              </div>

              <div style={{
                borderTop: '3px solid #3b82f6',
                paddingTop: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>📍 Departure</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{currentVoyage?.departurePort || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>📍 Arrival</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{currentVoyage?.arrivalPort || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Created</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{currentVoyage ? format(new Date(currentVoyage.createdAt), 'dd-MM-yyyy') : '—'}</span>
                </div>
              </div>
            </div>

            {currentVoyage && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>Change Status:</span>
                {['Planned', 'Running', 'Completed'].map(status => (
                  <button
                    key={status}
                    className={`btn btn-sm`}
                    style={{
                      background: currentVoyage.voyageStatus === status ? '#ef4444' : 'white',
                      color: currentVoyage.voyageStatus === status ? 'white' : '#475569',
                      border: '1px solid #cbd5e1',
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleUpdateVoyageStatus(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>

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
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{ship?.name || 'No Ship'}</h3>
              </div>
            </div>

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
              <div style={{ position: 'absolute', width: '220px', height: '220px', borderRadius: '50%', border: '1px solid rgba(16, 185, 129, 0.15)' }} />
              <div style={{ position: 'absolute', width: '150px', height: '150px', borderRadius: '50%', border: '1px solid rgba(16, 185, 129, 0.25)' }} />
              <div style={{ position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', border: '1px solid rgba(16, 185, 129, 0.35)' }} />
              
              <div className="radar-sweep" style={{
                position: 'absolute', width: '100%', height: '100%',
                background: 'conic-gradient(from 0deg at 50% 50%, rgba(16, 185, 129, 0.15) 0deg, transparent 90deg)',
                animation: 'spin 4s linear infinite',
                transformOrigin: 'center'
              }} />

              <div style={{
                position: 'absolute', top: '45%', left: '55%',
                width: '10px', height: '10px', borderRadius: '50%',
                background: '#ef4444', boxShadow: '0 0 10px #ef4444',
              }} />

              <div style={{
                position: 'absolute', bottom: '8px', left: '12px',
                fontSize: '9px', fontFamily: 'monospace', color: '#10b981',
                textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600
              }}>
                🛰️ Live GPS Tracking
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

      {tab === 'alarm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🚨 Trigger / Report Vessel Alarm
            </h3>
            <form onSubmit={handleTriggerAlarm} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Alarm Category</label>
                <input className="form-input" name="category" placeholder="e.g. Navigation, Machinery" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Alarm Title / Description</label>
                <input className="form-input" name="title" placeholder="e.g. Jacket cooling water high temp" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Severity Level</label>
                <select className="form-select" name="severity">
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <button className="btn btn-primary" style={{ height: '42px', background: '#dc2626', border: 'none' }} type="submit"><MdAdd /> Trigger Alarm</button>
            </form>
          </div>

          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🚨 Active & Logged Alarms
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alarms.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  No active alarms reported.
                </div>
              ) : alarms.map(a => (
                <div key={a._id} style={{
                  border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: a.status === 'Active' ? '#fff5f5' : '#f8fafc',
                  borderLeft: `5px solid ${a.severity === 'urgent' || a.severity === 'high' ? '#dc2626' : a.severity === 'warning' ? '#f59e0b' : '#3b82f6'}`
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                        background: a.status === 'Active' ? '#fee2e2' : '#cbd5e1',
                        color: a.status === 'Active' ? '#dc2626' : '#475569'
                      }}>{a.status.toUpperCase()}</span>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                        {a.category} • {a.createdAt ? format(new Date(a.createdAt), 'dd-MM-yyyy HH:mm') : a.time}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14.5px' }}>{a.title}</div>
                  </div>
                  {a.status === 'Active' && (
                    <button className="btn btn-secondary btn-sm" style={{ background: 'white' }} onClick={() => handleAcknowledgeAlarm(a._id)}>Acknowledge</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'ods' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
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
                {odsEntries.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No ODS logs yet</td></tr>
                ) : odsEntries.map((e, idx) => (
                  <tr key={e._id || idx}>
                    <td>{e.logDate ? e.logDate.slice(0, 10) : '—'}</td>
                    <td style={{ fontWeight: 600 }}>{e.system}</td>
                    <td><span className="badge badge-processing">{e.gasType}</span></td>
                    <td>{e.qty}</td>
                    <td>{e.operation}</td>
                    <td>{e.loggedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                {ballastLogs.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No ballast water logs yet</td></tr>
                ) : ballastLogs.map((l, idx) => (
                  <tr key={l._id || idx}>
                    <td>{l.logDate ? l.logDate.slice(0, 10) : '—'}</td>
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

      {tab === 'bunker' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⛽ Log Bunker Fuel Operation
            </h3>
            <form onSubmit={handleAddBunker} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date</label>
                <input className="form-input" type="date" name="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Fuel Grade / Type</label>
                <input className="form-input" name="fuelType" placeholder="e.g. VLSFO 0.5%" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Quantity Loaded (MT)</label>
                <input className="form-input" type="number" step="0.1" name="qty" placeholder="e.g. 350" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Viscosity (cSt)</label>
                <input className="form-input" type="number" step="0.1" name="viscosity" placeholder="e.g. 380" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Sulfur Content (%)</label>
                <input className="form-input" type="number" step="0.01" name="sulfur" placeholder="e.g. 0.49" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Supplier Name</label>
                <input className="form-input" name="supplier" placeholder="e.g. Shell Marine" required />
              </div>
              <button className="btn btn-primary" style={{ height: '42px', background: '#3b82f6', border: 'none' }} type="submit"><MdAdd /> Log Bunker</button>
            </form>
          </div>

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
                  {bunkerLogs.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No bunker logs yet</td></tr>
                  ) : bunkerLogs.map((b, idx) => (
                    <tr key={b._id || idx}>
                      <td>{b.logDate ? b.logDate.slice(0, 10) : '—'}</td>
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
        </div>
      )}

      {tab === 'cargo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📦 Log Cargo Transfer Operation
            </h3>
            <form onSubmit={handleAddCargo} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date</label>
                <input className="form-input" type="date" name="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Operation Type</label>
                <select className="form-select" name="operation">
                  <option value="Loading">Loading</option>
                  <option value="Discharging">Discharging</option>
                  <option value="Transfer">Internal Transfer</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cargo Type</label>
                <input className="form-input" name="cargoType" placeholder="e.g. Crude Oil" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Quantity</label>
                <input className="form-input" name="qty" placeholder="e.g. 15000 MT" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Average Rate</label>
                <input className="form-input" name="rate" placeholder="e.g. 1200 MT/hr" required />
              </div>
              <button className="btn btn-primary" style={{ height: '42px', background: '#3b82f6', border: 'none' }} type="submit"><MdAdd /> Log Cargo</button>
            </form>
          </div>

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
                  {cargoLogs.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No cargo logs yet</td></tr>
                  ) : cargoLogs.map((c, idx) => (
                    <tr key={c._id || idx}>
                      <td>{c.logDate ? c.logDate.slice(0, 10) : '—'}</td>
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
        </div>
      )}

      {tab === 'consumption' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✍️ Log Daily Fuel & Power Consumption
            </h3>
            <form onSubmit={handleAddConsumption} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date</label>
                <input className="form-input" type="date" name="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Main Engine Fuel (MT/day)</label>
                <input className="form-input" type="number" step="0.1" name="mainEngineFuel" placeholder="e.g. 24.5" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Aux Engine/Gen Fuel (MT/day)</label>
                <input className="form-input" type="number" step="0.1" name="auxEngineFuel" placeholder="e.g. 2.1" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">CO2 Emissions (Tons)</label>
                <input className="form-input" type="number" step="0.1" name="co2Emissions" placeholder="e.g. 78.2" required />
              </div>
              <button className="btn btn-primary" style={{ height: '42px', background: '#3b82f6', border: 'none' }} type="submit"><MdAdd /> Log Consumption</button>
            </form>
          </div>

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

            <div className="table-container" style={{ marginTop: '24px' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Consumption Logs History</div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Main Engine Fuel</th>
                    <th>Aux Engine Fuel</th>
                    <th>CO2 Emissions</th>
                  </tr>
                </thead>
                <tbody>
                  {consumptionLogs.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>No consumption logs yet</td></tr>
                  ) : consumptionLogs.map((l, idx) => (
                    <tr key={l._id || idx}>
                      <td>{l.logDate ? l.logDate.slice(0, 10) : '—'}</td>
                      <td style={{ fontWeight: 600 }}>{l.mainEngineFuel}</td>
                      <td>{l.auxEngineFuel}</td>
                      <td><span className="badge badge-warning" style={{ background: '#fee2e2', color: '#dc2626' }}>{l.co2Emissions}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'deck' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✍️ Log Navigational Deck Log Entry
            </h3>
            <form onSubmit={handleAddDeckLog} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Log Date</label>
                <input className="form-input" type="date" name="logDate" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Latitude</label>
                <input className="form-input" name="latitude" placeholder="e.g. 18.9750° N" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Longitude</label>
                <input className="form-input" name="longitude" placeholder="e.g. 72.8258° E" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Speed (knots)</label>
                <input className="form-input" type="number" step="0.1" name="speed" placeholder="e.g. 14.5" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Course</label>
                <input className="form-input" name="course" placeholder="e.g. 045°" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Weather</label>
                <input className="form-input" name="weather" placeholder="e.g. NW Force 3" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                <label className="form-label">Remarks</label>
                <input className="form-input" name="remarks" placeholder="Remarks / Operational Notes" />
              </div>
              <button className="btn btn-primary" style={{ height: '42px', background: '#ef4444', border: 'none', gridColumn: '1 / -1' }} type="submit">
                <MdAdd /> Log Entry
              </button>
            </form>
          </div>

          <div className="table-container">
            <div className="table-toolbar">
              <div style={{ fontWeight: 700, color: '#0f172a' }}>Navigational Deck Log Book Logs</div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Date</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Speed</th>
                  <th>Course</th>
                  <th>Weather</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {loadingLogs ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                ) : deckLogs.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>No deck logs logged yet</td></tr>
                ) : deckLogs.map((log, idx) => (
                  <tr key={log._id || idx}>
                    <td>{idx + 1}</td>
                    <td>{log.logDate ? log.logDate.slice(0, 10) : format(new Date(log.createdAt), 'yyyy-MM-dd')}</td>
                    <td style={{ fontWeight: 600 }}>{log.latitude}</td>
                    <td style={{ fontWeight: 600 }}>{log.longitude}</td>
                    <td>{log.speed} kts</td>
                    <td>{log.course}</td>
                    <td>{log.weather}</td>
                    <td style={{ fontSize: '12.5px', color: '#475569' }}>{log.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'engine' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚙️ Log Engine Machinery Parameters
            </h3>
            <form onSubmit={handleAddEngineLog} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date</label>
                <input className="form-input" type="date" name="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">RPM</label>
                <input className="form-input" type="number" name="rpm" placeholder="e.g. 80" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Jacket Temp (°C)</label>
                <input className="form-input" type="number" step="0.1" name="jacketTemp" placeholder="e.g. 70.5" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Lube Pressure (bar)</label>
                <input className="form-input" type="number" step="0.01" name="lubePressure" placeholder="e.g. 3.4" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Turbo RPM</label>
                <input className="form-input" type="number" name="turboRpm" placeholder="e.g. 11400" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Scavenge Temp (°C)</label>
                <input className="form-input" type="number" step="0.1" name="scavengeTemp" placeholder="e.g. 42" required />
              </div>
              <button className="btn btn-primary" style={{ height: '42px', background: '#3b82f6', border: 'none', gridColumn: 'span 2' }} type="submit"><MdAdd /> Log Parameters</button>
            </form>
          </div>

          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>⚙️ Engine Machinery Parameters Log</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>RPM</th>
                    <th>Jacket Temp</th>
                    <th>Lube Pressure</th>
                    <th>Turbo RPM</th>
                    <th>Scavenge Temp</th>
                  </tr>
                </thead>
                <tbody>
                  {engineLogs.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No engine logs yet</td></tr>
                  ) : engineLogs.map((l, idx) => (
                    <tr key={l._id || idx}>
                      <td>{l.logDate ? l.logDate.slice(0, 10) : '—'}</td>
                      <td style={{ fontWeight: 600 }}>{l.rpm}</td>
                      <td>{l.jacketTemp}</td>
                      <td>{l.lubePressure}</td>
                      <td>{l.turboRpm}</td>
                      <td>{l.scavengeTemp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
