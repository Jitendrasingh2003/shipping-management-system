import AppLayout from '../../components/layout/AppLayout';
import CreateShipmentModal from '../../components/shipments/CreateShipmentModal';
import { useNavigate } from 'react-router-dom';

export default function CreateShipmentPage() {
  const navigate = useNavigate();
  return (
    <AppLayout title="Create Shipment" subtitle="Add a new shipment to the system">
      <CreateShipmentModal
        onClose={() => navigate('/manager')}
        onSuccess={() => navigate('/manager/shipments')}
        isPage
      />
    </AppLayout>
  );
}
