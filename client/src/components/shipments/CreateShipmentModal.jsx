import { useState } from 'react';
import { shipmentAPI, userAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { MdClose } from 'react-icons/md';

export default function CreateShipmentModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    senderName: '', senderEmail: '', senderPhone: '', senderAddress: '',
    senderCity: '', senderState: '', senderZip: '', senderCountry: 'India',
    receiverName: '', receiverEmail: '', receiverPhone: '', receiverAddress: '',
    receiverCity: '', receiverState: '', receiverZip: '', receiverCountry: 'India',
    packageType: 'parcel', weight: '', description: '', value: '',
    dimensions: { length: '', width: '', height: '' },
    serviceType: 'standard', priority: 'normal', specialInstructions: '',
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const setDim = (dim, val) => setForm(f => ({ ...f, dimensions: { ...f.dimensions, [dim]: val } }));

  const handleSubmit = async () => {
    if (!form.senderName || !form.receiverName || !form.weight) {
      return toast.error('Please fill all required fields');
    }
    setLoading(true);
    try {
      await shipmentAPI.create({
        ...form,
        weight: Number(form.weight),
        value: Number(form.value) || 0,
        dimensions: {
          length: Number(form.dimensions.length) || 0,
          width: Number(form.dimensions.width) || 0,
          height: Number(form.dimensions.height) || 0,
        },
      });
      toast.success('Shipment created successfully! 📦');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  const STATES_INDIA = ['Andhra Pradesh','Assam','Bihar','Delhi','Goa','Gujarat','Haryana','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','West Bengal'];

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <div>
            <div className="modal-title">📦 Create New Shipment</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Step {step} of 3</div>
          </div>
          <button className="modal-close" onClick={onClose}><MdClose /></button>
        </div>

        {/* Step Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {['Sender', 'Receiver', 'Package & Service'].map((s, i) => (
            <button key={s} onClick={() => setStep(i + 1)} style={{
              flex: 1, padding: '12px', border: 'none', background: 'none',
              color: step === i + 1 ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderBottom: step === i + 1 ? '2px solid var(--accent-primary)' : '2px solid transparent',
              fontWeight: step === i + 1 ? 600 : 400, cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}>{s}</button>
          ))}
        </div>

        <div className="modal-body">
          {/* Step 1: Sender */}
          {step === 1 && (
            <>
              <div className="section-title" style={{ marginBottom: '16px' }}>📤 Sender Information</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name <span className="required">*</span></label>
                  <input className="form-input" value={form.senderName} onChange={e => set('senderName', e.target.value)} placeholder="John Doe" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email <span className="required">*</span></label>
                  <input className="form-input" type="email" value={form.senderEmail} onChange={e => set('senderEmail', e.target.value)} placeholder="john@example.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone <span className="required">*</span></label>
                  <input className="form-input" value={form.senderPhone} onChange={e => set('senderPhone', e.target.value)} placeholder="+91-9876543210" />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Address <span className="required">*</span></label>
                  <input className="form-input" value={form.senderAddress} onChange={e => set('senderAddress', e.target.value)} placeholder="Street address" />
                </div>
                <div className="form-group">
                  <label className="form-label">City <span className="required">*</span></label>
                  <input className="form-input" value={form.senderCity} onChange={e => set('senderCity', e.target.value)} placeholder="Mumbai" />
                </div>
                <div className="form-group">
                  <label className="form-label">State <span className="required">*</span></label>
                  <select className="form-select" value={form.senderState} onChange={e => set('senderState', e.target.value)}>
                    <option value="">Select State</option>
                    {STATES_INDIA.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">PIN Code <span className="required">*</span></label>
                  <input className="form-input" value={form.senderZip} onChange={e => set('senderZip', e.target.value)} placeholder="400001" maxLength={6} />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input className="form-input" value={form.senderCountry} onChange={e => set('senderCountry', e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* Step 2: Receiver */}
          {step === 2 && (
            <>
              <div className="section-title" style={{ marginBottom: '16px' }}>📥 Receiver Information</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name <span className="required">*</span></label>
                  <input className="form-input" value={form.receiverName} onChange={e => set('receiverName', e.target.value)} placeholder="Jane Smith" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email <span className="required">*</span></label>
                  <input className="form-input" type="email" value={form.receiverEmail} onChange={e => set('receiverEmail', e.target.value)} placeholder="jane@example.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone <span className="required">*</span></label>
                  <input className="form-input" value={form.receiverPhone} onChange={e => set('receiverPhone', e.target.value)} placeholder="+91-9876543210" />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Address <span className="required">*</span></label>
                  <input className="form-input" value={form.receiverAddress} onChange={e => set('receiverAddress', e.target.value)} placeholder="Street address" />
                </div>
                <div className="form-group">
                  <label className="form-label">City <span className="required">*</span></label>
                  <input className="form-input" value={form.receiverCity} onChange={e => set('receiverCity', e.target.value)} placeholder="Delhi" />
                </div>
                <div className="form-group">
                  <label className="form-label">State <span className="required">*</span></label>
                  <select className="form-select" value={form.receiverState} onChange={e => set('receiverState', e.target.value)}>
                    <option value="">Select State</option>
                    {STATES_INDIA.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">PIN Code <span className="required">*</span></label>
                  <input className="form-input" value={form.receiverZip} onChange={e => set('receiverZip', e.target.value)} placeholder="110001" maxLength={6} />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input className="form-input" value={form.receiverCountry} onChange={e => set('receiverCountry', e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* Step 3: Package */}
          {step === 3 && (
            <>
              <div className="section-title" style={{ marginBottom: '16px' }}>📋 Package & Service Details</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Package Type <span className="required">*</span></label>
                  <select className="form-select" value={form.packageType} onChange={e => set('packageType', e.target.value)}>
                    {['document','parcel','fragile','perishable','electronics','clothing','industrial','other'].map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (kg) <span className="required">*</span></label>
                  <input className="form-input" type="number" min="0.1" step="0.1" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="0.5" />
                </div>
                <div className="form-group">
                  <label className="form-label">Service Type <span className="required">*</span></label>
                  <select className="form-select" value={form.serviceType} onChange={e => set('serviceType', e.target.value)}>
                    <option value="economy">Economy (10 days) — ₹30 + ₹20/kg</option>
                    <option value="standard">Standard (5 days) — ₹50 + ₹20/kg</option>
                    <option value="express">Express (2 days) — ₹150 + ₹20/kg</option>
                    <option value="overnight">Overnight (1 day) — ₹300 + ₹20/kg</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Declared Value (₹)</label>
                  <input className="form-input" type="number" min="0" value={form.value} onChange={e => set('value', e.target.value)} placeholder="1000" />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Package Description</label>
                  <input className="form-input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe contents..." />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Dimensions (cm)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    <input className="form-input" type="number" value={form.dimensions.length} onChange={e => setDim('length', e.target.value)} placeholder="Length" />
                    <input className="form-input" type="number" value={form.dimensions.width} onChange={e => setDim('width', e.target.value)} placeholder="Width" />
                    <input className="form-input" type="number" value={form.dimensions.height} onChange={e => setDim('height', e.target.value)} placeholder="Height" />
                  </div>
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Special Instructions</label>
                  <textarea className="form-textarea" value={form.specialInstructions} onChange={e => set('specialInstructions', e.target.value)} placeholder="Handle with care, fragile, etc..." />
                </div>
              </div>

              {/* Cost Preview */}
              {form.weight && (
                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px', marginTop: '8px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>💰 Cost Preview</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Shipping Cost:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      ₹{Math.round(
                        ({ economy: 30, standard: 50, express: 150, overnight: 300 }[form.serviceType] || 50) +
                        (Number(form.weight) || 0) * 20
                      )}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginTop: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>GST (18%):</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      ₹{Math.round(
                        (({ economy: 30, standard: 50, express: 150, overnight: 300 }[form.serviceType] || 50) +
                        (Number(form.weight) || 0) * 20) * 0.18
                      )}
                    </span>
                  </div>
                  <div className="divider" style={{ margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 700 }}>
                    <span style={{ color: 'var(--text-primary)' }}>Total:</span>
                    <span style={{ color: 'var(--success)' }}>
                      ₹{Math.round(
                        (({ economy: 30, standard: 50, express: 150, overnight: 300 }[form.serviceType] || 50) +
                        (Number(form.weight) || 0) * 20) * 1.18
                      )}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          {step > 1 && <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>← Back</button>}
          {step < 3 ? (
            <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>Next →</button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creating...</> : '✅ Create Shipment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
