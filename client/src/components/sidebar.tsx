// import { useState } from 'react';
// // Asumsikan Anda menggunakan React Router v6
// import { Link, useLocation } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import {
//   CubeIcon,
//   SearchIcon,
//   StatusOnlineIcon,
//   MapIcon,
//   WifiIcon,
//   MenuIcon,
// } from '@heroicons/react/outline';

// // Ganti dengan path logo Anda yang sebenarnya
// // import logoBMKG from '../assets/logo_bmkg.png';
// const logoBMKG = 'https://placehold.co/48x48/FFFFFF/1F2937?text=B';

// // Tipe untuk item navigasi
// interface NavItem {
//   label: string;
//   to: string;
//   Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
// }

// // Mengembalikan item navigasi ke versi asli
// const navItems: NavItem[] = [
//   { label: 'Dashboard', to: '/', Icon: CubeIcon },
//   { label: 'Station quality', to: '/station-quality', Icon: SearchIcon },
//   { label: 'Station availability', to: '/station-availability', Icon: StatusOnlineIcon },
//   { label: 'Station map', to: '/station-map', Icon: MapIcon },
//   { label: 'Station performance', to: '/station-performance', Icon: WifiIcon },
// ];

// const Sidebar: React.FC = () => {
//   // Inisialisasi dari localStorage agar state tetap persisten saat pindah page.
//   // Default: tertutup (false). Hanya tombol burger yang mengubah nilai ini.
//   const [open, setOpen] = useState<boolean>(() => {
//     const stored = typeof window !== 'undefined' ? localStorage.getItem('sidebar-open') : null;
//     return stored === null ? false : stored === 'true';
//   });
//   const { pathname } = useLocation();

//   // Mengembalikan ukuran sidebar ke versi asli
//   const sidebarVariants = {
//     open: { width: 240, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
//     closed: { width: 64, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
//   };

//   const textVariants = {
//     open: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 25 } },
//     closed: { opacity: 0, x: -10, transition: { type: "spring" as const, stiffness: 300, damping: 25 } },
//   };

//   const NavLink: React.FC<{ item: NavItem }> = ({ item }) => {
//     const isActive = pathname === item.to;
//     return (
//       <Link
//         to={item.to}
//         className="group relative flex items-center rounded-lg transition-colors duration-200"
//       >
//         <div
//           className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
//             isActive
//               ? 'bg-gray-700 text-white'
//               : 'text-gray-300 hover:bg-gray-700 hover:text-white'
//           }`}
//         >
//           <item.Icon className="h-6 w-6 flex-shrink-0" />
//           <AnimatePresence>
//             {open && (
//               <motion.span
//                 variants={textVariants}
//                 initial="closed"
//                 animate="open"
//                 exit="closed"
//                 className="whitespace-nowrap"
//               >
//                 {item.label}
//               </motion.span>
//             )}
//           </AnimatePresence>
//         </div>
//         {/* Tooltip saat sidebar ditutup */}
//         {!open && (
//           <div className="absolute left-full ml-3 px-3 py-2 rounded-md bg-gray-900 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10">
//             {item.label}
//           </div>
//         )}
//       </Link>
//     );
//   };

//   return (
//     <motion.aside
//       variants={sidebarVariants}
//       // jangan gunakan initial yang memaksa terbuka — gunakan state atau closed
//       initial={open ? 'open' : 'closed'}
//       animate={open ? 'open' : 'closed'}
//       className="fixed top-12 left-0 bottom-0 z-50 bg-gray-800 text-white flex flex-col shadow-lg"
//     >
//       {/* Header Sidebar */}
//       <div className="relative group flex items-center h-20 px-4 border-b border-gray-700">
//         <AnimatePresence>
//           {open && (
//             <motion.div
//               variants={textVariants}
//               initial="closed"
//               animate="open"
//               exit="closed"
//               className="flex items-center"
//             >
//               <img src={logoBMKG} alt="BMKG Logo" className="h-10 w-10 rounded-full" />
//             </motion.div>
//           )}
//         </AnimatePresence>
//         <button
//           onClick={() => setOpen(!open)}
//           className={`p-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white transition-colors ${
//             open ? 'ml-auto' : 'mx-auto'
//           }`}
//           aria-label={open ? 'Close menu' : 'Open menu'}
//         >
//           <MenuIcon className="h-6 w-6" />
//         </button>
//       </div>

//       {/* Navigasi */}
//       <nav className="flex-1 px-2 py-4 space-y-2">
//         {navItems.map(item => (
//           <NavLink key={item.to} item={item} />
//         ))}
//       </nav>
//     </motion.aside>
//   );
// };

// export default Sidebar;



import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CubeIcon,
  SearchIcon,
  StatusOnlineIcon,
  MapIcon,
  WifiIcon,
  MenuIcon,
  LogoutIcon, // Added LogoutIcon
} from '@heroicons/react/outline';
import { useAuthStore } from '../store/useAuthStore'; // Import your Zustand store
import axiosServer from '../utilities/AxiosServer';

const logoBMKG = 'https://placehold.co/48x48/FFFFFF/1F2937?text=B';

interface NavItem {
  label: string;
  to: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', Icon: CubeIcon },
  { label: 'Station quality', to: '/station-quality', Icon: SearchIcon },
  { label: 'Station availability', to: '/station-availability', Icon: StatusOnlineIcon },
  { label: 'Station map', to: '/station-map', Icon: MapIcon },
  { label: 'Station performance', to: '/station-performance', Icon: WifiIcon },
];

const Sidebar: React.FC = () => {
  const [open, setOpen] = useState<boolean>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('sidebar-open') : null;
    return stored === null ? false : stored === 'true';
  });
  
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout); // Grab the logout function

  // const handleLogout = () => {
  //   logout();
  //   navigate('/login');
  // };

  const handleLogout = async () => {
      try {
        // 1. Tell the backend to clear the httpOnly cookie
        // Adjust the endpoint path if your logout route is different
        await axiosServer.post('/api/user/logout'); 
      } catch (error) {
        console.error('Failed to logout on server:', error);
      } finally {
        // 2. Always clear the local Zustand state and redirect, 
        // even if the server request fails (fallback)
        logout();
        navigate('/login');
      }
    };


  const sidebarVariants = {
    open: { width: 240, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
    closed: { width: 64, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
  };

  const textVariants = {
    open: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 25 } },
    closed: { opacity: 0, x: -10, transition: { type: "spring" as const, stiffness: 300, damping: 25 } },
  };

  const NavLink: React.FC<{ item: NavItem }> = ({ item }) => {
    const isActive = pathname === item.to;
    return (
      <Link
        to={item.to}
        className="group relative flex items-center rounded-lg transition-colors duration-200"
      >
        <div
          className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
            isActive
              ? 'bg-gray-700 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <item.Icon className="h-6 w-6 flex-shrink-0" />
          <AnimatePresence>
            {open && (
              <motion.span
                variants={textVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {!open && (
          <div className="absolute left-full ml-3 px-3 py-2 rounded-md bg-gray-900 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10">
            {item.label}
          </div>
        )}
      </Link>
    );
  };

  return (
    <motion.aside
      variants={sidebarVariants}
      initial={open ? 'open' : 'closed'}
      animate={open ? 'open' : 'closed'}
      className="fixed top-12 left-0 bottom-0 z-50 bg-gray-800 text-white flex flex-col shadow-lg"
    >
      {/* Header Sidebar */}
      <div className="relative group flex items-center h-20 px-4 border-b border-gray-700 flex-shrink-0">
        <AnimatePresence>
          {open && (
            <motion.div
              variants={textVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="flex items-center"
            >
              <img src={logoBMKG} alt="BMKG Logo" className="h-10 w-10 rounded-full" />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => {
            const newState = !open;
            setOpen(newState);
            localStorage.setItem('sidebar-open', String(newState));
          }}
          className={`p-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white transition-colors ${
            open ? 'ml-auto' : 'mx-auto'
          }`}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Navigasi */}
      <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto overflow-x-hidden border-b border-gray-700">
        {navItems.map(item => (
          <NavLink key={item.to} item={item} />
        ))}
      </nav>

      {/* Logout Button (Pinned to bottom) */}
      <div className="p-2 flex-shrink-0 mb-2">
        <button
          onClick={handleLogout}
          className="group relative flex items-center w-full rounded-lg transition-colors duration-200 text-gray-300 hover:bg-red-600 hover:text-white"
        >
          <div className="flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-colors duration-200">
            <LogoutIcon className="h-6 w-6 flex-shrink-0" />
            <AnimatePresence>
              {open && (
                <motion.span
                  variants={textVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="whitespace-nowrap font-medium"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          {/* Tooltip for when sidebar is closed */}
          {!open && (
            <div className="absolute left-full ml-3 px-3 py-2 rounded-md bg-gray-900 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10">
              Logout
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
