// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Router from './routes';
import StationAvailability from './pages/StationAvailability';
import StationAvailabilityDetail from './pages/StationAvailabilityDetail';

const App = () => {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_KEY = import.meta.env.VITE_API_KEY;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Router />} />
        <Route path="/station-availability" element={<StationAvailability />} />
        <Route path="/station-availability/:id" element={<StationAvailabilityDetail />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;