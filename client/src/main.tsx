import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './routes/index.tsx'; // Import komponen App dari index.tsx
import { BrowserRouter } from 'react-router-dom'; // PENTING: Tambahkan import ini

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

  // <StrictMode>
  //   <App />
  // </StrictMode>,
// )
