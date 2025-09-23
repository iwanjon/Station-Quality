import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosServer from "../utilities/AxiosServer";
import ChartSlide from "../components/ChartSlide";
import LazyLatencyChart from "../components/LazyLatencyChart";
import MainLayout from "../layouts/MainLayout";

type QCData = {
  code?: string;
  date: string;
  channel: string;
  name?: string;
  rms: number | string;
  amplitude_ratio: number | string;
  num_gap?: number;
  num_overlap?: number;
  num_spikes?: number;
  availability?: number;
  perc_above_nhnm?: number;
  perc_below_nlnm?: number;
  linear_dead_channel?: number;
  gsn_dead_channel?: number;
  sp_percentage?: number;
  bw_percentage?: number;
  lp_percentage?: number;
};

const dummySummaryData = {
  SHE: [
    { date: "07-Sep", status: "Good" },
    { date: "08-Sep", status: "Good" },
    { date: "09-Sep", status: "Fair" },
    { date: "10-Sep", status: "Poor" },
    { date: "11-Sep", status: "No Data" },
    { date: "12-Sep", status: "Fair" },
    { date: "13-Sep", status: "Good" },
  ],
  SHN: [
    { date: "07-Sep", status: "Good" },
    { date: "08-Sep", status: "Good" },
    { date: "09-Sep", status: "Fair" },
    { date: "10-Sep", status: "Poor" },
    { date: "11-Sep", status: "No Data" },
    { date: "12-Sep", status: "Fair" },
    { date: "13-Sep", status: "Good" },
  ],
  SHZ: [
    { date: "07-Sep", status: "Good" },
    { date: "08-Sep", status: "Good" },
    { date: "09-Sep", status: "Fair" },
    { date: "10-Sep", status: "Poor" },
    { date: "11-Sep", status: "No Data" },
    { date: "12-Sep", status: "Fair" },
    { date: "13-Sep", status: "Good" },
  ],
};

// --- [BARU] Helper function untuk warna status ---
const getStatusColor = (status: string) => {
  switch (status) {
    case "Good":
      return "bg-green-500 text-white";
    case "Fair":
      return "bg-yellow-400 text-black";
    case "Poor":
      return "bg-red-500 text-white";
    case "No Data":
      return "bg-gray-400 text-white";
    default:
      return "bg-gray-200 text-gray-800";
  }
};
// --- END [BARU] ---

const CHANNELS = ["E", "N", "Z"];

const StationDetail = () => {
  const { stationCode } = useParams<{ stationCode: string }>();
  const navigate = useNavigate();

  const [qcData, setQcData] = useState<QCData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stationList, setStationList] = useState<string[]>([]);

  // Ambil daftar kode stasiun dari database
  useEffect(() => {
    axiosServer
      .get("/api/stasiun")
      .then((res) => {
        const codes = (res.data || []).map((s: any) => s.kode_stasiun);
        setStationList(codes);
      })
      .catch(() => setStationList([]));
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchQcData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosServer.get(
          `/api/qc/data/detail/7days/${stationCode}`
        );
        const normalized: QCData[] = (res.data || []).map((d: any) => ({
          ...d,
          rms: Number(d.rms ?? 0),
          amplitude_ratio: Number(d.amplitude_ratio ?? 0),
          num_gap: Number(d.num_gap ?? 0),
          num_overlap: Number(d.num_overlap ?? 0),
          num_spikes: Number(d.num_spikes ?? 0),
          availability: Number(d.availability ?? 0),
          perc_above_nhnm: Number(d.perc_above_nhnm ?? 0),
          perc_below_nlnm: Number(d.perc_below_nlnm ?? 0),
          linear_dead_channel: Number(d.linear_dead_channel ?? 0),
          gsn_dead_channel: Number(d.gsn_dead_channel ?? 0),
          sp_percentage: Number(d.sp_percentage ?? 0),
          bw_percentage: Number(d.bw_percentage ?? 0),
          lp_percentage: Number(d.lp_percentage ?? 0),
        }));
        setQcData(normalized);
      } catch (err) {
        setError("Gagal memuat data timeseries untuk stasiun ini.");
      } finally {
        setLoading(false);
      }
    };

    if (stationCode) {
      fetchQcData();
    }
  }, [stationCode]);

  const groupedByChannel = CHANNELS.reduce<Record<string, QCData[]>>(
    (acc, ch) => {
      acc[ch] = qcData.filter((d) => d.channel.toUpperCase().includes(ch));
      return acc;
    },
    {}
  );

  const ChartGridSection = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{children}</div>
    </div>
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-screen">
          <p>Memuat data detail stasiun...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-screen text-red-500">
          <p>{error}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-8 bg-gray-50 min-h-screen">
        {/* --- Bagian Header Halaman --- */}
        <div className="flex justify-between items-start mb-6">
          {/* Bagian Kiri: Dropdown Stasiun */}
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">Station</h1>
            <select
              value={stationCode}
              onChange={(e) => {
                const newStationCode = e.target.value;
                if (newStationCode) {
                  navigate(`/station/${newStationCode}`);
                }
              }}
              className="p-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {stationList.map((station) => (
                <option key={station} value={station}>
                  {station}
                </option>
              ))}
            </select>
          </div>

          {/* Bagian Kanan: Tombol Navigasi */}
          <div className="flex flex-col items-end">
            <div className="flex space-x-1 rounded-lg bg-gray-200 p-1">
              <button
                className="px-4 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-300"
                onClick={() => {
                  if (stationCode) {
                    navigate(`/station-daily/${stationCode}`);
                  }
                }}
              >
                Daily
              </button>
              <button className="px-4 py-1 rounded-md text-sm font-medium bg-white shadow text-blue-600">
                Time Series
              </button>
            </div>
            <div className="mt-2 px-4 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
              Last 7 Days
            </div>
          </div>
        </div>

        {/* --- [BARU] Bagian Summary --- */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.entries(dummySummaryData).map(([channel, data]) => (
              <div key={channel}>
                <h3 className="text-lg font-semibold text-center mb-2">
                  {channel}
                </h3>
                <div className="flex justify-between space-x-1">
                  {data.map((item) => (
                    <div
                      key={item.date}
                      className={`flex-1 p-2 rounded-md text-center text-xs font-bold ${getStatusColor(
                        item.status
                      )}`}
                    >
                      <p>{item.status}</p>
                      <p className="font-normal mt-1">{item.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RMS */}
        <ChartGridSection title="RMS">
          {CHANNELS.map((ch) => (
            <div key={`rms-${ch}`}>
              <ChartSlide
                channel={ch}
                titlePrefix={`RMS - SH${ch}`}
                data={groupedByChannel[ch]}
                lines={[{ dataKey: "rms", stroke: "#6366f1" }]}
              />
            </div>
          ))}
        </ChartGridSection>

        {/* Amplitude */}
        <ChartGridSection title="Amplitude Ratio per Channel">
          {CHANNELS.map((ch, idx) => (
            <div key={`amp-${ch}`}>
              <ChartSlide
                channel={ch}
                titlePrefix="Amplitude Ratio"
                data={groupedByChannel[ch]}
                lines={[
                  {
                    dataKey: "amplitude_ratio",
                    stroke: ["#10b981", "#3b82f6", "#f59e0b"][idx],
                  },
                ]}
              />
            </div>
          ))}
        </ChartGridSection>

        {/* Spikes */}
        <ChartGridSection title="Spikes">
          {CHANNELS.map((ch) => (
            <div key={`spikes-${ch}`}>
              <ChartSlide
                channel={ch}
                titlePrefix="Spikes"
                data={groupedByChannel[ch]}
                lines={[{ dataKey: "num_spikes", stroke: "#ef4444" }]}
              />
            </div>
          ))}
        </ChartGridSection>

        {/* SP / BW / LP */}
        <ChartGridSection title="SP / BW / LP Percentage">
          {CHANNELS.map((ch) => (
            <div key={`sbl-${ch}`}>
              <ChartSlide
                channel={ch}
                titlePrefix="SP / BW / LP"
                data={groupedByChannel[ch]}
                lines={[
                  { dataKey: "sp_percentage", stroke: "#6366f1" },
                  { dataKey: "bw_percentage", stroke: "#10b81" },
                  { dataKey: "lp_percentage", stroke: "#f59e0b" },
                ]}
                yAxisProps={{ domain: [50, 120] }}
              />
            </div>
          ))}
        </ChartGridSection>
        {/* Penerapan lazy loading pada Latency Chart  secara terpisah */}
        <LazyLatencyChart stationCode={stationCode} />
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
// import MainLayout from "../layouts/MainLayout"; 

// type QCData = {
//   code?: string;
//   date: string;
//   channel: string;
//   name?: string;
//   rms: number | string;
//   amplitude_ratio: number | string;
//   num_gap?: number;
//   num_overlap?: number;
//   num_spikes?: number;
//   availability?: number;
//   perc_above_nhnm?: number;
//   perc_below_nlnm?: number;
//   linear_dead_channel?: number;
//   gsn_dead_channel?: number;
//   sp_percentage?: number;
//   bw_percentage?: number;
//   lp_percentage?: number;
// };

// const CHANNELS = ["E", "N", "Z"];

// const StationDetail = () => {
//   const { stationCode } = useParams<{ stationCode: string }>();
  
//   const [qcData, setQcData] = useState<QCData[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);


//   useEffect(() => {
//     window.scrollTo(0, 0);
//   }, []); 

//   // Mengembalikan useEffect untuk mengambil data secara otomatis saat komponen dimuat
//   useEffect(() => {
//     const fetchQcData = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const res = await axiosServer.get(`/api/qc/data/detail/7days/${stationCode}`);
//         const normalized: QCData[] = (res.data || []).map((d: any) => ({
//           ...d,
//           rms: Number(d.rms ?? 0),
//           amplitude_ratio: Number(d.amplitude_ratio ?? 0),
//           num_gap: Number(d.num_gap ?? 0),
//           num_overlap: Number(d.num_overlap ?? 0),
//           num_spikes: Number(d.num_spikes ?? 0),
//           availability: Number(d.availability ?? 0),
//           perc_above_nhnm: Number(d.perc_above_nhnm ?? 0),
//           perc_below_nlnm: Number(d.perc_below_nlnm ?? 0),
//           linear_dead_channel: Number(d.linear_dead_channel ?? 0),
//           gsn_dead_channel: Number(d.gsn_dead_channel ?? 0),
//           sp_percentage: Number(d.sp_percentage ?? 0),
//           bw_percentage: Number(d.bw_percentage ?? 0),
//           lp_percentage: Number(d.lp_percentage ?? 0),
//         }));
//         setQcData(normalized);
//       } catch (err) {
//         console.error("Error fetching QC 7days:", err);
//         setError("Gagal memuat data timeseries untuk stasiun ini.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (stationCode) {
//       fetchQcData();
//     }
//   }, [stationCode]);

//   const groupedByChannel = CHANNELS.reduce<Record<string, QCData[]>>(
//     (acc, ch) => {
//       acc[ch] = qcData.filter((d) => d.channel.toUpperCase().includes(ch));
//       return acc;
//     },
//     {}
//   );

//   const ChartGridSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
//     <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md">
//       <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {children}
//       </div>
//     </div>
//   );

//   if (loading) {
//     return (
//       <MainLayout>
//         <div className="flex justify-center items-center h-screen">
//           <p>Memuat data detail stasiun...</p>
//         </div>
//       </MainLayout>
//     );
//   }

//   if (error) {
//     return (
//       <MainLayout>
//         <div className="flex justify-center items-center h-screen text-red-500">
//           <p>{error}</p>
//         </div>
//       </MainLayout>
//     );
//   }

//   return (
//     <MainLayout>
//       <div className="p-4 sm:p-6 space-y-8 bg-gray-50 min-h-screen">
//         <h1 className="text-center text-3xl font-bold text-gray-900">
//           Detail Stasiun {stationCode}
//         </h1>
        
//         {/* RMS */}
//         <ChartGridSection title="RMS per Channel">
//           {CHANNELS.map((ch) => (
//             <div key={`rms-${ch}`}>
//               <ChartSlide channel={ch} titlePrefix="RMS" data={groupedByChannel[ch]} lines={[{ dataKey: "rms", stroke: "#6366f1" }]} />
//             </div>
//           ))}
//         </ChartGridSection>

//         {/* Amplitude */}
//         <ChartGridSection title="Amplitude Ratio per Channel">
//           {CHANNELS.map((ch, idx) => (
//             <div key={`amp-${ch}`}>
//               <ChartSlide channel={ch} titlePrefix="Amplitude Ratio" data={groupedByChannel[ch]} lines={[{ dataKey: "amplitude_ratio", stroke: ["#10b981", "#3b82f6", "#f59e0b"][idx] }]} />
//             </div>
//           ))}
//         </ChartGridSection>

//         {/* Spikes */}
//         <ChartGridSection title="Spikes">
//           {CHANNELS.map((ch) => (
//             <div key={`spikes-${ch}`}>
//               <ChartSlide channel={ch} titlePrefix="Spikes" data={groupedByChannel[ch]} lines={[{ dataKey: 'num_spikes', stroke: '#ef4444' }]} />
//             </div>
//           ))}
//         </ChartGridSection>

//         {/* SP / BW / LP */}
//         <ChartGridSection title="SP / BW / LP Percentage">
//           {CHANNELS.map((ch) => (
//             <div key={`sbl-${ch}`}>
//               <ChartSlide channel={ch} titlePrefix="SP / BW / LP" data={groupedByChannel[ch]} lines={[{ dataKey: 'sp_percentage', stroke: '#6366f1'},{ dataKey: 'bw_percentage', stroke: '#10b81'},{ dataKey: 'lp_percentage', stroke: '#f59e0b'}]} yAxisProps={{ domain: [50, 120] }} />
//             </div>
//           ))}
//         </ChartGridSection>

//         {/* Penerapan lazy loading pada Latency Chart  secara terpisah */}
//         <LazyLatencyChart stationCode={stationCode} />
//       </div>
//     </MainLayout>
//   );
// };

// export default StationDetail;
