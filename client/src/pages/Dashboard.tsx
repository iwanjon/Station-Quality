// Dashboard.tsx

import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "../components/DataTable";
import axiosServer from "../utilities/AxiosServer";
import StatusBadge from "../components/StatusBadge";

ChartJS.register(ArcElement, Tooltip, Legend);

interface QCSummary {
  date: string;
  code: string;
  quality_percentage: number | null;
  result: string;
  details: string;
  network: string;
  geometry: {
    type: string;
    coordinates: [number, number, number];
  };
}

const triangleIcon = (color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 12px solid ${color};"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 12],
  });

// [DIKEMBALIKAN] Helper warna dikembalikan sesuai preferensi Anda
const getColorByQuality = (quality: number | null): string => {
  if (quality === null) return "#6b7280"; // no data
  if (quality >= 80) return "#14532d"; // very good (Hijau Tua)
  if (quality >= 60) return "#22c55e"; // good (Hijau Terang)
  if (quality >= 40) return "#f97316"; // fair (Oranye)
  if (quality >= 20) return "#ef4444"; // poor (Merah)
  return "#6b7280"; // default
};

const getStatusText = (result: string, quality: number | null): string => {
  if (result === 'Mati') return 'Mati';
  if (quality === null) return 'No Data';
  if (quality >= 80) return 'Sangat Baik';
  if (quality >= 60) return 'Baik';
  if (quality >= 40) return 'Cukup';
  return 'Buruk';
};

// [DIUBAH] Komponen legenda peta disesuaikan dengan warna di atas
const MapLegend = () => {
  const legendItems = [
    { color: "#14532d", label: "Sangat Baik" },
    { color: "#22c55e", label: "Baik" },
    { color: "#f97316", label: "Cukup" },
    { color: "#ef4444", label: "Buruk" },
    { color: "#000000", label: "Mati" },
    { color: "#6b7280", label: "No Data" },
  ];

  return (
    <div className="absolute bottom-5 left-5 z-[1000] bg-white/30 p-3 rounded-lg shadow-lg">
      <h3 className="font-bold mb-2 text-sm">Keterangan</h3>
      <ul>
        {legendItems.map((item) => (
          <li key={item.label} className="flex items-center mb-1 text-xs">
            <span
              className="w-3 h-3 inline-block mr-2 rounded-sm"
              style={{ backgroundColor: item.color }}
            ></span>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Dashboard = () => {
  // ... (sisa logika state, useEffect, pieData, dan columns tidak berubah) ...
  const [qcData, setQcData] = useState<QCSummary[]>([]);
  const [loadingQC, setLoadingQC] = useState(true);

  useEffect(() => {
    const today = "2025-06-06";
    axiosServer
      .get<QCSummary[]>(`/api/qc/summary/${today}`)
      .then((res) => setQcData(res.data))
      .finally(() => setLoadingQC(false));
  }, []);

  const totalOn = qcData.filter((s) => s.result !== "Mati").length;
  const totalOff = qcData.filter((s) => s.result === "Mati").length;

  const veryGood = qcData.filter((d) => d.quality_percentage !== null && d.quality_percentage >= 80).length;
  const good = qcData.filter((d) => d.quality_percentage !== null && d.quality_percentage >= 60 && d.quality_percentage < 80).length;
  const fair = qcData.filter((d) => d.quality_percentage !== null && d.quality_percentage >= 40 && d.quality_percentage < 60).length;
  const poor = qcData.filter((d) => d.quality_percentage !== null && d.quality_percentage < 40).length;
  const noData = qcData.filter((d) => d.quality_percentage === null).length;

  const pieData = {
    labels: ["Sangat Baik", "Baik", "Cukup", "Buruk", "No Data"],
    datasets: [
      {
        data: [veryGood, good, fair, poor, noData],
        backgroundColor: ["#22c55e", "#f97316", "#f59e0b", "#ef4444", "#6b7280"],
        borderColor: ["#fff"],
        borderWidth: 2,
      },
    ],
  };

  const columns: ColumnDef<QCSummary>[] = [
    { accessorKey: "code", header: "Kode Stasiun" },
    { accessorKey: "network", header: "Network" },
    {
      accessorKey: "quality_percentage",
      header: "Quality (%)",
      cell: ({ row }) =>
        row.original.quality_percentage !== null ? (
          <span>{row.original.quality_percentage.toFixed(1)}%</span>
        ) : (
          <span className="text-gray-500">-</span>
        ),
    },
    {
      accessorKey: "result",
      header: "Status",
      cell: ({ row }) => {
        const statusText = getStatusText(row.original.result, row.original.quality_percentage);
        return <StatusBadge value={statusText} />;
      },
    },
  ];

  return (
    <MainLayout>
      <h1 className="text-left text-3xl font-bold mt-0 mb-4 ml-8">Dashboard</h1>
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="relative w-full h-[400px]">
          <MapContainer
            center={[-2.5, 118]}
            zoom={5}
            className="w-full h-full rounded-lg"
          >
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {qcData.map((s, idx) => (
              <Marker
                key={idx}
                position={[s.geometry.coordinates[1], s.geometry.coordinates[0]]}
                icon={triangleIcon(
                  s.result === 'Mati'
                    ? '#000000'
                    : getColorByQuality(s.quality_percentage)
                )}
              >
                <Popup>
                  <b>Stasiun: {s.code}</b><br />
                  Status: {getStatusText(s.result, s.quality_percentage)}<br />
                  {s.quality_percentage !== null && `Kualitas: ${s.quality_percentage.toFixed(1)}%`}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          <MapLegend />
        </div>
      </div>
      {/* ...sisa kode GRID BAWAH tidak berubah... */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Data QC Summary</h2>
          {loadingQC ? (
            <p>Memuat data...</p>
          ) : (
            <DataTable columns={columns} data={qcData} />
          )}
        </div>
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
              <h2 className="text-lg font-semibold">Total ON</h2>
              <p className="text-3xl font-bold text-green-600 mt-2">{totalOn}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
              <h2 className="text-lg font-semibold">Total OFF</h2>
              <p className="text-3xl font-bold text-red-600 mt-2">{totalOff}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-4">Summary Status Data</h2>
            <div className="w-[280px] h-[280px]">
              <Pie data={pieData} />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
// import { useEffect, useState } from 'react';
// import MainLayout from '../layouts/MainLayout';
// import axiosInstance from '../utilities/Axios';
// import { Pie } from 'react-chartjs-2';
// import {
//   Chart as ChartJS,
//   ArcElement,
//   Tooltip,
//   Legend,
// } from 'chart.js';

// // Registrasi elemen untuk chart.js
// ChartJS.register(ArcElement, Tooltip, Legend);

// // ✅ Tipe untuk data dari API
// interface StasiunData {
//   aktif: number;
//   mati: number;
// }

// const Dashboard = () => {
//   const [data, setData] = useState<StasiunData | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     axiosInstance
//       .get<StasiunData>('/api/health/') // ✅ tipe response Axios
//       .then((response) => {
//         setData(response.data);
//         setLoading(false);
//       })
//       .catch(() => {
//         setError('Gagal mengambil data');
//         setLoading(false);
//       });
//   }, []);

//   const pieData = {
//     labels: ['Aktif', 'Mati'],
//     datasets: [
//       {
//         label: 'Jumlah',
//         data: data ? [data.aktif, data.mati] : [0, 0], // ✅ berdasarkan data dari API
//         backgroundColor: ['#22c55e', '#f97316'],
//         borderColor: ['#ffffff'],
//         borderWidth: 1,
//       },
//     ],
//   };

//   return (
//     <MainLayout>
//       <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

//       <div className="container mx-auto bg-white shadow-2xl rounded-2xl px-4 py-8">
//         <h2 className="text-xl font-semibold mb-4">Stasiun Saat Ini</h2>

//         {loading && <p>Memuat data...</p>}
//         {error && <p className="text-red-500">{error}</p>}
//         {data && (
//           <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
//             {/* Pie Chart */}
//             <div className="w-[300px] h-[300px]">
//               <Pie data={pieData} />
//             </div>

//             {/* Legend Custom */}
//             <div className="flex flex-col gap-4">
//               {pieData.labels.map((label, index) => (
//                 <div
//                   key={index}
//                   className="flex items-center bg-neutral-200 rounded-full px-4 py-2 shadow-md shadow-black gap-2"
//                 >
//                   <div
//                     className="w-3 h-3 rounded-full"
//                     style={{ backgroundColor: pieData.datasets[0].backgroundColor[index] }}
//                   />
//                   <span className="font-medium">{label}</span>
//                   <span className="ml-auto bg-gray-800 text-white text-xs px-2 py-1 rounded-full">
//                     {pieData.datasets[0].data[index]}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </MainLayout>
//   );
// };

// export default Dashboard;
