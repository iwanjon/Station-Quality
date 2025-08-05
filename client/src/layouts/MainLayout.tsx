// src/layouts/MainLayout.tsx
import type { ReactNode } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Sidebar from '../components/sidebar'

interface Props {
  children: ReactNode
  className?: string
}

const MainLayout = ({ children, className }: Props) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* content column */}
      <div className="flex-1 flex flex-col">
        <Header />

        {/* apply the passed-in className here */}
        <main className={className || 'p-4 bg-gray-100 flex-1'}>
          {children}
        </main>

        <Footer />
      </div>
    </div>
  )
}

export default MainLayout
