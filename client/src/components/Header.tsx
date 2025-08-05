import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-12">
          <Link to="/" className="text-xs font-bold">
            Badan Meteorologi Klimatologi dan Geofisika
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;