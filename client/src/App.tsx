// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Router from './routes';
import StationAvailability from './pages/StationAvailability';
import StationAvailabilityDetail from './pages/StationAvailabilityDetail';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <BrowserRouter>
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