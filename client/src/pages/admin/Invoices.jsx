import { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { dashboardAPI } from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.getInvoices({ status, page, limit: 10 });
      setInvoices(res.data.invoices);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  }, [status, page]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.totalAmount), 0);
  const pendingRevenue = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.totalAmount), 0);

  return (
    <AppLayout title="Invoices" subtitle="Financial records and invoice management">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Invoice Management</h1>
          <p>All shipment invoices and payment records</p>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '20px' }}>
        <div className="stat-card green">
          <div className="stat-info">
            <div className="stat-label">Revenue Collected</div>
            <div className="stat-value">₹{(totalRevenue / 1000).toFixed(1)}K</div>
          </div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-info">
            <div className="stat-label">Pending Amount</div>
            <div className="stat-value">₹{(pendingRevenue / 1000).toFixed(1)}K</div>
          </div>
        </div>
        <div className="stat-card blue">
          <div className="stat-info">
            <div className="stat-label">Total Invoices</div>
            <div className="stat-value">{total}</div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Invoice Records</div>
          <div className="table-filters">
            <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Tracking ID</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Amount</th>
                <th>Tax (18%)</th>
                <th>Total</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Paid At</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '13px', fontFamily: 'monospace' }}>
                    {inv.invoiceNumber}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px', fontFamily: 'monospace' }}>
                    {inv.trackingId}
                  </td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{inv.senderName}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{inv.receiverName}</td>
                  <td style={{ color: 'var(--text-primary)' }}>₹{Number(inv.amount).toFixed(2)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>₹{Number(inv.tax).toFixed(2)}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 700 }}>₹{Number(inv.totalAmount).toFixed(2)}</td>
                  <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {inv.dueDate ? format(new Date(inv.dueDate), 'dd MMM yyyy') : '—'}
                  </td>
                  <td style={{ fontSize: '12px', color: inv.paidAt ? 'var(--success)' : 'var(--text-muted)' }}>
                    {inv.paidAt ? format(new Date(inv.paidAt), 'dd MMM yyyy') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pages > 1 && (
          <div className="pagination">
            <div className="pagination-info">Page {page} of {pages} ({total} records)</div>
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
    </AppLayout>
  );
}
