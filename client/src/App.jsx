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
import CompanySettings from './pages/admin/CompanySettings';
import RoleManagement from './pages/admin/RoleManagement';
import HRManagement from './pages/admin/HRManagement';
import AccountFinance from './pages/admin/AccountFinance';
import BugsReport from './pages/admin/BugsReport';
import DemoRequests from './pages/admin/DemoRequests';
import GeneralEnquiry from './pages/admin/GeneralEnquiry';

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
                background: '#ffffff',
                color: '#111827',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '14px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              },
              success: { iconTheme: { primary: '#16a34a', secondary: '#ffffff' } },
              error:   { iconTheme: { primary: '#dc2626', secondary: '#ffffff' } },
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
              <Route path="/admin/company" element={<CompanySettings />} />
              <Route path="/admin/roles" element={<RoleManagement />} />
              <Route path="/admin/hr" element={<HRManagement />} />
              <Route path="/admin/finance" element={<AccountFinance />} />
              <Route path="/admin/bugs" element={<BugsReport />} />
              <Route path="/admin/demo-requests" element={<DemoRequests />} />
              <Route path="/admin/enquiries" element={<GeneralEnquiry />} />
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
