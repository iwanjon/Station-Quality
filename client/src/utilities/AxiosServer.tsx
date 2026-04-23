// // import axios from "axios";

// // const axiosServer = axios.create({
// //   baseURL: import.meta.env.VITE_SERVER_BASE_URL,
// //   headers: {
// //     "Content-Type": "application/json",
// //   },
// // });

// // export default axiosServer;
// import axios from 'axios';
// import { useAuthStore } from '../store/useAuthStore';

// // Create your Axios instance
// // Adjust the baseURL according to your environment setup
// const axiosServer = axios.create({
//   baseURL: import.meta.env.VITE_SERVER_BASE_URL || '', 
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // --- REQUEST INTERCEPTOR ---
// // This runs before every request gets sent
// axiosServer.interceptors.request.use(
//   (config) => {
//     // Read the current state directly from Zustand outside of a React component
//     const token = useAuthStore.getState().token;

//     // If we have a token, attach it to the headers
//     if (token && config.headers) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // --- RESPONSE INTERCEPTOR ---
// // This runs whenever a response is received
// axiosServer.interceptors.response.use(
//   (response) => {
//     // If the request succeeds, just return the response
//     return response;
//   },
//   (error) => {
//     // If the server returns a 401 Unauthorized, it means the token expired or is invalid
//     if (error.response && error.response.status === 401) {
//       console.warn('Unauthorized access - logging out.');
      
//       // Clear the Zustand store
//       useAuthStore.getState().logout();
      
//       // Redirect to login page
//       // Using window.location forces a hard redirect, which is safe here outside of the Router context
//       if (window.location.pathname !== '/login') {
//         window.location.href = '/login';
//       }
//     }
    
//     return Promise.reject(error);
//   }
// );

// export default axiosServer;



import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Create your Axios instance
const axiosServer = axios.create({
  baseURL: import.meta.env.VITE_SERVER_BASE_URL || '', 
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