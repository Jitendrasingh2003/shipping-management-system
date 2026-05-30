import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { MdNotifications, MdSearch, MdClose, MdCheckCircle, MdLocalShipping, MdPerson, MdBarChart, MdSecurity } from 'react-icons/md';
import { formatDistanceToNow } from 'date-fns';

const notifIcons = {
  shipment_created: { icon: <MdLocalShipping />, bg: 'var(--info-bg)', color: 'var(--info)' },
  status_update: { icon: <MdLocalShipping />, bg: 'var(--warning-bg)', color: 'var(--warning)' },
  delivery_assigned: { icon: <MdLocalShipping />, bg: 'var(--success-bg)', color: 'var(--success)' },
  delivery_completed: { icon: <MdCheckCircle />, bg: 'var(--success-bg)', color: 'var(--success)' },
  system: { icon: <MdPerson />, bg: 'rgba(139,92,246,0.12)', color: 'var(--accent-secondary)' },
  report_ready: { icon: <MdBarChart />, bg: 'var(--info-bg)', color: 'var(--info)' },
  alert: { icon: <MdSecurity />, bg: 'var(--danger-bg)', color: 'var(--danger)' },
};

export default function Navbar({ title, subtitle }) {
  const { user } = useAuth();
  const { unreadCount, notifications, markRead, markAllRead } = useSocket();
  const [notifOpen, setNotifOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = (n) => {
    if (!n.isRead) markRead(n._id);
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-left">
          <div>
            <div className="page-title">{title}</div>
            {subtitle && <div className="page-breadcrumb">{subtitle}</div>}
          </div>
        </div>

        <div className="navbar-right">
          {/* Greeting */}
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Good {new Date().getHours() < 12 ? '🌅 Morning' : new Date().getHours() < 17 ? '☀️ Afternoon' : '🌙 Evening'}, {user?.name?.split(' ')[0]}
          </span>

          {/* Notifications Bell */}
          <button className="icon-btn" onClick={() => setNotifOpen(!notifOpen)}>
            <MdNotifications size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* Notifications Panel */}
      <div className={`notifications-panel ${notifOpen ? 'open' : ''}`} ref={panelRef}>
        <div className="notif-header">
          <div>
            <div className="notif-title">Notifications</div>
            {unreadCount > 0 && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{unreadCount} unread</div>}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {unreadCount > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all read</button>
            )}
            <button className="icon-btn" onClick={() => setNotifOpen(false)}>
              <MdClose size={18} />
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
                <div key={n._id} className={`notif-item ${!n.isRead ? 'unread' : ''}`} onClick={() => handleNotifClick(n)}>
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

      {/* Overlay */}
      {notifOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 149, background: 'rgba(0,0,0,0.3)' }}
          onClick={() => setNotifOpen(false)}
        />
      )}
    </>
  );
}
