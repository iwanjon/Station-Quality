import { useState, useEffect } from 'react';

const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date, timeZone?: string) => {
    const timeString = date.toLocaleTimeString('id-ID', {
      timeZone: timeZone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    if (timeZone === 'UTC') {
      return `${timeString} UTC`;
    } else {
      const timeZoneName = date.toLocaleTimeString('id-ID', {
        timeZone: timeZone,
        timeZoneName: 'short'
      }).split(' ').pop();
      return `${timeString} ${timeZoneName}`;
    }
  };

  const utcTime = formatTime(currentTime, 'UTC');
  const localTime = formatTime(currentTime);

  return (
    <>
      <header className="bg-white shadow-md fixed top-0 w-full z-50">
        <div className="max-w-7xl">
          <div className="flex h-12">
            <div className="flex items-center space-x-4 text-xl text-gray-600 px-3 py-1 rounded-lg font-semibold">
              <span>{utcTime}</span>
              <span>|</span>
              <span>{localTime}</span>
            </div>
          </div>
        </div>
      </header>
      <div className="h-12" />
    </>
  );
};

export default Header;

