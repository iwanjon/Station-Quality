//   }
// );

// export default axiosServer;



import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// In development, use a relative API base so requests go through
// the Vite dev-server proxy. In production, keep using the configured
// backend URL.
const baseURL = import.meta.env.DEV
  ? ''
  : import.meta.env.VITE_SERVER_BASE_URL || '';

// Create your Axios instance
const axiosServer = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  // CRITICAL: This allows Axios to send and receive httpOnly cookies
  withCredentials: true, 
});

// --- REQUEST INTERCEPTOR REMOVED ---
// You no longer need a request interceptor because the browser 
// automatically attaches the httpOnly cookie to every request!


// --- RESPONSE INTERCEPTOR ---
// This runs whenever a response is received
axiosServer.interceptors.response.use(
  (response) => {
    // If the request succeeds, just return the response
    return response;
  },
  (error) => {
    // If the server returns a 401 Unauthorized, it means the cookie/token expired or is invalid
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized access - logging out.');

      // Clear the user profile from Zustand
      useAuthStore.getState().logout();

      // Redirect to login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosServer;
