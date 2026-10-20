import type { ReactNode } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface Props {
  children: ReactNode;
  className?: string;
}

const MainLayout = ({ children, className }: Props) => {
  return (
    <div className="flex min-h-screen">
      <div className="flex-1 min-w-0 flex flex-col">
        <Header />

        <main
          className={
            className || 'mx-16 px-4 py-8 bg-gray-100 h-full min-w-0'
          }
        >
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;