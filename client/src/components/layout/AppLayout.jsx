import Sidebar from './Sidebar';
import Navbar from './Navbar';
import VesselFABs from './VesselFABs';

export default function AppLayout({ children, title, subtitle }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar title={title} subtitle={subtitle} />
        <div className="page-content fade-in">
          {children}
        </div>
      </main>
      <VesselFABs />
    </div>
  );
}

