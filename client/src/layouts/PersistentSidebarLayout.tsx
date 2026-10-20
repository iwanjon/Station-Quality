import { Outlet } from 'react-router-dom';
import Sidebar from '../components/sidebar';

const PersistentSidebarLayout = () => {
  return (
    <>
      <Sidebar />
      <Outlet />
    </>
  );
};

export default PersistentSidebarLayout;