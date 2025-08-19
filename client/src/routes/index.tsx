import { Routes, Route } from 'react-router-dom';
import About from '../pages/About';
import NotFound from '../pages/NotFound';
import Dashboard from '../pages/Dashboard';
import StationQuality from '../pages/StationQuality';
import StationAvailability from '../pages/StationAvailability';
import StationDetail from '../pages/StationDetail';
const Router = () => {
  return (
    <Routes>
      {/* <Route path="/" element={<Dashboard />} /> */}
      <Route path="/station-quality" element={<StationQuality />} />
      <Route path="/station-availability" element={<StationAvailability />} />
      <Route path="/about" element={<About />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="*" element={<NotFound />} />
      <Route path="/station/:id" element={<StationDetail />} />
    </Routes>
  );
};

export default Router;
