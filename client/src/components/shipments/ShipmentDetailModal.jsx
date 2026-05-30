import { useState, useRef } from 'react';
import { shipmentAPI } from '../../services/api';
import { format } from 'date-fns';
import { MdClose, MdLocationOn, MdPhone, MdEmail } from 'react-icons/md';
import toast from 'react-hot-toast';
import StatusUpdateModal from './StatusUpdateModal';

export default function ShipmentDetailModal({ shipment, onClose, onRefresh, showProofUpload }) {
  const [tab, setTab] = useState('details');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [receivedBy, setReceivedBy] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const fileRef = useRef();

  const handleProofUpload = async () => {
    if (!proofFile && !receivedBy) return toast.error('Please select a file or enter receiver name');
    setUploadingProof(true);
    try {
      const formData = new FormData();
      if (proofFile) formData.append('proof', proofFile);
      formData.append('receivedBy', receivedBy);
      await shipmentAPI.uploadProof(shipment._id, formData);
      toast.success('Proof uploaded and shipment marked as delivered!');
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingProof(false);
    }
  };

  const statusColor = (s) => ({
    delivered: 'var(--success)', in_transit: 'var(--warning)', dispatched: 'var(--accent-secondary)',
    picked_up: 'var(--accent-cyan)', created: 'var(--text-muted)', processing: 'var(--info)',
    out_for_delivery: '#f97316', failed: 'var(--danger)',
  }[s] || 'var(--text-muted)');

  return (
    <>
      <div className="modal-overlay">
        <div className="modal modal-lg">
          <div className="modal-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="modal-title">📦 {shipment.trackingId}</div>
                <span className={`badge badge-${shipment.status}`}>{shipment.status?.replace(/_/g,' ')}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Created {format(new Date(shipment.createdAt), 'dd MMM yyyy, HH:mm')} by {shipment.createdByName}
              </div>
            </div>
            <button className="modal-close" onClick={onClose}><MdClose /></button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
            {['details', 'timeline', showProofUpload && 'proof'].filter(Boolean).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '10px 16px', border: 'none', background: 'none',
                color: tab === t ? 'var(--accent-primary)' : 'var(--text-muted)',
                borderBottom: tab === t ? '2px solid var(--accent-primary)' : '2px solid transparent',
                fontWeight: tab === t ? 600 : 400, cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit',
                textTransform: 'capitalize',
              }}>{t === 'proof' ? '📸 Proof of Delivery' : t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>

          <div className="modal-body">
            {/* DETAILS TAB */}
            {tab === 'details' && (
              <div>
                <div className="form-grid">
                  {/* Sender */}
                  <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                      📤 Sender
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{shipment.senderName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                      <MdEmail size={12} /> {shipment.senderEmail}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                      <MdPhone size={12} /> {shipment.senderPhone}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                      <MdLocationOn size={12} style={{ marginTop: '2px', flexShrink: 0 }} />
                      {shipment.senderAddress}, {shipment.senderCity}, {shipment.senderState} - {shipment.senderZip}
                    </div>
                  </div>

                  {/* Receiver */}
                  <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                      📥 Receiver
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{shipment.receiverName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                      <MdEmail size={12} /> {shipment.receiverEmail}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                      <MdPhone size={12} /> {shipment.receiverPhone}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                      <MdLocationOn size={12} style={{ marginTop: '2px', flexShrink: 0 }} />
                      {shipment.receiverAddress}, {shipment.receiverCity}, {shipment.receiverState} - {shipment.receiverZip}
                    </div>
                  </div>
                </div>

                {/* Package Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px' }}>
                  {[
                    { label: 'Package Type', value: shipment.packageType?.toUpperCase() },
                    { label: 'Weight', value: `${shipment.weight} kg` },
                    { label: 'Service', value: shipment.serviceType?.toUpperCase() },
                    { label: 'Priority', value: shipment.priority?.toUpperCase() },
                    { label: 'Shipping Cost', value: `₹${shipment.shippingCost}` },
                    { label: 'Declared Value', value: `₹${shipment.value || 0}` },
                    { label: 'Est. Delivery', value: shipment.estimatedDelivery ? format(new Date(shipment.estimatedDelivery), 'dd MMM yyyy') : 'N/A' },
                    { label: 'Current Location', value: shipment.currentLocation || 'N/A' },
                  ].map(item => (
                    <div key={item.label} style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.label}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Assignment */}
                <div style={{ marginTop: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>🚚 Assignment</div>
                  {shipment.assignedTo?.name ? (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--success), #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'white' }}>
                        {shipment.assignedTo.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{shipment.assignedTo.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{shipment.assignedTo.phone}</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--warning)', fontSize: '13px' }}>⚠️ Not yet assigned to any delivery personnel</div>
                  )}
                </div>

                {shipment.specialInstructions && (
                  <div style={{ marginTop: '12px', background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: '13px', color: 'var(--warning)' }}>
                    ⚠️ Special Instructions: {shipment.specialInstructions}
                  </div>
                )}
              </div>
            )}

            {/* TIMELINE TAB */}
            {tab === 'timeline' && (
              <div className="timeline">
                {shipment.statusHistory?.length === 0 ? (
                  <div className="empty-state"><div className="empty-title">No status history yet</div></div>
                ) : (
                  [...(shipment.statusHistory || [])].reverse().map((h, i) => (
                    <div key={i} className="timeline-item">
                      <div className={`timeline-dot ${h.status === 'delivered' ? 'delivered' : i === 0 ? 'active' : ''}`} />
                      <div className="timeline-content">
                        <div className="timeline-status">
                          <span className={`badge badge-${h.status}`}>{h.status?.replace(/_/g,' ')}</span>
                        </div>
                        {h.description && <div className="timeline-description">{h.description}</div>}
                        {h.location && (
                          <div className="timeline-location"><MdLocationOn size={12} /> {h.location}</div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <div className="timeline-time">🕒 {format(new Date(h.timestamp), 'dd MMM yyyy, HH:mm')}</div>
                          {h.updatedBy && <div className="timeline-time">👤 {h.updatedBy} ({h.updatedByRole})</div>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* PROOF TAB */}
            {tab === 'proof' && showProofUpload && (
              <div>
                {shipment.proofOfDelivery?.deliveredAt ? (
                  <div>
                    <div className="alert alert-success">✅ Proof of delivery already submitted</div>
                    <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Delivery Details</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        Received by: <strong>{shipment.proofOfDelivery?.receivedBy || 'N/A'}</strong>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Delivered at: {format(new Date(shipment.proofOfDelivery.deliveredAt), 'dd MMM yyyy, HH:mm')}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="alert alert-info">Upload proof of delivery to mark this shipment as delivered.</div>
                    <div className="form-group">
                      <label className="form-label">Received By Name <span className="required">*</span></label>
                      <input className="form-input" value={receivedBy} onChange={e => setReceivedBy(e.target.value)} placeholder="Name of person who received the package" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Proof Photo (Optional)</label>
                      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setProofFile(e.target.files[0])} />
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button className="btn btn-secondary" onClick={() => fileRef.current.click()}>
                          📸 {proofFile ? proofFile.name : 'Choose Photo'}
                        </button>
                        {proofFile && (
                          <span style={{ fontSize: '12px', color: 'var(--success)' }}>✅ {proofFile.name}</span>
                        )}
                      </div>
                    </div>
                    <button className="btn btn-success" style={{ width: '100%' }} onClick={handleProofUpload} disabled={uploadingProof || !receivedBy}>
                      {uploadingProof ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Uploading...</> : '✅ Submit Proof & Mark Delivered'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            {showProofUpload && tab !== 'proof' && shipment.status !== 'delivered' && (
              <button className="btn btn-secondary" onClick={() => setShowStatusModal(true)}>🔄 Update Status</button>
            )}
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>

      {showStatusModal && (
        <StatusUpdateModal
          shipment={shipment}
          onClose={() => setShowStatusModal(false)}
          onSuccess={() => { setShowStatusModal(false); onRefresh(); onClose(); }}
        />
      )}
    </>
  );
}
