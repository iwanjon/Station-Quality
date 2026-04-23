// import { create } from 'zustand';
// import { persist } from 'zustand/middleware';

// interface AuthState {
//   isAuthenticated: boolean;
//   token: string | null;
//   login: (token: string) => void;
//   logout: () => void;
// }

// export const useAuthStore = create<AuthState>()(
//   persist(
//     (set) => ({
//       isAuthenticated: false,
//       token: null,
//       login: (token) => set({ isAuthenticated: true, token }),
//       logout: () => set({ isAuthenticated: false, token: null }),
//     }),
//     {
//       name: 'auth-storage', // This saves the token to localStorage
//     }
//   )
// );


// import { create } from 'zustand';
// import { persist } from 'zustand/middleware';

// // Define the shape of the user object based on your backend response
// export interface User {
//   id: number;
//   username: string;
//   email: string;
//   role_id: number;
// }

// interface AuthState {
//   isAuthenticated: boolean;
//   token: string | null;
//   user: User | null; // Add user to the state
//   login: (token: string, user: User) => void; // Expect both token and user
//   logout: () => void;
// }

// export const useAuthStore = create<AuthState>()(
//   persist(
//     (set) => ({
//       isAuthenticated: false,
//       token: null,
//       user: null, // Initial state is null
      
//       // Update login to save both token and user
//       login: (token, user) => set({ isAuthenticated: true, token, user }),
      
//       // Update logout to clear the user as well
//       logout: () => set({ isAuthenticated: false, token: null, user: null }),
//     }),
//     {
//       name: 'auth-storage', 
//     }
//   )
// );


import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  username: string;
  email: string;
  role_id: number;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null; 
  login: (user: User) => void; // Removed token parameter
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null, 
      
      // Removed token from the set function
      login: (user) => set({ isAuthenticated: true, user }),
      
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'auth-storage', 
    }
  )
);