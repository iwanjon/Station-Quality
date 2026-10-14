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



import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CubeIcon,
  SearchIcon,
  StatusOnlineIcon,
  MapIcon,
  WifiIcon,
  MenuIcon,
  LogoutIcon,
  ArchiveIcon,
  ChartSquareBarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/outline';
import { useAuthStore } from '../store/useAuthStore'; // Import your Zustand store
import axiosServer from '../utilities/AxiosServer';

const logoBMKG = 'https://placehold.co/48x48/FFFFFF/1F2937?text=B';

interface NavItem {
  label: string;
  to?: string; // Internal route path (react-router)
  href?: string; // External URL (navigates away from this app)
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

// Base URL of the BMKG equipment inventory system (Project B), configured via env.
const INVENTARIS_ALAT_URL = import.meta.env.VITE_INVENTARIS_ALAT_URL || "";
const WAVEFORM_VIEWER_URL = (
  import.meta.env.VITE_WAVEFORM_VIEWER_URL || ""
).replace(/\/+$/, "");

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', Icon: CubeIcon },
  { label: 'Station quality', to: '/station-quality', Icon: SearchIcon },
  { label: 'Station availability', to: '/station-availability', Icon: StatusOnlineIcon },
  { label: 'Station map', to: '/station-map', Icon: MapIcon },
  { label: 'Station performance', to: '/station-performance', Icon: WifiIcon },
];

// Append the external inventory-system link only when its URL is configured.
if (INVENTARIS_ALAT_URL) {
  navItems.push({ label: 'Inventaris Alat', href: INVENTARIS_ALAT_URL, Icon: ArchiveIcon });
}

const Sidebar: React.FC = () => {
  const [open, setOpen] = useState<boolean>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('sidebar-open') : null;
    return stored === null ? false : stored === 'true';
  });
  
  const [waveformMenuOpen, setWaveformMenuOpen] = useState(false);

  const sidebarRef = useRef<HTMLElement>(null);

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

  const closeSidebar = () => {
    setOpen(false);
    localStorage.setItem('sidebar-open', 'false');
  };

  const sidebarVariants = {
    open: { width: 240, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
    closed: { width: 64, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
  };

  const textVariants = {
    open: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 25 } },
    closed: { opacity: 0, x: -10, transition: { type: "spring" as const, stiffness: 300, damping: 25 } },
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (sidebarRef.current && !sidebarRef.current.contains(target)) {
        closeSidebar();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSidebar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const NavLink: React.FC<{ item: NavItem }> = ({ item }) => {
    const isActive = item.to ? pathname === item.to : false;

    const linkContent = (
      <>
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
      </>
    );

    // External links use a plain anchor (same tab); internal routes use Link.
    if (item.href) {
      return (
        <a
          href={item.href}
          className="group relative flex items-center rounded-lg transition-colors duration-200"
        >
          {linkContent}
        </a>
      );
    }

    return (
      <Link
        to={item.to || '/'}
        className="group relative flex items-center rounded-lg transition-colors duration-200"
      >
        {linkContent}
      </Link>
    );
  };

  return (
    <motion.aside
      ref={sidebarRef}
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
          <NavLink key={item.to || item.href || item.label} item={item} />
        ))}

        {WAVEFORM_VIEWER_URL && (
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (!open) {
                  setOpen(true);
                  localStorage.setItem('sidebar-open', 'true');
                }

                setWaveformMenuOpen((current) => !current);
              }}
              aria-expanded={waveformMenuOpen}
              aria-controls="waveform-viewer-submenu"
              className={`group flex items-center w-full rounded-lg transition-colors duration-200 ${
                waveformMenuOpen
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <div className="flex items-center w-full gap-3 px-3 py-2 rounded-lg">
                <ChartSquareBarIcon className="h-6 w-6 flex-shrink-0" />

                <AnimatePresence>
                  {open && (
                    <motion.span
                      variants={textVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                      className="flex-1 whitespace-nowrap text-left"
                    >
                      Waveform Viewer
                    </motion.span>
                  )}
                </AnimatePresence>

                {open && (
                  waveformMenuOpen ? (
                    <ChevronDownIcon className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 flex-shrink-0" />
                  )
                )}
              </div>

              {!open && (
                <div className="absolute left-full ml-3 px-3 py-2 rounded-md bg-gray-900 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10">
                  Waveform Viewer
                </div>
              )}
            </button>

            {open && waveformMenuOpen && (
              <div
                id="waveform-viewer-submenu"
                className="ml-9 mt-1 space-y-1 border-l border-gray-600 pl-3"
              >
                <a
                  href={`${WAVEFORM_VIEWER_URL}/?mode=fdsn`}
                  className="block rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors duration-200 hover:bg-gray-700 hover:text-white"
                >
                  FDSN
                </a>

                <a
                  href={`${WAVEFORM_VIEWER_URL}/?mode=local`}
                  className="block rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors duration-200 hover:bg-gray-700 hover:text-white"
                >
                  Local File
                </a>
              </div>
            )}
          </div>
        )}
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