// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuthStore } from '../store/useAuthStore';
// import axiosServer from '../utilities/AxiosServer';

// const Login = () => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
  
//   const login = useAuthStore((state) => state.login);
//   const navigate = useNavigate();

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setError('');

//     try {
//       // Adjust the endpoint '/api/auth/login' to match your actual backend API
//       const response = await axiosServer.post('/api/user/login', {
//         username,
//         password,
//       });

//       if (response.data.success && response.data.token) {
//         // Save token to Zustand store
//         login(response.data.token);
//         // Redirect to Dashboard
//         navigate('/');
//       } else {
//         setError('Invalid login response from server.');
//       }
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
//       <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full">
//         <div className="flex justify-center mb-6">
//           {/* You can replace this with your actual BMKG Logo */}
//           <div className="h-16 w-16 bg-gray-800 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-md">
//             B
//           </div>
//         </div>
        
//         <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
//           Station Quality
//         </h2>

//         {error && (
//           <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleLogin} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Username
//             </label>
//             <input
//               type="text"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none"
//               placeholder="Enter your username"
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Password
//             </label>
//             <input
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none"
//               placeholder="Enter your password"
//               required
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={isLoading}
//             className="w-full bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
//           >
//             {isLoading ? 'Signing in...' : 'Sign In'}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default Login;




import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import axiosServer from '../utilities/AxiosServer';

// const Login = () => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
  
//   const login = useAuthStore((state) => state.login);
//   const navigate = useNavigate();

// //   const handleLogin = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     setIsLoading(true);
// //     setError('');

// //     try {
// //       const response = await axiosServer.post('/api/user/login', {
// //         username,
// //         password,
// //       });

// //       // Based on your response: check for success and token
// //       if (response.data.success && response.data.token) {
        
// //         // Pass both the token and the user object to your Zustand store
// //         login(response.data.token, response.data.user);
        
// //         // Redirect to Dashboard
// //         navigate('/');
// //       } else {
// //         // Use the backend's message if it failed but didn't throw an HTTP error
// //         setError(response.data.message || 'Invalid login response from server.');
// //       }
// //     } catch (err: any) {
// //       setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   };



// const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setError('');

//     // --- DEBUG LOG: Check what we are about to send ---
//     console.log("=== DEBUG: LOGIN INITIATED ===");
//     // const payload = { username, password };
//     const payload = { 
//       identifier: username, 
//       password: password 
//     };
//     console.log("1. Payload being sent to server:", payload);

//     try {
//       // NOTE: Changed from /api/auth/login to /api/user/login based on your error log
//       console.log("2. Sending POST request to: /api/user/login");
//       const response = await axiosServer.post('/api/user/login', payload);

//       // --- DEBUG LOG: Check server response on success ---
//       console.log("=== DEBUG: LOGIN SUCCESS ===");
//       console.log("3. Full Response Object:", response);
//       console.log("4. Response Data:", response.data);

//       if (response.data.success && response.data.token) {
//         login(response.data.token, response.data.user);
//         navigate('/');
//       } else {
//         setError(response.data.message || 'Invalid login response from server.');
//       }
//     } catch (err: any) {
//       // --- DEBUG LOG: Check server response on error ---
//       console.error("=== DEBUG: LOGIN ERROR ===");
//       console.error("3. Full Error Object:", err);
      
//       if (err.response) {
//         // The server received the request and returned a status code outside the 2xx range
//         console.error("4. Error Status Code:", err.response.status); // e.g., 400
//         console.error("5. Error Data (Message from backend):", err.response.data);
        
//         // This sets the UI error message to exactly what the backend complained about
//         setError(
//           err.response?.data?.message || 
//           err.response?.data?.error || 
//           'Login failed. Bad request.'
//         );
//       } else if (err.request) {
//         // The request was made but no response was received (e.g., server down, CORS issue)
//         console.error("4. No response received. Request details:", err.request);
//         setError('No response from server. Check if the backend is running.');
//       } else {
//         // Something happened while setting up the request
//         console.error("4. Request Setup Error Message:", err.message);
//         setError('An unexpected error occurred while setting up the request.');
//       }
//     } finally {
//       setIsLoading(false);
//       console.log("=== DEBUG: LOGIN PROCESS FINISHED ===");
//     }
//   };

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const payload = { 
      identifier: username, 
      password: password 
    };

    try {
      const response = await axiosServer.post('/api/user/login', payload);

      // --- UPDATED: No longer checking for response.data.token ---
      if (response.data.success && response.data.user) {
        
        // Pass ONLY the user object to your Zustand store
        login(response.data.user);
        
        navigate('/');
      } else {
        setError(response.data.message || 'Invalid login response from server.');
      }
    } catch (err: any) {
      if (err.response) {
        setError(
          err.response?.data?.message || 
          err.response?.data?.error || 
          'Login failed. Bad request.'
        );
      } else if (err.request) {
        setError('No response from server. Check if the backend is running.');
      } else {
        setError('An unexpected error occurred while setting up the request.');
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-gray-800 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-md">
            B
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Station Quality
        </h2>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;