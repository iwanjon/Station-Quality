// Sidebar.tsx
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  SearchIcon,
  CubeIcon,
  MapIcon,
  WifiIcon,
  MenuIcon,
  StatusOnlineIcon,
} from '@heroicons/react/outline'

interface NavItem {
  label: string
  to: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const navItems: NavItem[] = [
  { label: 'Dashboard',            to: '/',                   Icon: CubeIcon },
  { label: 'Station quality',      to: '/station-quality',    Icon: SearchIcon },
  { label: 'Station availability', to: '/station-availability', Icon: StatusOnlineIcon },
  { label: 'Station map',          to: '/station-map',        Icon: MapIcon },
  { label: 'Station performance',  to: '/station-performance', Icon: WifiIcon },
]

const Sidebar: React.FC = () => {
  const [open, setOpen] = useState(false)   // start collapsed
  const { pathname } = useLocation()

  return (
    <motion.aside
      animate={{ width: open ? 240 : 64 }}
      transition={{ type: 'tween', duration: 0.25 }}
      className="fixed left-0 top-12 bottom-0 z-50 h-screen bg-gray-800 text-gray-200 shadow-lg overflow-hidden flex flex-col"
    >
      {/* HEADER: logo + burger, with a tooltip when collapsed */}
      <div className="relative group flex items-center h-20 px-4 border-b border-gray-700">
        {/* Logo */}
        <div className="h-12 w-12 bg-gray-600 rounded-full" />

        {/* Burger */}
        <button
          onClick={() => setOpen(o => !o)}
          className="ml-auto p-2 rounded hover:bg-gray-700 focus:outline-none"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          <MenuIcon className="h-6 w-6" />
        </button>

        {/* "Menu" bubble when collapsed */}
        {!open && (
          <span className="
            tooltip absolute left-full top-1/2 -translate-y-1/2 ml-2
            px-2 py-1 rounded bg-gray-900 text-sm opacity-0
            group-hover:opacity-100
          ">
            Menu
          </span>
        )}
      </div>

      {/* NAV ITEMS */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ label, to, Icon }) => {
          const isActive = pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`
                group relative flex items-center gap-3 rounded-md
                px-3 py-2 transition-colors duration-200
                ${
                  isActive
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
              `}
            >
              <Icon className="h-6 w-6 flex-shrink-0" />

              {/* label only when open */}
              {open && <span className="whitespace-nowrap">{label}</span>}

              {/* per-item tooltip when closed */}
              {!open && (
                <span className="
                  tooltip absolute left-full top-1/2 -translate-y-1/2 ml-2
                  px-2 py-1 rounded bg-gray-900 text-sm opacity-0
                  group-hover:opacity-100
                ">
                  {label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </motion.aside>
  )
}

export default Sidebar
