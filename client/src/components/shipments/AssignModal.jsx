import { useEffect, useState } from 'react';
import { userAPI, shipmentAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { MdClose, MdPerson } from 'react-icons/md';

export default function AssignModal({ shipment, onClose, onSuccess }) {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingStaff, setFetchingStaff] = useState(true);

  useEffect(() => {
    userAPI.getStaff()
      .then(res => setStaffList(res.data.users))
      .catch(() => toast.error('Failed to load staff'))
      .finally(() => setFetchingStaff(false));
  }, []);

  const handleAssign = async () => {
    if (!selectedStaff) return toast.error('Please select a staff member');
    setLoading(true);
    try {
      await shipmentAPI.assign(shipment._id, { staffId: selectedStaff });
      toast.success('Shipment assigned successfully! 🚚');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-sm">
        <div className="modal-header">
          <div>
            <div className="modal-title">📋 Assign Shipment</div>
            <div style={{ fontSize: '12px', color: 'var(--accent-primary)', fontFamily: 'monospace', marginTop: '2px' }}>
              {shipment.trackingId}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><MdClose /></button>
        </div>

        <div className="modal-body">
          {/* Shipment Summary */}
          <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px', fontWeight: 500 }}>
              {shipment.senderName} → {shipment.receiverName}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {shipment.senderCity} → {shipment.receiverCity} • {shipment.packageType} • {shipment.weight}kg
            </div>
            {shipment.assignedTo?.name && (
              <div style={{ fontSize: '12px', color: 'var(--warning)', marginTop: '6px' }}>
                Currently assigned to: {shipment.assignedTo.name}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Select Delivery Personnel <span className="required">*</span></label>
            {fetchingStaff ? (
              <div className="loading-container" style={{ padding: '20px' }}><div className="spinner" style={{ width: 24, height: 24 }} /></div>
            ) : staffList.length === 0 ? (
              <div className="alert alert-warning">No active staff members available</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {staffList.map(staff => {
                  const staffId = staff._id || staff.id;
                  return (
                    <label key={staffId} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 14px',
                      background: selectedStaff === staffId ? 'var(--accent-primary-glow)' : 'var(--bg-input)',
                      border: `1px solid ${selectedStaff === staffId ? 'var(--accent-primary)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      <input type="radio" name="staff" value={staffId} checked={selectedStaff === staffId} onChange={() => setSelectedStaff(staffId)} style={{ display: 'none' }} />
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--success), #16a34a)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
                      }}>
                        {staff.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: selectedStaff === staffId ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                          {staff.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{staff.phone}</div>
                      </div>
                      {selectedStaff === staffId && (
                        <div style={{ fontSize: '18px' }}>✓</div>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAssign} disabled={loading || !selectedStaff}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Assigning...</> : '🚚 Assign & Dispatch'}
          </button>
        </div>
      </div>
    </div>
  );
}
