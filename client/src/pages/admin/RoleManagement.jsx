import AppLayout from '../../components/layout/AppLayout';
import { userAPI } from '../../services/api';
import { useState } from 'react';
import { MdAdminPanelSettings, MdSupervisorAccount, MdDeliveryDining, MdCheck, MdClose } from 'react-icons/md';

const ROLES = [
  {
    role: 'admin',
    label: 'Administrator',
    color: '#7c3aed',
    bg: '#ede9fe',
    icon: <MdAdminPanelSettings size={32} />,
    description: 'Full system access. Can manage all users, shipments, invoices, reports, and system settings.',
    permissions: [
      'Manage all users (create, edit, deactivate, delete)',
      'View & manage all shipments',
      'Access financial reports & invoices',
      'View audit trails & security logs',
      'Company settings & configuration',
      'Bug reports & demo request management',
      'Role management & access control',
    ],
  },
  {
    role: 'manager',
    label: 'Warehouse Manager',
    color: '#2563eb',
    bg: '#dbeafe',
    icon: <MdSupervisorAccount size={32} />,
    description: 'Operations management. Can create shipments, assign deliveries to staff, and view reports.',
    permissions: [
      'Create & manage shipments',
      'Assign deliveries to staff',
      'View shipment reports',
      'Access invoices (read-only)',
      'View staff workload & performance',
    ],
    restricted: [
      'Cannot manage users',
      'Cannot access audit logs',
      'Cannot change company settings',
    ],
  },
  {
    role: 'staff',
    label: 'Delivery Personnel',
    color: '#059669',
    bg: '#d1fae5',
    icon: <MdDeliveryDining size={32} />,
    description: 'Delivery operations. Can view assigned deliveries and update delivery status.',
    permissions: [
      'View assigned deliveries',
      'Update delivery status step-by-step',
      'Upload proof of delivery (photo)',
      'View personal performance metrics',
      'Receive real-time notifications',
    ],
    restricted: [
      'Cannot view other staff deliveries',
      'Cannot create or manage shipments',
      'Cannot access financial data',
    ],
  },
];

export default function RoleManagement() {
  const [counts, setCounts] = useState({ admin: 0, manager: 0, staff: 0, loaded: false });

  useState(() => {
    userAPI.getAll({ limit: 200 })
      .then(res => {
        const users = res.data.data || [];
        setCounts({
          admin:   users.filter(u => u.role === 'admin').length,
          manager: users.filter(u => u.role === 'manager').length,
          staff:   users.filter(u => u.role === 'staff').length,
          loaded:  true,
        });
      })
      .catch(() => {});
  }, []);

  return (
    <AppLayout title="Role Management" subtitle="System roles, permissions and access control">

      <div className="dashboard-hero" style={{ marginBottom: '24px' }}>
        <div className="dashboard-hero-top">
          <div>
            <h1>Role <span>Management</span></h1>
            <p>View and understand system roles and their permission levels.</p>
          </div>
          <div className="fleet-status-badge">🔐 Access Control</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        {ROLES.map(r => (
          <div key={r.role} className="stat-card">
            <div className="stat-info">
              <div className="stat-label">{r.label}s</div>
              <div className="stat-value" style={{ color: r.color }}>{counts[r.role]}</div>
              <div className="stat-tag live">Active</div>
            </div>
            <div className="stat-icon-wrap" style={{ background: r.bg, color: r.color }}>{r.icon}</div>
          </div>
        ))}
      </div>

      {/* Role Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {ROLES.map(r => (
          <div key={r.role} className="card" style={{ borderLeft: `4px solid ${r.color}` }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: r.bg, color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {r.icon}
                </div>
                <div>
                  <div className="card-title" style={{ color: r.color }}>{r.label}</div>
                  <div className="card-subtitle">{r.description}</div>
                </div>
              </div>
              <div style={{ background: r.bg, color: r.color, padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '13px' }}>
                {counts[r.role]} user{counts[r.role] !== 1 ? 's' : ''}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: r.restricted ? '1fr 1fr' : '1fr', gap: '20px', padding: '4px 0 8px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a', marginBottom: '10px' }}>✅ Allowed Permissions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {r.permissions.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#374151' }}>
                      <MdCheck size={16} style={{ color: '#16a34a', marginTop: '2px', flexShrink: 0 }} />
                      {p}
                    </div>
                  ))}
                </div>
              </div>
              {r.restricted && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626', marginBottom: '10px' }}>🚫 Restrictions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {r.restricted.map((p, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#374151' }}>
                        <MdClose size={16} style={{ color: '#dc2626', marginTop: '2px', flexShrink: 0 }} />
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
