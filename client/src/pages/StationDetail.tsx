// src/pages/StationDetail.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosServer from "../utilities/AxiosServer";
import MainLayout from "../layouts/MainLayout";

interface Stasiun {
  stasiun_id: number;
  net: string;
  kode_stasiun: string;
  lintang: number;
  bujur: number;
  elevasi: number;
  lokasi: string;
  provinsi: string;
  upt_penanggung_jawab: string;
  status: string;
  tahun_instalasi: number;
  jaringan: string;
  prioritas: string;
  keterangan: string | null;
  accelerometer: string;
  digitizer_komunikasi: string;
  tipe_shelter: string | null;
  lokasi_shelter: string;
  penjaga_shelter: string;
  penggantian_terakhir_alat: string | null;
  updated_at: string;
}

const StationDetail = () => {
  const {stationCode} = useParams<{ stationCode?: string;}>();
  const [stationInfo, setStationInfo] = useState<Stasiun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log("StationDetail params:", { stationCode});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch station info
  useEffect(() => {
    const fetchStationInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        let stationData: Stasiun;

        if (stationCode) {
          // Fetch by ID
          const res = await axiosServer.get(`/api/stasiun/${stationCode}`);
          stationData = res.data;
        } else {
          throw new Error('No station ID or code provided');
        }
        setStationInfo(stationData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load station data');
      } finally {
        setLoading(false);
      }
    };

    fetchStationInfo();
  }, [stationCode]);

  console.log("StationDetail state:", { stationInfo, loading, error });

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading station data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold">Error</div>
            <p className="mt-2 text-gray-600">{error}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!stationInfo) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-600 text-lg">Station not found</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {stationInfo.kode_stasiun}
            </h1>
            <p className="text-lg text-gray-600">
              {stationInfo.lokasi}, {stationInfo.provinsi}
            </p>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Informasi Dasar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">Network:</span>
                <p className="text-gray-600">{stationInfo.net}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <p className="text-gray-600">{stationInfo.status}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Prioritas:</span>
                <p className="text-gray-600">{stationInfo.prioritas}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">UPT Penanggung Jawab:</span>
                <p className="text-gray-600">{stationInfo.upt_penanggung_jawab}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Tahun Instalasi:</span>
                <p className="text-gray-600">{stationInfo.tahun_instalasi}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Jaringan:</span>
                <p className="text-gray-600">{stationInfo.jaringan}</p>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Informasi Lokasi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">Koordinat:</span>
                <p className="text-gray-600">
                  {stationInfo.lintang}° N, {stationInfo.bujur}° E
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Elevasi:</span>
                <p className="text-gray-600">{stationInfo.elevasi} m</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Lokasi Shelter:</span>
                <p className="text-gray-600">{stationInfo.lokasi_shelter}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Tipe Shelter:</span>
                <p className="text-gray-600">{stationInfo.tipe_shelter || 'Tidak tersedia'}</p>
              </div>
            </div>
          </div>

          {/* Equipment Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Informasi Peralatan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">Accelerometer:</span>
                <p className="text-gray-600">{stationInfo.accelerometer}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Digitizer Komunikasi:</span>
                <p className="text-gray-600">{stationInfo.digitizer_komunikasi}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Penjaga Shelter:</span>
                <p className="text-gray-600">{stationInfo.penjaga_shelter}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Penggantian Terakhir Alat:</span>
                <p className="text-gray-600">
                  {stationInfo.penggantian_terakhir_alat || 'Tidak tersedia'}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {stationInfo.keterangan && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Keterangan Tambahan</h2>
              <p className="text-gray-600">{stationInfo.keterangan}</p>
            </div>
          )}

          {/* Last Updated */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-500">
              <span className="font-medium">Terakhir diperbarui:</span>
              <p>{new Date(stationInfo.updated_at).toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default StationDetail;

// import { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import axiosServer from "../utilities/AxiosServer";
// import ChartSlide from "../components/ChartSlide";
// import LazyLatencyChart from "../components/LazyLatencyChart";

// // [DIHAPUS] Semua import yang berhubungan dengan slider tidak lagi diperlukan
// // import "keen-slider/keen-slider.min.css";
// // import { useKeenSlider } from "keen-slider/react";
// // import ChartSection from '../components/ChartSection';

// type QCData = {
//   // ... (definisi tipe data tidak berubah)
//   code?: string;
//   date: string;
//   channel: string;
//   rms: number | string;
//   amplitude_ratio: number | string;
//   num_gap?: number;
//   num_overlap?: number;
//   num_spikes?: number;
//   availability?: number;
//   perc_above_nhnm?: number;
//   perc_below_nlnm?: number;
//   linear_dead_channel?: number;
//   gsn_dead_channel?: number;
//   sp_percentage?: number;
//   bw_percentage?: number;
//   lp_percentage?: number;
// };

// const CHANNELS = ["SHE", "SHN", "SHZ"];

// const StationDetail = () => {
//   const { stationCode } = useParams<{ stationCode: string }>();
//   const [qcData, setQcData] = useState<QCData[]>([]);

//   // ... (logika useEffect untuk fetch data tidak berubah)
//   useEffect(() => {
//     window.scrollTo(0, 0);
//   }, []); 

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await axiosServer.get(`/api/qc/data/detail/7days/${stationCode}`);
//         const normalized: QCData[] = (res.data || []).map((d: any) => ({
//           ...d,
//           rms: Number(d.rms ?? 0),
//           amplitude_ratio: Number(d.amplitude_ratio ?? 0),
//           num_gap: Number(d.num_gap ?? 0),
//           num_overlap: Number(d.num_overlap ?? 0),
//           num_spikes: Number(d.num_spikes ?? 0),
//           availability: Number(d.availability ?? 0),
//           perc_above_nhnm: Number(d.perc_above_nhnm ?? 0),
//           perc_below_nlnm: Number(d.perc_below_nlnm ?? 0),
//           linear_dead_channel: Number(d.linear_dead_channel ?? 0),
//           gsn_dead_channel: Number(d.gsn_dead_channel ?? 0),
//           sp_percentage: Number(d.sp_percentage ?? 0),
//           bw_percentage: Number(d.bw_percentage ?? 0),
//           lp_percentage: Number(d.lp_percentage ?? 0),
//         }));
//         setQcData(normalized);
//       } catch (err) {
//         console.error("Error fetching QC 7days:", err);
//       }
//     };
//     if (stationCode) fetchData();
//   }, [stationCode]);

//   const groupedByChannel = CHANNELS.reduce<Record<string, QCData[]>>(
//     (acc, ch) => {
//       acc[ch] = qcData.filter((d) => d.channel === ch);
//       return acc;
//     },
//     {}
//   );

//   // [DIHAPUS] Semua state dan hook untuk slider dihapus
//   // const [sliderRefRMS, sliderRMS] = useKeenSlider(...);
//   // ...dan seterusnya untuk slider lain...
//   // const slideClass = ...;

//   // [DITAMBAHKAN] Komponen pembungkus untuk setiap seksi grafik
//   const ChartGridSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
//     <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md">
//       <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {children}
//       </div>
//     </div>
//   );

//   return (
//     <div className="p-4 sm:p-6 space-y-8 bg-gray-50 min-h-screen">
//       <h1 className="text-center text-3xl font-bold text-gray-900">
//         Detail Stasiun {stationCode}
//       </h1>

//       {/* RMS */}
//       <ChartGridSection title="RMS per Channel">
//         {CHANNELS.map((ch) => (
//           <div key={ch}>
//             <ChartSlide
//               channel={ch}
//               titlePrefix="RMS"
//               data={groupedByChannel[ch]}
//               lines={[{ dataKey: "rms", stroke: "#6366f1" }]}
//             />
//           </div>
//         ))}
//       </ChartGridSection>

//       {/* Amplitude */}
//       <ChartGridSection title="Amplitude Ratio per Channel">
//         {CHANNELS.map((ch, idx) => (
//           <div key={ch}>
//             <ChartSlide
//               channel={ch}
//               titlePrefix="Amplitude Ratio"
//               data={groupedByChannel[ch]}
//               lines={[{ dataKey: "amplitude_ratio", stroke: ["#10b981", "#3b82f6", "#f59e0b"][idx] }]}
//             />
//           </div>
//         ))}
//       </ChartGridSection>
      
//       {/* Latency Chart (tidak diubah) */}
//       <LazyLatencyChart stationCode={stationCode} />

//       {/* Spikes */}
//       <ChartGridSection title="Spikes">
//         {CHANNELS.map((ch) => (
//           <div key={ch}>
//             <ChartSlide
//               channel={ch}
//               titlePrefix="Spikes"
//               data={groupedByChannel[ch]}
//               lines={[{ dataKey: 'num_spikes', stroke: '#10b981' }]}
//             />
//           </div>
//         ))}
//       </ChartGridSection>

//       {/* Noise */}
//       <ChartGridSection title="Noise">
//         {CHANNELS.map((ch) => (
//           <div key={ch}>
//             <ChartSlide
//               channel={ch}
//               titlePrefix="Noise"
//               data={groupedByChannel[ch]}
//               lines={[
//                 { dataKey: 'perc_above_nhnm', stroke: '#f59e0b', name: '% Above NHNM' },
//                 { dataKey: 'perc_below_nlnm', stroke: '#3b82f6', name: '% Below NLNM' },
//               ]}
//               yAxisProps={{ domain: [0, 100] }} // Mungkin disesuaikan ke 100%
//             />
//           </div>
//         ))}
//       </ChartGridSection>
      
//       {/* SP / BW / LP */}
//       <ChartGridSection title="SP / BW / LP Percentage">
//         {CHANNELS.map((ch) => (
//           <div key={ch}>
//             <ChartSlide
//               channel={ch}
//               titlePrefix="SP / BW / LP"
//               data={groupedByChannel[ch]}
//               lines={[
//                 { dataKey: 'sp_percentage', stroke: '#6366f1', name: 'SP %' },
//                 { dataKey: 'bw_percentage', stroke: '#10b981', name: 'BW %' },
//                 { dataKey: 'lp_percentage', stroke: '#f59e0b', name: 'LP %' },
//               ]}
//               yAxisProps={{ domain: [50, 120] }}
//             />
//           </div>
//         ))}
//       </ChartGridSection>

//       {/* ... sisa kode lainnya ... */}
//     </div>
//   );
// };

// export default StationDetail;