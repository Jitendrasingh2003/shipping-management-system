import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
  MdNotifications, MdClose, MdCheckCircle, MdLocalShipping,
  MdPerson, MdBarChart, MdSecurity, MdEmail, MdDirectionsBoat, MdBadge,
} from 'react-icons/md';
import { formatDistanceToNow } from 'date-fns';

const notifIcons = {
  shipment_created:  { icon: <MdLocalShipping />, bg: '#dbeafe', color: '#2563eb' },
  status_update:     { icon: <MdLocalShipping />, bg: '#fef3c7', color: '#d97706' },
  delivery_assigned: { icon: <MdLocalShipping />, bg: '#dcfce7', color: '#16a34a' },
  delivery_completed:{ icon: <MdCheckCircle />,   bg: '#dcfce7', color: '#16a34a' },
  system:            { icon: <MdPerson />,         bg: '#ede9fe', color: '#7c3aed' },
  report_ready:      { icon: <MdBarChart />,       bg: '#dbeafe', color: '#2563eb' },
  alert:             { icon: <MdSecurity />,       bg: '#fee2e2', color: '#dc2626' },
};

const ROLE_LABELS = {
  admin:   'System Administrator',
  manager: 'Operations Manager',
  staff:   'Chief Officer',
};

export default function Navbar({ title, subtitle }) {
  const { user } = useAuth();
  const { unreadCount, notifications, markRead, markAllRead } = useSocket();
  const [notifOpen, setNotifOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const designation = ROLE_LABELS[user?.role] || 'Staff';
  const shipName = user?.role === 'staff' ? 'i4 ship' : 'ShipTrack Pro';

  return (
    <>
      <header className="navbar">
        {/* Left — Email + Ship/System + Designation */}
        <div className="navbar-left" style={{ gap: '20px' }}>
          {/* Email */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151' }}>
            <MdEmail size={15} style={{ color: '#e8380d', flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>Email:</span>
            <span style={{ color: '#6b7280' }}>{user?.email || 'admin@shiptrack.com'}</span>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 18, background: '#e5e7eb' }} />

          {/* Ship/System */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151' }}>
            <MdDirectionsBoat size={15} style={{ color: '#e8380d', flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>Ship:</span>
            <span style={{ color: '#6b7280' }}>{shipName}</span>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 18, background: '#e5e7eb' }} />

          {/* Designation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151' }}>
            <MdBadge size={15} style={{ color: '#e8380d', flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>Designation:</span>
            <span style={{ color: '#6b7280' }}>{designation}</span>
          </div>
        </div>

        {/* Right — Bell + Welcome */}
        <div className="navbar-right">
          {/* Notification Bell */}
          <button className="icon-btn" id="notif-bell-btn" onClick={() => setNotifOpen(!notifOpen)}>
            <MdNotifications size={22} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: '#e5e7eb' }} />

          {/* Welcome + Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151' }}>
            <span style={{ fontWeight: 400, color: '#6b7280' }}>Welcome:</span>
            <span style={{ fontWeight: 600 }}>{user?.name || 'Admin'}</span>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f8ef7, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            }}>
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Panel */}
      <div className={`notifications-panel ${notifOpen ? 'open' : ''}`} ref={panelRef}>
        <div className="notif-header">
          <div>
            <div className="notif-title">Notifications</div>
            {unreadCount > 0 && (
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{unreadCount} unread</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {unreadCount > 0 && (
              <button
                style={{ fontSize: '11px', background: '#f0f2f5', color: '#374151', border: '1px solid #e5e7eb', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' }}
                onClick={markAllRead}
              >
                Mark all read
              </button>
            )}
            <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setNotifOpen(false)}>
              <MdClose size={16} />
            </button>
          </div>
        </div>

        <div className="notif-list">
          {notifications.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-icon">🔔</div>
              <div className="empty-title">No notifications</div>
              <div className="empty-text">You're all caught up!</div>
            </div>
          ) : (
            notifications.map((n) => {
              const style = notifIcons[n.type] || notifIcons.system;
              return (
                <div
                  key={n._id}
                  className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                  onClick={() => { if (!n.isRead) markRead(n._id); }}
                >
                  <div className="notif-icon" style={{ background: style.bg, color: style.color }}>
                    {style.icon}
                  </div>
                  <div className="notif-content">
                    <div className="notif-notif-title">{n.title}</div>
                    <div className="notif-message">{n.message}</div>
                    <div className="notif-time">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Backdrop */}
      {notifOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 149, background: 'rgba(0,0,0,0.15)' }}
          onClick={() => setNotifOpen(false)}
        />
      )}
    </>
  );
}
