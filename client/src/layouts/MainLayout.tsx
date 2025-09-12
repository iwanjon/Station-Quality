// src/layouts/MainLayout.tsx
import type { ReactNode } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Sidebar from '../components/Sidebar'
interface Props {
  children: ReactNode
  className?: string
}

const MainLayout = ({ children, className }: Props) => {
// const MainLayout = ({ children }: Props) => {
  return (
    <div className="flex min-h-screen">
      <div className='z-50'>
        <Sidebar />
      </div>

      {/* content column */}
      <div className="flex-1 flex flex-col">
        <Header />

      <main className={className || "mx-16 px-4 py-8 bg-gray-100 h-full"}>
        {/* <main className="mx-16 px-4 py-8 bg-gray-100 h-full"> */}
            {children}
        </main>

        <Footer />
      </div>
    </div>
  )
}

export default MainLayout
