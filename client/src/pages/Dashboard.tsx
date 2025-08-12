import { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import axiosInstance from '../utilities/Axios';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

// Registrasi elemen untuk chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

// ✅ Tipe untuk data dari API
interface StasiunData {
  aktif: number;
  mati: number;
}

const Dashboard = () => {
  const [data, setData] = useState<StasiunData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axiosInstance
      .get<StasiunData>('/api/health/') // ✅ tipe response Axios
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Gagal mengambil data');
        setLoading(false);
      });
  }, []);

  const pieData = {
    labels: ['Aktif', 'Mati'],
    datasets: [
      {
        label: 'Jumlah',
        data: data ? [data.aktif, data.mati] : [0, 0], // ✅ berdasarkan data dari API
        backgroundColor: ['#22c55e', '#f97316'],
        borderColor: ['#ffffff'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <MainLayout>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <div className="container mx-auto bg-white shadow-2xl rounded-2xl px-4 py-8">
        <h2 className="text-xl font-semibold mb-4">Stasiun Saat Ini</h2>

        {loading && <p>Memuat data...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {data && (
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Pie Chart */}
            <div className="w-[300px] h-[300px]">
              <Pie data={pieData} />
            </div>

            {/* Legend Custom */}
            <div className="flex flex-col gap-4">
              {pieData.labels.map((label, index) => (
                <div
                  key={index}
                  className="flex items-center bg-neutral-200 rounded-full px-4 py-2 shadow-md shadow-black gap-2"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: pieData.datasets[0].backgroundColor[index] }}
                  />
                  <span className="font-medium">{label}</span>
                  <span className="ml-auto bg-gray-800 text-white text-xs px-2 py-1 rounded-full">
                    {pieData.datasets[0].data[index]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;
