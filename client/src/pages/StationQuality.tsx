import { useEffect, useState } from 'react';
import Card from '../components/Card.tsx';
import Footer from '../components/Footer.tsx';
import MainLayout from '../layouts/MainLayout.tsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

interface StationMetadata {
  station_name?: string;
  sta_code?: string;
  location?: string;
}

const StationQuality = () => {
  const [stationData, setStationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const staCodes = ['KLSM', 'PSR', 'BDO']; 

  const fetchStationMetadata = async (staCode: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}api/metadata/pg-combined/${staCode}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${API_KEY}` 
        }
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching station data:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadStations = async () => {
      setLoading(true);
      const results = await Promise.all(
        staCodes.map(code => fetchStationMetadata(code))
      );
      setStationData(results.filter(Boolean)); // filter out null results
      setLoading(false);
    };

    loadStations();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <MainLayout className="flex-1 flex flex-wrap justify-center items-center gap-6 p-8">
        {loading && <p>Loading station data...</p>}
        {/* {stationData &&
          stationData.map((data: StationMetadata, idx: number) => (
            <Card
              key={idx}
              imageSrc={`/images/station${idx + 1}.jpg`} 
              title={data?.station_name || `Station ${idx + 1}`}
              description={`Code: ${data.sta_code || 'N/A'} | Location: ${data.location || 'N/A'}`}
            />
          ))} */}
      </MainLayout>
      <Footer />
    </div>
  );
};

export default StationQuality;

// import Card from '../components/Card.tsx';
// import Footer from '../components/Footer.tsx';
// import MainLayout from '../layouts/MainLayout.tsx';


// const StationQuality = () => (
//   <div className="min-h-screen flex flex-col">
//     <MainLayout className="flex-1 flex flex-wrap justify-center items-center gap-6 p-8">
//       {/* Example cards */}
//       <Card imageSrc="/images/station1.jpg" title="Station 1" description="Details about Station 1" />
//       {/* <Card imageSrc="/images/station2.jpg" title="Station 2" description="Details about Station 2" /> */}
//       {/* <Card imageSrc="/images/station3.jpg" title="Station 3" description="Details about Station 3" /> */}
//     </MainLayout>
//     <Footer />
//   </div>
// );

// export default StationQuality;
