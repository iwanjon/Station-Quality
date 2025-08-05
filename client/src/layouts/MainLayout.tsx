import type { ReactNode } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

type Props = {
  children: ReactNode;
};

const MainLayout = ({ children }: Props) => {
  return (
    <div className="flex min-h-screen">
      <div className="flex-1">
        <Header />
        <main className="p-4 bg-gray-100 h-full">{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
