import { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { shipmentAPI } from '../../services/api';
import { MdUpdate, MdVisibility, MdRefresh, MdQrCodeScanner, MdChat, MdSend, MdClose } from 'react-icons/md';
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

  // Scanner Simulator states
  const [showScanner, setShowScanner] = useState(false);
  const [scanTrackingId, setScanTrackingId] = useState('');
  const [scannedResult, setScannedResult] = useState(null);

  // Chatbot support states
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'dispatcher', text: 'Hello! This is central dispatch support. Need help with your active routes?' }
  ]);

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

  // Web Audio API Warehouse Scanner Beep Sound
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, ctx.currentTime); // Crisp scanner beep
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.log('AudioContext blocked/not supported');
    }
  };

  const handleSimulateScan = async (e) => {
    e.preventDefault();
    if (!scanTrackingId) return toast.error('Please select a shipment to scan');
    
    playBeep();
    toast.loading('Processing scanned barcode payload...');
    
    // Find selected shipment
    const target = shipments.find(s => s.trackingId === scanTrackingId);
    if (!target) {
      toast.dismiss();
      return toast.error('Scanned package not found in assigned queue');
    }

    const nextStatuses = STATUS_FLOW[target.status] || [];
    if (nextStatuses.length === 0) {
      toast.dismiss();
      return toast.error('Scanned package has already reached a final delivery state');
    }

    const nextStatus = nextStatuses[0]; // pick first logical next step
    
    setTimeout(async () => {
      try {
        await shipmentAPI.updateStatus(target._id, {
          status: nextStatus,
          location: 'Regional Hub Terminal',
          description: `Package barcode scanned by courier ${target.assignedTo?.name || ''}`
        });
        toast.dismiss();
        toast.success(`Scanned! Status progressed to ${nextStatus.replace(/_/g, ' ')}`);
        setShowScanner(false);
        setScanTrackingId('');
        fetchDeliveries();
      } catch (err) {
        toast.dismiss();
        toast.error('Scan sync failed.');
      }
    }, 1500);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = { sender: 'courier', text: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');

    setTimeout(() => {
      let reply = "Copy that. Please proceed according to safety protocols. Contact recipient if address is locked.";
      const lowercaseInput = chatInput.toLowerCase();
      if (lowercaseInput.includes('delay') || lowercaseInput.includes('traffic')) {
        reply = "Noted. Traffic delay registered in dispatch center. Take the alternate freeway.";
      } else if (lowercaseInput.includes('not home') || lowercaseInput.includes('door')) {
        reply = "Try calling the recipient's registered number. If unreachable, mark status as 'failed - attempt 1'.";
      } else if (lowercaseInput.includes('signature') || lowercaseInput.includes('sign')) {
        reply = "Yes, please ask the customer to draw their signature on your canvas pad to complete delivery.";
      }
      setMessages(prev => [...prev, { sender: 'dispatcher', text: reply }]);
    }, 1200);
  };

  return (
    <AppLayout title="My Deliveries" subtitle="All deliveries assigned to you">
      
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Deliveries</h1>
          <p>{shipments.length} active delivery operations assigned</p>
        </div>
        <div className="page-header-right" style={{ gap: '12px' }}>
          
          {/* Barcode scanner action trigger */}
          <button className="btn btn-primary" onClick={() => setShowScanner(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdQrCodeScanner /> Scan Package
          </button>

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

      {/* ── Deliveries List ── */}
      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : shipments.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-title">All clear! No shipments assigned</div>
            <div className="empty-text">Check back later when dispatcher assigns new deliveries.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {shipments.map(s => {
            const nextStatuses = STATUS_FLOW[s.status] || [];
            const isComplete = s.status === 'delivered';
            const isFailed = s.status === 'failed';

            return (
              <div key={s._id} className="card" style={{
                border: isComplete ? '1.5px solid rgba(22,163,74,0.3)' : isFailed ? '1.5px solid rgba(220,38,38,0.3)' : '1px solid var(--border)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 800, fontFamily: 'monospace', fontSize: '15px' }}>
                      {s.trackingId}
                    </span>
                    <span className={`badge badge-${s.status}`}>{s.status?.replace(/_/g,' ')}</span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Est: {s.estimatedDelivery ? format(new Date(s.estimatedDelivery), 'dd MMM yyyy') : 'N/A'}
                  </div>
                </div>

                <div className="form-grid-3" style={{ marginBottom: '16px', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '4px' }}>
                      📍 Origin Entity
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.senderName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.senderAddress}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.senderCity}, {s.senderState}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '4px' }}>
                      🎯 Delivery Destination
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.receiverName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.receiverAddress}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.receiverCity}, {s.receiverState}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '4px' }}>
                      📦 Dimensions & Info
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {s.packageType?.toUpperCase()} • {s.weight} kg
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Size: {s.dimensions?.length}×{s.dimensions?.width}×{s.dimensions?.height} cm
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--accent-red)', fontWeight: 600, marginTop: '2px' }}>
                      Priority: {s.priority?.toUpperCase()}
                    </div>
                  </div>
                </div>

                {s.specialInstructions && (
                  <div style={{ fontSize: '12px', color: 'var(--warning)', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', padding: '8px 12px', borderRadius: '8px', marginBottom: '16px' }}>
                    ⚠️ Instructions: {s.specialInstructions}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {nextStatuses.length > 0 && (
                    <button className="btn btn-primary btn-sm" onClick={() => setStatusShipment(s)}>
                      🔄 Update status
                    </button>
                  )}
                  <button className="btn btn-secondary btn-sm" onClick={() => setSelectedShipment(s)}>
                    👁️ View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SCANNER SIMULATOR MODAL ── */}
      {showScanner && (
        <div className="modal-overlay" style={{ zIndex: 300 }}>
          <div className="modal modal-sm" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="modal-title" style={{ color: '#ffffff' }}>📷 Laser Barcode Scanner Simulator</div>
              <button className="modal-close" onClick={() => setShowScanner(false)} style={{ color: '#ffffff' }}><MdClose /></button>
            </div>
            <form onSubmit={handleSimulateScan} className="modal-body" style={{ padding: '24px' }}>
              
              {/* Simulated Camera Viewfinder */}
              <div style={{
                height: '160px',
                background: '#020617',
                borderRadius: '12px',
                border: '2px solid #8b5cf6',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <div style={{
                  position: 'absolute', width: '80%', height: '2px', background: '#dc2626',
                  top: '50%', left: '10%', boxShadow: '0 0 10px #dc2626',
                  animation: 'shimmer 2s infinite ease-in-out'
                }} className="scanner-beam" />
                <div style={{ fontSize: '32px', opacity: 0.25 }}>📷 Camera viewfinder</div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Select Package to Scan</label>
                <select
                  className="form-select"
                  value={scanTrackingId}
                  onChange={e => setScanTrackingId(e.target.value)}
                  style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }}
                  required
                >
                  <option value="">-- Choose Assigned Package --</option>
                  {shipments.filter(s => (STATUS_FLOW[s.status] || []).length > 0).map(s => (
                    <option key={s._id} value={s.trackingId}>
                      {s.trackingId} ({s.status?.replace(/_/g,' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowScanner(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', color: '#ffffff', border: 'none' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#8b5cf6' }}>
                  🎯 Simulate Scan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── COURIER LIVE SUPPORT CHATBOT ── */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 200 }}>
        {/* Floating Chat Bubble Toggle */}
        {!showChat && (
          <button
            onClick={() => setShowChat(true)}
            style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #e8380d, #f59e0b)',
              color: '#ffffff', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(232, 56, 13, 0.45)',
              transition: 'transform 0.25s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <MdChat size={26} />
          </button>
        )}

        {/* Chat Window */}
        {showChat && (
          <div style={{
            width: '320px', height: '400px',
            background: '#ffffff', border: '1px solid var(--border)',
            borderRadius: '16px', boxShadow: 'var(--shadow-lg)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #e8380d, #f59e0b)',
              color: '#ffffff', padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                <span style={{ fontWeight: 700, fontSize: '13px' }}>Dispatch Central Support</span>
              </div>
              <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
                <MdClose size={18} />
              </button>
            </div>

            {/* Message Pane */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.map((m, idx) => (
                <div key={idx} style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: '12px', fontSize: '12.5px',
                  alignSelf: m.sender === 'courier' ? 'flex-end' : 'flex-start',
                  background: m.sender === 'courier' ? 'var(--accent-red)' : '#f1f5f9',
                  color: m.sender === 'courier' ? '#ffffff' : 'var(--text-primary)'
                }}>
                  {m.text}
                </div>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChat} style={{ borderTop: '1px solid var(--border)', padding: '10px 12px', display: 'flex', gap: '8px' }}>
              <input
                className="form-input"
                placeholder="Ask dispatch dispatcher..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                style={{ height: '36px', fontSize: '12.5px', marginBottom: 0 }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 12px', background: 'var(--accent-red)' }}>
                <MdSend size={16} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Modals */}
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
