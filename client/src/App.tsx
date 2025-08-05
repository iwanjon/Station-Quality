import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StationQuality from './pages/StationQuality.tsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StationQuality />} />
        <Route path="/station-quality" element={<StationQuality />} />
      </Routes>
    </Router>
  );
}

export default App;
