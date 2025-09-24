// Router.tsx
import { Routes, Route } from 'react-router-dom';
import About from '../pages/About';
import NotFound from '../pages/NotFound';
import Dashboard from '../pages/Dashboard';
import StationQuality from '../pages/StationQuality';
import StationAvailability from '../pages/StationAvailability';
import StationAvailabilityDetail from '../pages/StationAvailabilityDetail';
import StationMap from '../pages/StationMap';
import StationDetail from '../pages/StationDetail';
import StationPerformance from '../pages/StationPerformance';
import StationDaily from '../pages/StationDaily';
import StationMapDetail from '../pages/StationMapDetail';

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/station-quality" element={<StationQuality />} />
      <Route path="/station-availability" element={<StationAvailability />} />
      <Route path="/station-availability/:stationCode" element={<StationAvailabilityDetail />} />
      <Route path="/station-map" element={<StationMap />} />
      <Route path="/station/:stationCode" element={<StationDetail />} />
      <Route path="/station-performance" element={<StationPerformance />} />
      <Route path="/station-daily/:stationCode" element={<StationDaily />} />
      <Route path="/about" element={<About />} /> 
      <Route path="/station-map/:stationCode" element={<StationMapDetail />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default Router;
