// src/App.tsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Router from './routes';
import StationAvailability from './pages/StationAvailability';
import StationAvailabilityDetail from './pages/StationAvailabilityDetail';
import ProtectedRoute from './components/ProtectedRoute';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Router />} />
          <Route path="/station-availability" element={<StationAvailability />} />
          <Route path="/station-availability/:id" element={<StationAvailabilityDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;