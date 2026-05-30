import { useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { reportAPI } from '../../services/api';
import { MdDownload, MdBarChart, MdAttachMoney, MdPictureAsPdf, MdTableChart } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function Reports() {
  const [loading, setLoading] = useState({});
  const [filters, setFilters] = useState({ status: '', dateFrom: '', dateTo: '' });

  const downloadReport = async (type, format) => {
    const key = `${type}_${format}`;
    setLoading(prev => ({ ...prev, [key]: true }));
    try {
      const fn = type === 'shipments' ? reportAPI.shipments : reportAPI.revenue;
      const res = await fn({ format, ...filters });
      const mime = format === 'pdf' ? 'application/pdf' : 'text/csv';
      const url = window.URL.createObjectURL(new Blob([res.data], { type: mime }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report_${Date.now()}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${type} report downloaded!`);
    } catch { toast.error('Failed to generate report'); }
    finally { setLoading(prev => ({ ...prev, [key]: false })); }
  };

  return (
    <AppLayout title="Reports" subtitle="Generate and download shipment and revenue reports">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Report Generation</h1>
          <p>Export shipment and revenue data in PDF or CSV format</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div className="card-title">🔧 Report Filters</div>
        </div>
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Status Filter</label>
            <select className="form-select" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">All Statuses</option>
              {['created','processing','dispatched','in_transit','delivered','failed','returned'].map(s => (
                <option key={s} value={s}>{s.replace(/_/g,' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">From Date</label>
            <input type="date" className="form-input" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">To Date</label>
            <input type="date" className="form-input" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="chart-grid">
        {/* Shipment Report */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div className="stat-icon blue"><MdBarChart size={24} /></div>
            <div>
              <div className="card-title">Shipment Report</div>
              <div className="card-subtitle">All shipment details with status & cost</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Includes: Tracking ID, Sender, Receiver, Status, Service Type, Weight, Cost, Dates
            </div>
            <button
              className="btn btn-primary"
              onClick={() => downloadReport('shipments', 'pdf')}
              disabled={loading.shipments_pdf}
            >
              {loading.shipments_pdf ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating...</> : <><MdPictureAsPdf /> Download PDF</>}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => downloadReport('shipments', 'csv')}
              disabled={loading.shipments_csv}
            >
              {loading.shipments_csv ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating...</> : <><MdTableChart /> Download CSV</>}
            </button>
          </div>
        </div>

        {/* Revenue Report */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div className="stat-icon green"><MdAttachMoney size={24} /></div>
            <div>
              <div className="card-title">Revenue Report</div>
              <div className="card-subtitle">All invoice and payment data</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Includes: Invoice Number, Tracking ID, Amount, Tax, Total, Status, Payment Date
            </div>
            <button
              className="btn btn-primary"
              onClick={() => downloadReport('revenue', 'pdf')}
              disabled={loading.revenue_pdf}
            >
              {loading.revenue_pdf ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating...</> : <><MdPictureAsPdf /> Download PDF</>}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => downloadReport('revenue', 'csv')}
              disabled={loading.revenue_csv}
            >
              {loading.revenue_csv ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating...</> : <><MdTableChart /> Download CSV</>}
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="alert alert-info" style={{ marginTop: '16px' }}>
        <span>ℹ️</span>
        <span>Reports are generated in real-time from the database. PDF reports show up to 50 records; use CSV for complete data export.</span>
      </div>
    </AppLayout>
  );
}
