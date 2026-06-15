import { useState, useRef, useEffect } from 'react';
import { shipmentAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { MdClose, MdLocationOn } from 'react-icons/md';

const STATUS_FLOW = {
  created: ['processing', 'cancelled'],
  processing: ['dispatched', 'cancelled'],
  dispatched: ['picked_up', 'failed'],
  picked_up: ['in_transit', 'failed'],
  in_transit: ['out_for_delivery', 'failed'],
  out_for_delivery: ['delivered', 'failed'],
  delivered: [],
  failed: ['returned'],
  returned: [],
  cancelled: [],
};

export default function StatusUpdateModal({ shipment, onClose, onSuccess }) {
  const [status, setStatus] = useState('');
  const [location, setLocation] = useState(shipment.currentLocation || '');
  const [description, setDescription] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [loading, setLoading] = useState(false);

  // Canvas drawing ref & state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const nextStatuses = STATUS_FLOW[shipment.status] || [];

  // Setup drawing context
  useEffect(() => {
    if (status === 'delivered' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#0f172a'; // Navy color stroke
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [status]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Support mouse & touch events
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = async () => {
    if (!status) return toast.error('Please select a status');
    if (status === 'delivered' && !receivedBy.trim()) {
      return toast.error('Please fill in the receiver name');
    }
    
    setLoading(true);
    try {
      let signatureData = '';
      if (status === 'delivered' && canvasRef.current) {
        signatureData = canvasRef.current.toDataURL(); // extract signature as base64 string
      }

      await shipmentAPI.updateStatus(shipment._id, {
        status,
        location,
        description: description + (signatureData ? ' [Recipient Signed]' : ''),
        receivedBy
      });
      toast.success(`Status updated to ${status.replace(/_/g,' ')} ✅`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const statusDescriptions = {
    processing: 'Shipment is being processed in warehouse',
    dispatched: 'Dispatched from warehouse',
    picked_up: 'Picked up by delivery personnel',
    in_transit: 'In transit to destination',
    out_for_delivery: 'Out for delivery to recipient',
    delivered: 'Successfully delivered to recipient',
    failed: 'Delivery attempt failed',
    returned: 'Shipment returned to sender',
    cancelled: 'Shipment cancelled',
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-sm">
        <div className="modal-header">
          <div>
            <div className="modal-title">🔄 Update Status</div>
            <div style={{ fontSize: '12px', color: 'var(--accent-primary)', marginTop: '2px', fontFamily: 'monospace' }}>
              {shipment.trackingId}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Current Status */}
          <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Current Status</div>
            <span className={`badge badge-${shipment.status}`}>{shipment.status?.replace(/_/g,' ').toUpperCase()}</span>
          </div>

          {nextStatuses.length === 0 ? (
            <div className="alert alert-info">This shipment has reached its final status and cannot be updated further.</div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">New Status <span className="required">*</span></label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {nextStatuses.map(s => (
                    <label key={s} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px',
                      background: status === s ? 'var(--accent-primary-glow)' : 'var(--bg-input)',
                      border: `1px solid ${status === s ? 'var(--accent-primary)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      <input type="radio" name="status" value={s} checked={status === s} onChange={() => { setStatus(s); setDescription(statusDescriptions[s] || ''); }} style={{ display: 'none' }} />
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%',
                        border: `2px solid ${status === s ? 'var(--accent-primary)' : 'var(--text-muted)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {status === s && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)' }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: status === s ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                          {s.replace(/_/g,' ').toUpperCase()}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{statusDescriptions[s]}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label"><MdLocationOn size={14} /> Current Location</label>
                <input className="form-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Mumbai Hub" />
              </div>

              <div className="form-group">
                <label className="form-label">Status Description</label>
                <textarea className="form-textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="Add details about this status update..." style={{ minHeight: '70px' }} />
              </div>

              {status === 'delivered' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Received By <span className="required">*</span></label>
                    <input className="form-input" value={receivedBy} onChange={e => setReceivedBy(e.target.value)} placeholder="Name of person who received the package" required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Drawing Signature Proof <span className="required">*</span></label>
                    <div style={{ border: '2px solid var(--border)', borderRadius: '12px', background: '#f8fafc', overflow: 'hidden' }}>
                      <canvas
                        ref={canvasRef}
                        width={300}
                        height={120}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        style={{ display: 'block', width: '100%', height: '120px', cursor: 'crosshair', touchAction: 'none' }}
                      />
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={clearCanvas} style={{ marginTop: '8px', width: '100%' }}>
                      🧹 Clear Drawing Signature
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {nextStatuses.length > 0 && (
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !status}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Updating...</> : 'Update Status'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
