import { Routes, Route } from 'react-router-dom';
import About from '../pages/About';
import NotFound from '../pages/NotFound';
import StationQuality from '../pages/StationQuality';
import Dashboard from '../pages/Dashboard';

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/station-quality" element={<StationQuality />} />
      <Route path="/about" element={<About />} />
      <Route path="*" element={<NotFound />} />
      
    </Routes>
  );
};

export default Router;
