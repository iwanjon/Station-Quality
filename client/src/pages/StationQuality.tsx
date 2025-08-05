import Card from '../components/Card.tsx';
import Footer from '../components/Footer.tsx';
import Sidebar from '../components/sidebar.tsx';

const StationQuality = () => (
  <div className="min-h-screen flex flex-col">
    <Sidebar />
    <main className="flex-1 flex flex-wrap justify-center items-center gap-6 p-8">
      {/* Example cards */}
      <Card title="Station 1" description="Details about Station 1" />
      <Card title="Station 2" description="Details about Station 2" />
      <Card title="Station 3" description="Details about Station 3" />
    </main>
    <Footer />
  </div>
);

export default StationQuality;
