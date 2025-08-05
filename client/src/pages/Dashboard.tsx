import { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import axiosInstance from '../utilities/Axios';

const Dashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axiosInstance
      .get('/api/health/')
      .then((response) => {
        setData(response.data);
        setLoading(true);
      })
      .catch((err) => {
        setError('Gagal mengambil data');
        setLoading(false);
      });
  }, []);

  return (
    <MainLayout>
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {data && (
        <div>
          <p>Data: {JSON.stringify(data)}</p>
        </div>
      )}
    </MainLayout>
  );
};

export default Dashboard;
