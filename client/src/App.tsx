import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import StationQuality from './pages/StationQuality';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/station-quality" element={<StationQuality />} />
      </Routes>
    </Router>
  );
}

export default App;