import { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { dashboardAPI } from '../../services/api';
import { MdSearch, MdFilterList, MdRefresh } from 'react-icons/md';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ACTION_COLORS = {
  USER_LOGIN: 'var(--info)', USER_LOGOUT: 'var(--text-muted)',
  USER_CREATED: 'var(--success)', USER_UPDATED: 'var(--warning)', USER_DELETED: 'var(--danger)',
  SHIPMENT_CREATED: 'var(--accent-primary)', SHIPMENT_UPDATED: 'var(--warning)',
  SHIPMENT_STATUS_CHANGED: 'var(--accent-cyan)', SHIPMENT_ASSIGNED: 'var(--accent-secondary)',
  SHIPMENT_ARCHIVED: 'var(--danger)', REPORT_GENERATED: 'var(--success)',
};

const ACTION_ICONS = {
  USER_LOGIN: '🔐', USER_LOGOUT: '🚪', USER_CREATED: '👤', USER_UPDATED: '✏️', USER_DELETED: '🗑️',
  SHIPMENT_CREATED: '📦', SHIPMENT_UPDATED: '📝', SHIPMENT_STATUS_CHANGED: '🔄',
  SHIPMENT_ASSIGNED: '📋', SHIPMENT_ARCHIVED: '🗃️', REPORT_GENERATED: '📊',
  NOTIFICATION_SENT: '🔔', INVOICE_CREATED: '📄',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.getAuditLogs({ page, limit: 15, action: actionFilter });
      setLogs(res.data.logs);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  }, [page, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const uniqueActions = [...new Set(logs.map(l => l.action))];

  return (
    <AppLayout title="Audit Trail" subtitle="Complete system activity log">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Audit Trail</h1>
          <p>Every action recorded — {total} total log entries</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={fetchLogs}><MdRefresh /> Refresh</button>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Showing {logs.length} of {total} audit entries
          </div>
          <div className="table-filters">
            <select className="filter-select" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}>
              <option value="">All Actions</option>
              {['USER_LOGIN','USER_CREATED','USER_UPDATED','USER_DELETED',
                'SHIPMENT_CREATED','SHIPMENT_STATUS_CHANGED','SHIPMENT_ASSIGNED',
                'SHIPMENT_ARCHIVED','REPORT_GENERATED'].map(a => (
                <option key={a} value={a}>{a.replace(/_/g,' ')}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No audit logs found</div>
          </div>
        ) : (
          <div style={{ padding: '8px 0' }}>
            {logs.map((log, idx) => (
              <div key={log._id} style={{
                display: 'flex', gap: '16px', padding: '14px 20px',
                borderBottom: idx < logs.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0,
                }}>
                  {ACTION_ICONS[log.action] || '📌'}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 600,
                      color: ACTION_COLORS[log.action] || 'var(--accent-primary)',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>{log.action.replace(/_/g,' ')}</span>
                    <span className={`role-badge ${log.userRole}`}>{log.userRole}</span>
                    {log.status === 'failed' && <span className="badge badge-failed" style={{ fontSize: '10px' }}>FAILED</span>}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {log.description}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>👤 {log.userName}</span>
                    {log.resourceId && <span>🔗 {log.resourceId}</span>}
                    {log.ipAddress && <span>📍 {log.ipAddress}</span>}
                  </div>
                </div>

                {/* Time */}
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0, textAlign: 'right' }}>
                  <div>{format(new Date(log.createdAt), 'dd MMM yyyy')}</div>
                  <div>{format(new Date(log.createdAt), 'HH:mm:ss')}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="pagination">
            <div className="pagination-info">Page {page} of {pages}</div>
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
