import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('shiptrack_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('shiptrack_token');
      localStorage.removeItem('shiptrack_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Users
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getStaff: () => api.get('/users/staff'),
};

// Shipments
export const shipmentAPI = {
  getAll: (params) => api.get('/shipments', { params }),
  getAssigned: (params) => api.get('/shipments/assigned', { params }),
  getById: (id) => api.get(`/shipments/${id}`),
  track: (trackingId) => api.get(`/shipments/track/${trackingId}`),
  create: (data) => api.post('/shipments', data),
  update: (id, data) => api.put(`/shipments/${id}`, data),
  updateStatus: (id, data) => api.patch(`/shipments/${id}/status`, data),
  assign: (id, data) => api.patch(`/shipments/${id}/assign`, data),
  uploadProof: (id, formData) => api.patch(`/shipments/${id}/proof`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/shipments/${id}`),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getAuditLogs: (params) => api.get('/dashboard/audit-logs', { params }),
  getInvoices: (params) => api.get('/dashboard/invoices', { params }),
};

// Notifications
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// Reports
export const reportAPI = {
  shipments: (params) => api.get('/reports/shipments', { params, responseType: 'blob' }),
  revenue: (params) => api.get('/reports/revenue', { params, responseType: 'blob' }),
};

// Company
export const companyAPI = {
  get:    ()     => api.get('/company'),
  update: (data) => api.put('/company', data),
};

// Bug Reports
export const bugAPI = {
  getAll:  (params) => api.get('/bugs', { params }),
  getStats: ()      => api.get('/bugs/stats'),
  create:  (data)   => api.post('/bugs', data),
  update:  (id, data) => api.patch(`/bugs/${id}`, data),
  delete:  (id)     => api.delete(`/bugs/${id}`),
};

// Demo Requests
export const demoAPI = {
  getAll:  (params) => api.get('/demo-requests', { params }),
  getStats: ()      => api.get('/demo-requests/stats'),
  create:  (data)   => api.post('/demo-requests', data),
  update:  (id, data) => api.patch(`/demo-requests/${id}`, data),
  delete:  (id)     => api.delete(`/demo-requests/${id}`),
};

// Enquiries
export const enquiryAPI = {
  getAll:  (params) => api.get('/enquiries', { params }),
  getStats: ()      => api.get('/enquiries/stats'),
  create:  (data)   => api.post('/enquiries', data),
  update:  (id, data) => api.patch(`/enquiries/${id}`, data),
  delete:  (id)     => api.delete(`/enquiries/${id}`),
};
