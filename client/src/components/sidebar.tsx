import { Link } from 'react-router-dom';

const Sidebar: React.FC = () => (
  <aside className="w-64 h-screen bg-gray-100 p-4 fixed left-0 top-0 flex flex-col gap-4 shadow">
    <nav>
      <ul className="space-y-2">
        <li>
          <Link to="/" className="block py-2 px-4 rounded hover:bg-gray-200">Home</Link>
        </li>
        <li>
          <Link to="/about" className="block py-2 px-4 rounded hover:bg-gray-200">About</Link>
        </li>
        <li>
          <Link to="/station-quality" className="block py-2 px-4 rounded hover:bg-gray-200">Station Quality</Link>
        </li>
      </ul>
    </nav>
  </aside>
);

export default Sidebar;

// import { useState } from 'react'
// import { Link, useLocation } from 'react-router-dom'
// import { motion } from 'framer-motion'
// import {
//   HomeIcon,
//   InformationCircleIcon,
//   SearchIcon,
//   CubeIcon,
//   MapIcon,
//   WifiIcon,
//   MenuIcon,
// } from '@heroicons/react/outline'

// interface NavItem {
//   label: string
//   to: string
//   Icon: typeof HomeIcon
// }

// const navItems: NavItem[] = [
//   { label: 'Dashboard',      to: '/',                 Icon: CubeIcon },
//   { label: 'Station quality',to: '/station-quality',  Icon: SearchIcon },
//   { label: 'Station availability', to: '/station-availability', Icon: CubeIcon /* swap for your icon */ },
//   { label: 'Station map',    to: '/station-map',      Icon: MapIcon },
//   { label: 'Station performance', to: '/station-performance', Icon: WifiIcon },
// ]

// const Sidebar: React.FC = () => {
//   const [open, setOpen] = useState(true)
//   const { pathname } = useLocation()

//   return (
//     <motion.aside
//       animate={{ width: open ? 240 : 64 }}
//       transition={{ type: 'tween', duration: 0.3 }}
//       className="fixed top-0 left-0 h-screen bg-gray-800 text-gray-200 shadow-lg overflow-hidden flex flex-col"
//     >
//       {/* Logo + toggle */}
//       <div className="flex items-center justify-between px-4 h-16 flex-shrink-0">
//         <div className="h-8 w-8 bg-gray-600 rounded-full" />
//         <button
//           onClick={() => setOpen(o => !o)}
//           className="p-2 rounded hover:bg-gray-700 focus:outline-none"
//         >
//           <MenuIcon className="h-6 w-6" />
//         </button>
//       </div>

//       {/* Nav */}
//       <nav className="flex-1 px-2 space-y-1">
//         {navItems.map(({ label, to, Icon }) => {
//           const isActive = pathname === to
//           return (
//             <Link
//               key={to}
//               to={to}
//               className={`
//                 group relative flex items-center gap-3 rounded-md
//                 px-3 py-2 transition-colors duration-200
//                 ${
//                   isActive
//                     ? 'bg-gray-700 text-white'
//                     : 'text-gray-300 hover:bg-gray-700 hover:text-white'
//                 }
//               `}
//             >
//               <Icon className="h-6 w-6 flex-shrink-0" />

//               {/* label when open */}
//               {open && <span className="whitespace-nowrap">{label}</span>}

//               {/* tooltip when closed */}
//               {!open && (
//                 <span className="tooltip absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded bg-gray-900 text-sm opacity-0 group-hover:opacity-100">
//                   {label}
//                 </span>
//               )}
//             </Link>
//           )
//         })}
//       </nav>
//     </motion.aside>
//   )
// }

// export default Sidebar
