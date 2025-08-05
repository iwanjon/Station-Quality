import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import About from '../pages/About';
import NotFound from '../pages/NotFound';
import StationQuality from '../pages/StationQuality';

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/station-quality" element={<StationQuality />} />
      <Route path="/about" element={<About />} />
      <Route path="*" element={<NotFound />} />
      
    </Routes>
  );
};

export default Router;
