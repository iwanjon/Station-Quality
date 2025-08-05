// src/App.tsx
import { BrowserRouter } from 'react-router-dom';
import Router from './routes';


const App = () => {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_KEY = import.meta.env.VITE_API_KEY;

  return (
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  );
};

export default App;