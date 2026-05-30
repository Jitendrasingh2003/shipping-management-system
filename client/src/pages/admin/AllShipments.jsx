import { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { shipmentAPI, userAPI } from '../../services/api';
import { MdAdd, MdSearch, MdFilterList, MdEdit, MdDelete, MdAssignment, MdVisibility, MdRefresh, MdDownload } from 'react-icons/md';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import ShipmentDetailModal from '../../components/shipments/ShipmentDetailModal';
import AssignModal from '../../components/shipments/AssignModal';
import CreateShipmentModal from '../../components/shipments/CreateShipmentModal';

const STATUS_OPTS = ['','created','processing','dispatched','picked_up','in_transit','out_for_delivery','delivered','failed','returned','cancelled'];

export default function AllShipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filters, setFilters] = useState({ status: '', search: '', priority: '' });
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [assignShipment, setAssignShipment] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await shipmentAPI.getAll({ ...filters, page, limit: 10 });
      setShipments(res.data.shipments);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load shipments'); }
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  const handleDelete = async (id) => {
    if (!window.confirm('Archive this shipment?')) return;
    try {
      await shipmentAPI.delete(id);
      toast.success('Shipment archived');
      fetchShipments();
    } catch { toast.error('Failed to archive'); }
  };

  const handleDownload = async (format) => {
    try {
      const { reportAPI } = await import('../../services/api');
      const res = await reportAPI.shipments({ format, ...filters });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `shipments_report.${format}`;
      a.click();
      toast.success('Report downloaded!');
    } catch { toast.error('Download failed'); }
  };

  return (
    <AppLayout title="All Shipments" subtitle={`${total} total shipments`}>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Shipment Management</h1>
          <p>View, manage and track all shipments in the system</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={() => handleDownload('csv')}><MdDownload /> CSV</button>
          <button className="btn btn-secondary" onClick={() => handleDownload('pdf')}><MdDownload /> PDF</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><MdAdd /> New Shipment</button>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-search">
            <MdSearch className="table-search-icon" size={18} />
            <input
              placeholder="Search by tracking ID, name, city..."
              value={filters.search}
              onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
            />
          </div>
          <div className="table-filters">
            <select className="filter-select" value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}>
              <option value="">All Statuses</option>
              {STATUS_OPTS.filter(s => s).map(s => <option key={s} value={s}>{s.replace(/_/g,' ').toUpperCase()}</option>)}
            </select>
            <select className="filter-select" value={filters.priority} onChange={e => { setFilters(f => ({ ...f, priority: e.target.value })); setPage(1); }}>
              <option value="">All Priorities</option>
              {['low','normal','high','urgent'].map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
            </select>
            <button className="btn btn-secondary btn-sm" onClick={fetchShipments}><MdRefresh /></button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /><div className="loading-text">Loading...</div></div>
        ) : shipments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-title">No shipments found</div>
            <div className="empty-text">Try changing filters or create a new shipment</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tracking ID</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Route</th>
                <th>Service</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned To</th>
                <th>Cost</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map(s => (
                <tr key={s._id}>
                  <td>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600, fontFamily: 'monospace', fontSize: '13px' }}>{s.trackingId}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.senderName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.senderCity}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.receiverName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.receiverCity}</div>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.senderCity} → {s.receiverCity}</td>
                  <td><span className="badge badge-processing" style={{ fontSize: '10px' }}>{s.serviceType?.toUpperCase()}</span></td>
                  <td><span className={`badge badge-${s.status}`}>{s.status?.replace(/_/g,' ')}</span></td>
                  <td>
                    <span className={`badge ${
                      s.priority === 'urgent' ? 'badge-failed' :
                      s.priority === 'high' ? 'badge-in_transit' :
                      s.priority === 'normal' ? 'badge-processing' : 'badge-cancelled'
                    }`} style={{ fontSize: '10px' }}>{s.priority?.toUpperCase()}</span>
                  </td>
                  <td style={{ fontSize: '13px' }}>{s.assignedTo?.name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{s.shippingCost}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-icon" title="View Details" onClick={() => setSelectedShipment(s)}>
                        <MdVisibility size={16} />
                      </button>
                      <button className="btn btn-ghost btn-icon" title="Assign to Staff" onClick={() => setAssignShipment(s)}>
                        <MdAssignment size={16} />
                      </button>
                      <button className="btn btn-ghost btn-icon" title="Archive" onClick={() => handleDelete(s._id)}
                        style={{ color: 'var(--danger)' }}>
                        <MdDelete size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pages > 1 && (
          <div className="pagination">
            <div className="pagination-info">Showing {((page-1)*10)+1}–{Math.min(page*10, total)} of {total}</div>
            <div className="pagination-controls">
              <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === pages}>›</button>
            </div>
          </div>
        )}
      </div>

      {selectedShipment && (
        <ShipmentDetailModal
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
          onRefresh={fetchShipments}
        />
      )}
      {assignShipment && (
        <AssignModal
          shipment={assignShipment}
          onClose={() => setAssignShipment(null)}
          onSuccess={() => { setAssignShipment(null); fetchShipments(); }}
        />
      )}
      {showCreate && (
        <CreateShipmentModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); fetchShipments(); }}
        />
      )}
    </AppLayout>
  );
}
