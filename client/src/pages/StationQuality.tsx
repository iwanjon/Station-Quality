import Card from '../components/Card.tsx';
import Footer from '../components/Footer.tsx';
import MainLayout from '../layouts/MainLayout.tsx';


const StationQuality = () => (
  <div className="min-h-screen flex flex-col">
    <MainLayout className="flex-1 flex flex-wrap justify-center items-center gap-6 p-8">
      {/* Example cards */}
      <Card imageSrc="/images/station1.jpg" title="Station 1" description="Details about Station 1" />
      <Card imageSrc="/images/station2.jpg" title="Station 2" description="Details about Station 2" />
      <Card imageSrc="/images/station3.jpg" title="Station 3" description="Details about Station 3" />
    </MainLayout>
    <Footer />
  </div>
);

export default StationQuality;
