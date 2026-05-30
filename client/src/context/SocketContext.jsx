import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { notificationAPI } from '../services/api';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationAPI.getAll({ limit: 20 });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {}
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    fetchNotifications();

    const s = io('http://localhost:5000', { transports: ['websocket'], autoConnect: true });
    socketRef.current = s;
    setSocket(s);

    s.on('connect', () => {
      s.emit('join:user', user.id);
    });

    s.on('shipment:new', (data) => {
      if (user.role !== 'staff') {
        toast.success(`New shipment: ${data.trackingId}`, { icon: '📦' });
        fetchNotifications();
      }
    });

    s.on('status:update', (data) => {
      toast(`${data.trackingId}: ${data.status.replace(/_/g,' ')}`, { icon: '🚚' });
      fetchNotifications();
    });

    s.on('delivery:assigned', (data) => {
      toast.success(`New delivery assigned: ${data.trackingId}`, { icon: '📋' });
      fetchNotifications();
    });

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [isAuthenticated, user, fetchNotifications]);

  const markRead = async (id) => {
    await notificationAPI.markRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <SocketContext.Provider value={{ socket, unreadCount, notifications, fetchNotifications, markRead, markAllRead }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
