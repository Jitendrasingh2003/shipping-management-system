import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AllShipments from './pages/admin/AllShipments';
import UserManagement from './pages/admin/UserManagement';
import Reports from './pages/admin/Reports';
import AuditLogs from './pages/admin/AuditLogs';
import Invoices from './pages/admin/Invoices';

// Manager Pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import AssignDeliveries from './pages/manager/AssignDeliveries';
import CreateShipmentPage from './pages/manager/CreateShipmentPage';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import MyDeliveries from './pages/staff/MyDeliveries';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1c2333',
                color: '#f1f5f9',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#1c2333' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#1c2333' } },
            }}
          />
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/shipments" element={<AllShipments />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="/admin/audit-logs" element={<AuditLogs />} />
              <Route path="/admin/invoices" element={<Invoices />} />
            </Route>

            {/* Manager Routes */}
            <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
              <Route path="/manager" element={<ManagerDashboard />} />
              <Route path="/manager/shipments" element={<AllShipments />} />
              <Route path="/manager/create-shipment" element={<CreateShipmentPage />} />
              <Route path="/manager/assign" element={<AssignDeliveries />} />
              <Route path="/manager/reports" element={<Reports />} />
              <Route path="/manager/invoices" element={<Invoices />} />
            </Route>

            {/* Staff Routes */}
            <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
              <Route path="/staff" element={<StaffDashboard />} />
              <Route path="/staff/deliveries" element={<MyDeliveries />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
