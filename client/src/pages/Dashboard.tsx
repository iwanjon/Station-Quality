// Dashboard.tsx

import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axiosServer from "../utilities/AxiosServer";
import dayjs from "dayjs"; // Tambahkan import ini di bagian atas

// [TETAP] Interface data tidak berubah
interface QCSummary {
  date: string;
  code: string;
  quality_percentage: number | null;
  result: string;
  site_quality: string | null;
  details: string;
  network: string;
  geometry: {
    type: string;
    coordinates: [number, number, number];
  };
}

// [TETAP] Fungsi untuk ikon segitiga di peta
// [DIPERBARUI] Fungsi ikon segitiga sesuai kode Anda
const triangleIcon = (color: string) =>
  L.divIcon({
    className: "",
    html: `
      <div style="
        width: 0; 
        height: 0; 
        border-left: 6px solid transparent; 
        border-right: 6px solid transparent; 
        border-bottom: 12px solid ${color};
        position: relative;
      ">
        <div style="
          position: absolute;
          left: -7px; top: -1px;
          width: 0; height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-bottom: 14px solid #222; /* lineart lebih tebal */
          z-index: -1;
        "></div>
      </div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 14],
  });
  
// [DIPERBARUI] Teks status disesuaikan dengan skema warna baru
const getStatusText = (result: string, quality: number | null): string => {
  if (result === 'Mati') return 'Mati';
  if (quality === null) return 'No Data';
  if (quality >= 80) return 'Sangat Baik';
  if (quality >= 60) return 'Baik';
  if (quality >= 40) return 'Cukup';
  return 'Buruk';
};

// Ubah nama LatencyLegend menjadi MapLegend dan pindahkan ke kiri bawah
const MapLegend = ({ qcData }: { qcData: QCSummary[] }) => {
  // Hanya tampilkan label waktu, tanpa teks kualitas
  const summary = [
    {
      label: "<10s",
      color: "bg-teal-500",
      textColor: "text-teal-600",
      count: qcData.filter(s => s.site_quality === "Very Good" && s.result !== "Mati").length,
    },
    {
      label: "<1m",
      color: "bg-yellow-400",
      textColor: "text-yellow-500",
      count: qcData.filter(s => s.site_quality === "Good" && s.result !== "Mati").length,
    },
    {
      label: "<3m",
      color: "bg-orange-400",
      textColor: "text-orange-500",
      count: qcData.filter(s => s.site_quality === "Fair" && s.result !== "Mati").length,
    },
    {
      label: "<30m",
      color: "bg-red-500",
      textColor: "text-red-600",
      count: qcData.filter(s => s.site_quality === "Poor" && s.result !== "Mati").length,
    },
    {
      label: "<1d",
      color: "bg-gray-400",
      textColor: "text-gray-500",
      count: qcData.filter(s => (!s.site_quality || s.site_quality === "Null") && s.result !== "Mati").length,
    },
    {
      label: ">1d",
      color: "bg-gray-700",
      textColor: "text-gray-800",
      count: qcData.filter(s => s.result === "Mati").length,
    },
  ];

  const total = summary.reduce((acc, cur) => acc + cur.count, 0);
  const maxCount = Math.max(...summary.map(s => s.count), 1);

  return (
    <div className="absolute bottom-5 left-5 z-[1000] bg-white/50 p-4 rounded-xl shadow-lg w-64">
      <div className="font-semibold text-gray-800 text-base mb-1">Summary Status</div>
      <div className="mb-3 text-sm">
        <span className="font-bold">Total:</span> {total}
      </div>
      <div className="flex flex-col gap-2.5">
        {summary.map((item) => (
          <div key={item.label} className="grid grid-cols-[3rem_1fr_2rem] items-center gap-x-2">
            <span className="text-xs text-gray-600 font-medium">{item.label}</span>
            <div
              className={`${item.color} h-3.5 rounded-sm`}
              style={{
                width: `${(item.count / maxCount) * 100}%`,
                minWidth: item.count > 0 ? '4px' : '0',
                transition: "width 0.3s ease-in-out",
              }}
            ></div>
            <span className={`text-sm font-bold justify-self-start ${item.textColor}`}>
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// [BARU] Komponen Kartu untuk panel bawah (sebagai placeholder)
const InfoCard = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="bg-white rounded-xl shadow p-4 min-h-[300px] flex flex-col">
        <h2 className="text-lg font-bold border-b pb-2 mb-4">{title}</h2>
        <div className="flex-grow flex items-center justify-center text-gray-400">
           {children ? children : <p>Konten untuk {title} akan ditampilkan di sini.</p>}
        </div>
        <a href="#" className="text-sm text-blue-600 hover:underline mt-auto text-right">Details...</a>
    </div>
);

// Mapping warna konsisten untuk legend dan triangle
// const getColorBySiteQuality = (result: string, site_quality: string | null): string => {
//   if (result === 'Mati') return "#374151"; // bg-gray-700
//   if (!site_quality || site_quality === "Null") return "#979797"; 
//   if (site_quality === "Very Good") return "#14b8a6"; // bg-teal-500
//   if (site_quality === "Good") return "#facc15"; // bg-yellow-400
//   if (site_quality === "Fair") return "#fb923c"; // bg-orange-400
//   if (site_quality === "Poor") return "#ef4444"; // bg-red-500
//   return "#818cf8";
// };

// Mapping warna dan label triangle berdasarkan result
const getColorByResult = (result: string): string => {
  switch (result) {
    case "Baik": return "#14b8a6"; // Good - teal
    case "Cukup Baik": return "#fb923c"; // Fair - orange
    case "Buruk": return "#ef4444"; // Bad - red
    case "No Data": return "#818cf8"; // Mati/No Data - indigo
    case "Mati": return "#374151"; // Mati/Off - gray
    default: return "#979797";
  }
};

const getStatusTextEn = (result: string): string => {
  switch (result) {
    case "Baik": return "Good";
    case "Cukup Baik": return "Fair";
    case "Buruk": return "Bad";
    case "No Data": return "No Data";
    case "Mati": return "Mati";
    default: return result;
  }
};

const Dashboard = () => {
  const [qcData, setQcData] = useState<QCSummary[]>([]);
  // State lain yang mungkin dibutuhkan nanti
  // const [loadingQC, setLoadingQC] = useState(true);

  useEffect(() => {
    // Ambil data QC summary untuk tanggal kemarin (bukan tanggal fix)
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    axiosServer
      .get<QCSummary[]>(`/api/qc/summary/${yesterday}`)
      .then((res) => setQcData(res.data))
      .catch(err => console.error("Gagal memuat data QC:", err));
      // .finally(() => setLoadingQC(false));
  }, []);

  // [DISEMPURNAKAN] Kalkulasi data untuk panel status (angka-angka ini bisa di-hardcode dulu)
  const totalRegistered = 553;
  const totalInactive = 4;
  const totalOperational = 549;
  const totalOn = 516;
  const totalOff = 33;
  
  // Hitung jumlah stasiun berdasarkan result (menggunakan data yang sama dengan map)
  const goodCount = qcData.filter(s => s.result === "Baik").length;
  const fairCount = qcData.filter(s => s.result === "Cukup Baik").length;
  const badCount = qcData.filter(s => s.result === "Buruk").length;
  const noDataCount = qcData.filter(s => s.result === "No Data" || s.result === "Mati").length;


  return (
    <MainLayout>
      <h1 className="text-left text-3xl font-bold mt-0 mb-4 ml-2">Dashboard</h1>
      <div className="flex flex-col lg:flex-row gap-6">

        {/* BAGIAN KIRI: PETA */}
        <div className="lg:w-2/3 w-full">
           <div className="bg-white rounded-xl shadow p-2 h-[600px]">
             <div className="relative w-full h-full">
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
                      icon={triangleIcon(getColorByResult(s.result))}
                    >
                      <Popup>
                        <b>Stasiun: {s.code}</b><br />
                        Status: {getStatusTextEn(s.result)}<br />
                        {s.quality_percentage !== null && `Kualitas: ${s.quality_percentage.toFixed(1)}%`}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
                <MapLegend qcData={qcData} />
              </div>
           </div>
        </div>

        {/* BAGIAN KANAN: PANEL STATUS */}
        <div className="lg:w-1/3 w-full flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-200 rounded-lg p-4 text-center">
                    <p className="text-sm font-semibold text-gray-600">REGISTERED</p>
                    <p className="text-4xl font-bold"> {totalRegistered} </p>
                </div>
                <div className="bg-gray-200 rounded-lg p-4 text-center">
                    <p className="text-sm font-semibold text-gray-600">INACTIVE</p>
                    <p className="text-4xl font-bold"> {totalInactive} </p>
                </div>
            </div>

            <div className="bg-white rounded-lg p-4 text-center border-2 border-black shadow-lg">
                <p className="text-sm font-semibold">OPERATIONAL</p>
                <p className="text-5xl font-bold mb-2"> {totalOperational} </p>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-green-600 text-white rounded p-2">
                        <p className="text-xs font-bold">ON</p>
                        <p className="text-2xl font-bold"> {totalOn} </p>
                    </div>
                    <div className="bg-black text-white rounded p-2">
                        <p className="text-xs font-bold">OFF</p>
                        <p className="text-2xl font-bold"> {totalOff} </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-white text-xs font-bold">
                <div className="bg-green-500 rounded p-2">
                    <p>GOOD</p>
                    <p className="text-xl">{goodCount}</p>
                </div>
                <div className="bg-orange-400 rounded p-2">
                    <p>FAIR</p>
                    <p className="text-xl">{fairCount}</p>
                </div>
                <div className="bg-red-600 rounded p-2">
                    <p>BAD</p>
                    <p className="text-xl">{badCount}</p>
                </div>
                <div className="bg-gray-400 rounded p-2">
                    <p>NO DATA</p>
                    <p className="text-xl">{noDataCount}</p>
                </div>
            </div>
        </div>
      </div>

      {/* [BARU] BAGIAN BAWAH: 4 KARTU INFORMASI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <InfoCard title="Availability">
            {/* Nanti bisa diisi chart atau data */}
        </InfoCard>
        <InfoCard title="Quality">
            {/* Nanti bisa diisi chart atau data */}
        </InfoCard>
        <InfoCard title="Performance">
            {/* Nanti bisa diisi chart atau data */}
        </InfoCard>
        <InfoCard title="Metadata">
            {/* Contoh isi untuk metadata */}
            <div className="text-left text-white w-full text-sm">
                <p className="font-semibold mb-2">Recent updates:</p>
                <ul className="list-disc list-inside">
                    <li>MMPI</li>
                    <li>MTKI</li>
                    <li>SPSI</li>
                    <li>JMBI</li>
                </ul>
            </div>
        </InfoCard>
      </div>

    </MainLayout>
  );
};

export default Dashboard;

// Dashboard.tsx

// import { useEffect, useState } from "react";
// import MainLayout from "../layouts/MainLayout";
// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";
// import axiosServer from "../utilities/AxiosServer";
// import dayjs from "dayjs"; // Tambahkan import ini di bagian atas

// // [TETAP] Interface data tidak berubah
// interface QCSummary {
//   date: string;
//   code: string;
//   quality_percentage: number | null;
//   result: string;
//   site_quality: string | null;
//   details: string;
//   network: string;
//   geometry: {
//     type: string;
//     coordinates: [number, number, number];
//   };
// }

// // [BARU] Interface untuk data stasiun dari database
// interface Stasiun {
//   stasiun_id: number;
//   kode_stasiun: string;
//   status: string; // Kolom kunci: 'aktif' atau 'NONaktif'
//   // Anda bisa tambahkan properti lain jika dibutuhkan
// }

// interface QCDetail {
//     id: string;
//     code: string;
//     date: string;
//     channel: string;
//     availability: string; // Kunci untuk menentukan status ON/OFF
// }

// // [TETAP] Fungsi untuk ikon segitiga di peta
// // [DIPERBARUI] Fungsi ikon segitiga sesuai kode Anda
// const triangleIcon = (color: string) =>
//   L.divIcon({
//     className: "",
//     html: `
//       <div style="
//         width: 0; 
//         height: 0; 
//         border-left: 6px solid transparent; 
//         border-right: 6px solid transparent; 
//         border-bottom: 12px solid ${color};
//         position: relative;
//       ">
//         <div style="
//           position: absolute;
//           left: -7px; top: -1px;
//           width: 0; height: 0;
//           border-left: 7px solid transparent;
//           border-right: 7px solid transparent;
//           border-bottom: 14px solid #222; /* lineart lebih tebal */
//           z-index: -1;
//         "></div>
//       </div>
//     `,
//     iconSize: [14, 14],
//     iconAnchor: [7, 14],
//   });

// // Ubah nama LatencyLegend menjadi MapLegend dan pindahkan ke kiri bawah
// const MapLegend = ({ qcData }: { qcData: QCSummary[] }) => {
//   // Hanya tampilkan label waktu, tanpa teks kualitas
//   const summary = [
//     {
//       label: "<10s",
//       color: "bg-teal-500",
//       textColor: "text-teal-600",
//       count: qcData.filter(s => s.site_quality === "Very Good" && s.result !== "Mati").length,
//     },
//     {
//       label: "<1m",
//       color: "bg-yellow-400",
//       textColor: "text-yellow-500",
//       count: qcData.filter(s => s.site_quality === "Good" && s.result !== "Mati").length,
//     },
//     {
//       label: "<3m",
//       color: "bg-orange-400",
//       textColor: "text-orange-500",
//       count: qcData.filter(s => s.site_quality === "Fair" && s.result !== "Mati").length,
//     },
//     {
//       label: "<30m",
//       color: "bg-red-500",
//       textColor: "text-red-600",
//       count: qcData.filter(s => s.site_quality === "Poor" && s.result !== "Mati").length,
//     },
//     {
//       label: "<1d",
//       color: "bg-gray-400",
//       textColor: "text-gray-500",
//       count: qcData.filter(s => (!s.site_quality || s.site_quality === "Null") && s.result !== "Mati").length,
//     },
//     {
//       label: ">1d",
//       color: "bg-gray-700",
//       textColor: "text-gray-800",
//       count: qcData.filter(s => s.result === "Mati").length,
//     },
//   ];

//   const total = summary.reduce((acc, cur) => acc + cur.count, 0);
//   const maxCount = Math.max(...summary.map(s => s.count), 1);

//   return (
//     <div className="absolute bottom-5 left-5 z-[1000] bg-white/50 p-4 rounded-xl shadow-lg w-64">
//       <div className="font-semibold text-gray-800 text-base mb-1">Summary Status</div>
//       <div className="mb-3 text-sm">
//         <span className="font-bold">Total:</span> {total}
//       </div>
//       <div className="flex flex-col gap-2.5">
//         {summary.map((item) => (
//           <div key={item.label} className="grid grid-cols-[3rem_1fr_2rem] items-center gap-x-2">
//             <span className="text-xs text-gray-600 font-medium">{item.label}</span>
//             <div
//               className={`${item.color} h-3.5 rounded-sm`}
//               style={{
//                 width: `${(item.count / maxCount) * 100}%`,
//                 minWidth: item.count > 0 ? '4px' : '0',
//                 transition: "width 0.3s ease-in-out",
//               }}
//             ></div>
//             <span className={`text-sm font-bold justify-self-start ${item.textColor}`}>
//               {item.count}
//             </span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// // [BARU] Komponen Kartu untuk panel bawah (sebagai placeholder)
// const InfoCard = ({ title, children }: { title: string, children?: React.ReactNode }) => (
//     <div className="bg-white rounded-xl shadow p-4 min-h-[300px] flex flex-col">
//         <h2 className="text-lg font-bold border-b pb-2 mb-4">{title}</h2>
//         <div className="flex-grow flex items-center justify-center text-gray-400">
//            {children ? children : <p>Konten untuk {title} akan ditampilkan di sini.</p>}
//         </div>
//         <a href="#" className="text-sm text-blue-600 hover:underline mt-auto text-right">Details...</a>
//     </div>
// );


// // Mapping warna dan label triangle berdasarkan result
// const getColorByResult = (result: string): string => {
//   switch (result) {
//     case "Baik": return "#14b8a6"; // Good - teal
//     case "Cukup Baik": return "#fb923c"; // Fair - orange
//     case "Buruk": return "#ef4444"; // Bad - red
//     case "No Data": return "#818cf8"; // Mati/No Data - indigo
//     case "Mati": return "#374151"; // Mati/Off - gray
//     default: return "#979797";
//   }
// };

// const getStatusTextEn = (result: string): string => {
//   switch (result) {
//     case "Baik": return "Good";
//     case "Cukup Baik": return "Fair";
//     case "Buruk": return "Bad";
//     case "No Data": return "No Data";
//     case "Mati": return "Mati";
//     default: return result;
//   }
// };

// const Dashboard = () => {
//   const [qcData, setQcData] = useState<QCSummary[]>([]);
//   const [stations, setStations] = useState<Stasiun[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [onOffCounts, setOnOffCounts] = useState({ on: 0, off: 0 });
//   const [isLoadingOnOff, setIsLoadingOnOff] = useState(true);

//   useEffect(() => {
//     const fetchInitialData = async () => {
//       setLoading(true);
//       try {
//         const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");

//         const [qcResponse, stationsResponse] = await Promise.all([
//           axiosServer.get<QCSummary[]>(`/api/qc/summary/${yesterday}`),
//           axiosServer.get<Stasiun[]>("/api/stasiun"),
//         ]);

//         setQcData(qcResponse.data);
//         setStations(stationsResponse.data);
//       } catch (error) {
//         console.error("Gagal memuat data dashboard awal:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchInitialData();
//   }, []); // Dependency kosong, hanya berjalan sekali saat komponen dimuat

//   // Ini akan berjalan setelah qcData terisi
//   useEffect(() => {
//     if (qcData.length === 0) return;

//     const fetchDetailsAndCountOnOff = async () => {
//       setIsLoadingOnOff(true);
//       const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");

//       // Buat array of promises untuk mengambil data detail semua stasiun
//       const promises = qcData.map(station =>
//         axiosServer.get<QCDetail[]>(`/api/qc/data/detail/${station.code}/${yesterday}`)
//       );

//       try {
//         const results = await Promise.all(promises);
        
//         let onCount = 0;
//         let offCount = 0;

//         results.forEach(response => {
//           const stationDetails = response.data;
          
//           // Cek jika data detail ada dan merupakan array
//           if (Array.isArray(stationDetails) && stationDetails.length > 0) {
//             // Stasiun dianggap OFF jika SEMUA channelnya punya availability 0.
//             const isOff = stationDetails.every(
//               channel => parseFloat(channel.availability) === 0
//             );

//             if (isOff) {
//               offCount++;
//             } else {
//               onCount++;
//             }
//           } else {
//             // Jika tidak ada data detail, anggap OFF atau sesuai logika bisnis
//             offCount++;
//           }
//         });
        
//         setOnOffCounts({ on: onCount, off: offCount });

//       } catch (error) {
//         console.error("Gagal mengambil data detail untuk status ON/OFF:", error);
//         // Jika gagal, set ke nol agar tidak menampilkan angka yang salah
//         setOnOffCounts({ on: 0, off: 0 });
//       } finally {
//         setIsLoadingOnOff(false);
//       }
//     };

//     fetchDetailsAndCountOnOff();
//   }, [qcData]); // Dependency: Jalankan hook ini setiap kali qcData berubah

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");

//         const [qcResponse, stationsResponse] = await Promise.all([
//           axiosServer.get<QCSummary[]>(`/api/qc/summary/${yesterday}`),
//           axiosServer.get<Stasiun[]>("/api/stasiun"), // Ambil data stasiun
//         ]);

//         setQcData(qcResponse.data);
//         setStations(stationsResponse.data); // Simpan data stasiun ke state
//       } catch (error) {
//         console.error("Gagal memuat data dashboard:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []); // Dependency array kosong agar hanya berjalan sekali

//   // [DIUBAH] Kalkulasi data tidak lagi hard-coded
//   const totalRegistered = stations.length;
//   const totalInactive = stations.filter(
//     (s) => s.status.toLowerCase() === "nonaktif"
//   ).length;
//   const totalOperational = stations.filter(
//     (s) => s.status.toLowerCase() === "aktif"
//   ).length;
  
//   useEffect(() => {
//     // Ambil data QC summary untuk tanggal kemarin (bukan tanggal fix)
//     const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
//     axiosServer
//       .get<QCSummary[]>(`/api/qc/summary/${yesterday}`)
//       .then((res) => setQcData(res.data))
//       .catch(err => console.error("Gagal memuat data QC:", err));
//       // .finally(() => setLoadingQC(false));
//   }, []);

//   // Hitung jumlah stasiun berdasarkan result (menggunakan data yang sama dengan map)
//   const goodCount = qcData.filter(s => s.result === "Baik").length;
//   const fairCount = qcData.filter(s => s.result === "Cukup Baik").length;
//   const badCount = qcData.filter(s => s.result === "Buruk").length;
//   const noDataCount = qcData.filter(s => s.result === "No Data" || s.result === "Mati").length;


//   return (
//     <MainLayout>
//       <h1 className="text-left text-3xl font-bold mt-0 mb-4 ml-2">Dashboard</h1>
//       <div className="flex flex-col lg:flex-row gap-6">

//         {/* BAGIAN KIRI: PETA */}
//         <div className="lg:w-2/3 w-full">
//            <div className="bg-white rounded-xl shadow p-2 h-[600px]">
//              <div className="relative w-full h-full">
//                 <MapContainer
//                   center={[-2.5, 118]}
//                   zoom={5}
//                   className="w-full h-full rounded-lg"
//                 >
//                   <TileLayer
//                     attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
//                     url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                   />
//                   {qcData.map((s, idx) => (
//                     <Marker
//                       key={idx}
//                       position={[s.geometry.coordinates[1], s.geometry.coordinates[0]]}
//                       icon={triangleIcon(getColorByResult(s.result))}
//                     >
//                       <Popup>
//                         <b>Stasiun: {s.code}</b><br />
//                         Status: {getStatusTextEn(s.result)}<br />
//                         {s.quality_percentage !== null && `Kualitas: ${s.quality_percentage.toFixed(1)}%`}
//                       </Popup>
//                     </Marker>
//                   ))}
//                 </MapContainer>
//                 <MapLegend qcData={qcData} />
//               </div>
//            </div>
//         </div>

//         {/* BAGIAN KANAN: PANEL STATUS */}
//        <div className="lg:w-1/3 w-full flex flex-col gap-4">
//           <div className="grid grid-cols-2 gap-4">
//             <div className="bg-gray-200 rounded-lg p-4 text-center">
//               <p className="text-sm font-semibold text-gray-600">REGISTERED</p>
//               {/* [DIUBAH] Menggunakan variabel dinamis */}
//               <p className="text-4xl font-bold"> {loading ? '...' : totalRegistered} </p>
//             </div>
//             <div className="bg-gray-200 rounded-lg p-4 text-center">
//               <p className="text-sm font-semibold text-gray-600">INACTIVE</p>
//               {/* [DIUBAH] Menggunakan variabel dinamis */}
//               <p className="text-4xl font-bold"> {loading ? '...' : totalInactive} </p>
//             </div>
//           </div>

//             <div className="bg-white rounded-lg p-4 text-center border-2 border-black shadow-lg">
//                 <p className="text-sm font-semibold">OPERATIONAL</p>
//                 <p className="text-5xl font-bold mb-2"> {loading ? '...' : totalOperational} </p>
//                 <div className="grid grid-cols-2 gap-2">
//                     <div className="bg-green-600 text-white rounded p-2">
//                         <p className="text-xs font-bold">ON</p>
//                         {/* [DIUBAH] Menggunakan state dinamis dengan loading */}
//                         <p className="text-2xl font-bold"> {isLoadingOnOff ? '...' : onOffCounts.on} </p>
//                     </div>
//                     <div className="bg-black text-white rounded p-2">
//                         <p className="text-xs font-bold">OFF</p>
//                         {/* [DIUBAH] Menggunakan state dinamis dengan loading */}
//                         <p className="text-2xl font-bold"> {isLoadingOnOff ? '...' : onOffCounts.off} </p>
//                     </div>
//                 </div>
//             </div>

//             <div className="grid grid-cols-4 gap-2 text-center text-white text-xs font-bold">
//                 <div className="bg-green-500 rounded p-2">
//                     <p>GOOD</p>
//                     <p className="text-xl">{goodCount}</p>
//                 </div>
//                 <div className="bg-orange-400 rounded p-2">
//                     <p>FAIR</p>
//                     <p className="text-xl">{fairCount}</p>
//                 </div>
//                 <div className="bg-red-600 rounded p-2">
//                     <p>BAD</p>
//                     <p className="text-xl">{badCount}</p>
//                 </div>
//                 <div className="bg-gray-400 rounded p-2">
//                     <p>NO DATA</p>
//                     <p className="text-xl">{noDataCount}</p>
//                 </div>
//             </div>
//         </div>
//       </div>

//       {/* [BARU] BAGIAN BAWAH: 4 KARTU INFORMASI */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
//         <InfoCard title="Availability">
//             {/* Nanti bisa diisi chart atau data */}
//         </InfoCard>
//         <InfoCard title="Quality">
//             {/* Nanti bisa diisi chart atau data */}
//         </InfoCard>
//         <InfoCard title="Performance">
//             {/* Nanti bisa diisi chart atau data */}
//         </InfoCard>
//         <InfoCard title="Metadata">
//             {/* Contoh isi untuk metadata */}
//             <div className="text-left text-white w-full text-sm">
//                 <p className="font-semibold mb-2">Recent updates:</p>
//                 <ul className="list-disc list-inside">
//                     <li>MMPI</li>
//                     <li>MTKI</li>
//                     <li>SPSI</li>
//                     <li>JMBI</li>
//                 </ul>
//             </div>
//         </InfoCard>
//       </div>

//     </MainLayout>
//   );
// };

// export default Dashboard;


// import { useEffect, useState } from "react";
// import MainLayout from "../layouts/MainLayout";
// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";
// import { Pie } from "react-chartjs-2";
// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
// import type { ColumnDef } from "@tanstack/react-table";
// import DataTable from "../components/DataTable";
// import axiosServer from "../utilities/AxiosServer";
// import StatusBadge from "../components/StatusBadge";

// ChartJS.register(ArcElement, Tooltip, Legend);

// interface QCSummary {
//   date: string;
//   code: string;
//   quality_percentage: number | null;
//   result: string;
//   details: string;
//   network: string;
//   geometry: {
//     type: string;
//     coordinates: [number, number, number];
//   };
// }

// const triangleIcon = (color: string) =>
//   L.divIcon({
//     className: "",
//     html: `<div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 12px solid ${color};"></div>`,
//     iconSize: [12, 12],
//     iconAnchor: [6, 12],
//   });

// // [DIKEMBALIKAN] Helper warna dikembalikan sesuai preferensi Anda
// const getColorByQuality = (quality: number | null): string => {
//   if (quality === null) return "#6b7280"; // no data
//   if (quality >= 80) return "#14532d"; // very good (Hijau Tua)
//   if (quality >= 60) return "#22c55e"; // good (Hijau Terang)
//   if (quality >= 40) return "#f97316"; // fair (Oranye)
//   if (quality >= 20) return "#ef4444"; // poor (Merah)
//   return "#6b7280"; // default
// };

// const getStatusText = (result: string, quality: number | null): string => {
//   if (result === 'Mati') return 'Mati';
//   if (quality === null) return 'No Data';
//   if (quality >= 80) return 'Sangat Baik';
//   if (quality >= 60) return 'Baik';
//   if (quality >= 40) return 'Cukup';
//   return 'Buruk';
// };

// // [DIUBAH] Komponen legenda peta disesuaikan dengan warna di atas
// const MapLegend = () => {
//   const legendItems = [
//     { color: "#14532d", label: "Sangat Baik" },
//     { color: "#22c55e", label: "Baik" },
//     { color: "#f97316", label: "Cukup" },
//     { color: "#ef4444", label: "Buruk" },
//     { color: "#000000", label: "Mati" },
//     { color: "#6b7280", label: "No Data" },
//   ];

//   return (
//     <div className="absolute bottom-5 left-5 z-[1000] bg-white/30 p-3 rounded-lg shadow-lg">
//       <h3 className="font-bold mb-2 text-sm">Keterangan</h3>
//       <ul>
//         {legendItems.map((item) => (
//           <li key={item.label} className="flex items-center mb-1 text-xs">
//             <span
//               className="w-3 h-3 inline-block mr-2 rounded-sm"
//               style={{ backgroundColor: item.color }}
//             ></span>
//             {item.label}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// const Dashboard = () => {
//   // ... (sisa logika state, useEffect, pieData, dan columns tidak berubah) ...
//   const [qcData, setQcData] = useState<QCSummary[]>([]);
//   const [loadingQC, setLoadingQC] = useState(true);

//   useEffect(() => {
//     const today = "2025-06-06";
//     axiosServer
//       .get<QCSummary[]>(`/api/qc/summary/${today}`)
//       .then((res) => setQcData(res.data))
//       .finally(() => setLoadingQC(false));
//   }, []);

//   const totalOn = qcData.filter((s) => s.result !== "Mati").length;
//   const totalOff = qcData.filter((s) => s.result === "Mati").length;

//   const veryGood = qcData.filter((d) => d.quality_percentage !== null && d.quality_percentage >= 80).length;
//   const good = qcData.filter((d) => d.quality_percentage !== null && d.quality_percentage >= 60 && d.quality_percentage < 80).length;
//   const fair = qcData.filter((d) => d.quality_percentage !== null && d.quality_percentage >= 40 && d.quality_percentage < 60).length;
//   const poor = qcData.filter((d) => d.quality_percentage !== null && d.quality_percentage < 40).length;
//   const noData = qcData.filter((d) => d.quality_percentage === null).length;

//   const pieData = {
//     labels: ["Sangat Baik", "Baik", "Cukup", "Buruk", "No Data"],
//     datasets: [
//       {
//         data: [veryGood, good, fair, poor, noData],
//         backgroundColor: ["#22c55e", "#f97316", "#f59e0b", "#ef4444", "#6b7280"],
//         borderColor: ["#fff"],
//         borderWidth: 2,
//       },
//     ],
//   };

//   const columns: ColumnDef<QCSummary>[] = [
//     { accessorKey: "code", header: "Kode Stasiun" },
//     { accessorKey: "network", header: "Network" },
//     {
//       accessorKey: "quality_percentage",
//       header: "Quality (%)",
//       cell: ({ row }) =>
//         row.original.quality_percentage !== null ? (
//           <span>{row.original.quality_percentage.toFixed(1)}%</span>
//         ) : (
//           <span className="text-gray-500">-</span>
//         ),
//     },
//     {
//       accessorKey: "result",
//       header: "Status",
//       cell: ({ row }) => {
//         const statusText = getStatusText(row.original.result, row.original.quality_percentage);
//         return <StatusBadge value={statusText} />;
//       },
//     },
//   ];

//   return (
//     <MainLayout>
//       <h1 className="text-left text-3xl font-bold mt-0 mb-4 ml-8">Dashboard</h1>
//       <div className="bg-white rounded-xl shadow p-4 mb-6">
//         <div className="relative w-full h-[400px]">
//           <MapContainer
//             center={[-2.5, 118]}
//             zoom={5}
//             className="w-full h-full rounded-lg"
//           >
//             <TileLayer
//               attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
//               url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//             />
//             {qcData.map((s, idx) => (
//               <Marker
//                 key={idx}
//                 position={[s.geometry.coordinates[1], s.geometry.coordinates[0]]}
//                 icon={triangleIcon(
//                   s.result === 'Mati'
//                     ? '#000000'
//                     : getColorByQuality(s.quality_percentage)
//                 )}
//               >
//                 <Popup>
//                   <b>Stasiun: {s.code}</b><br />
//                   Status: {getStatusText(s.result, s.quality_percentage)}<br />
//                   {s.quality_percentage !== null && `Kualitas: ${s.quality_percentage.toFixed(1)}%`}
//                 </Popup>
//               </Marker>
//             ))}
//           </MapContainer>
//           <MapLegend />
//         </div>
//       </div>
//       {/* ...sisa kode GRID BAWAH tidak berubah... */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div className="bg-white rounded-xl shadow p-4">
//           <h2 className="text-lg font-semibold mb-4">Data QC Summary</h2>
//           {loadingQC ? (
//             <p>Memuat data...</p>
//           ) : (
//             <DataTable columns={columns} data={qcData} />
//           )}
//         </div>
//         <div className="flex flex-col gap-6">
//           <div className="grid grid-cols-2 gap-6">
//             <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
//               <h2 className="text-lg font-semibold">Total ON</h2>
//               <p className="text-3xl font-bold text-green-600 mt-2">{totalOn}</p>
//             </div>
//             <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
//               <h2 className="text-lg font-semibold">Total OFF</h2>
//               <p className="text-3xl font-bold text-red-600 mt-2">{totalOff}</p>
//             </div>
//           </div>
//           <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
//             <h2 className="text-lg font-semibold mb-4">Summary Status Data</h2>
//             <div className="w-[280px] h-[280px]">
//               <Pie data={pieData} />
//             </div>
//           </div>
//         </div>
//       </div>
//     </MainLayout>
//   );
// };

// export default Dashboard;

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
