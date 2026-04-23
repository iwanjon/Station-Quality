import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosServer from "../utilities/AxiosServer";
import ChartSlide from "../components/ChartSlide";
import LazyLatencyChart from "../components/LazyLatencyChart";
import MainLayout from "../layouts/MainLayout";
import dayjs from "dayjs";

// --- INTERFACES & TYPES ---

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

type SummaryDataItem = {
  date: string;
  status: string;
};

// --- FUNGSI HELPER ---

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

const CHANNELS = ["E", "N", "Z"];

const formatDateTick = (tickItem: string) => dayjs(tickItem).format("DD-MMM");

const StationDetail = () => {
  let { stationCode } = useParams<{ stationCode: string }>();
  const navigate = useNavigate();

  // Tambahan: state untuk mengontrol select agar menampilkan nama stasiun pertama
  const [selectedStation, setSelectedStation] = useState<string | undefined>(stationCode);

  const [qcData, setQcData] = useState<QCData[]>([]);
  // Inisialisasi summaryData diubah menjadi kosong, kita akan populate semua variasi prioritas di fetch
  const [summaryData, setSummaryData] = useState<Record<string, SummaryDataItem[]>>({});
  const [loadingSummary, setLoadingSummary]= useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stationList, setStationList] = useState<string[]>([]);


  // // add authorizationn 
  
  // const originalList = ['AAFM', 'AAI', 'AAII', 'ABJI', 'ABSM', 'ACBM', 'ACJM', 'ALKI', 'ALTI', 'AMPM']; 
  // // Normalize the list to a Set of lowercase strings for efficient lookup
  // const lowercaseSet = new Set(originalList.map(item => item.toLowerCase()));

  
  // const lowercaseWord = (stationCode || "").toLowerCase();

  // // Check if the lowercase word is NOT in the set
  // if (!lowercaseSet.has(lowercaseWord)) {
  //   console.log(`"${stationCode}" is not in the list.`);
  //   stationCode = ""
  // } else {
  //   console.log(`"${stationCode}" is in the list.`);
  
  // }


  // ambil daftar stasiun dan jika URL belum berisi stationCode, langsung set default ke stasiun pertama
  useEffect(() => {
    axiosServer
      .get("/api/stasiun")
      .then((res) => {
        const codes = (res.data || []).map((s: any) => s.kode_stasiun);
        setStationList(codes);

        // jika belum ada stationCode di route, navigasi otomatis ke stasiun pertama
        if ((!stationCode || stationCode === "") && codes.length > 0) {
          // replace agar tidak menambah history entry saat default dipilih
          navigate(`/station/${codes[0]}`, { replace: true });
        }
      })
      .catch(() => setStationList([]));
  }, [navigate, stationCode]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  useEffect(() => {
    if (!stationCode) return;

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
        
        normalized.sort((a, b) => {
          const ta = new Date(a.date).getTime();
          const tb = new Date(b.date).getTime();
          return ta - tb;
        });

        setQcData(normalized);
      } catch (err) {
        setError("Gagal memuat data timeseries untuk stasiun ini.");
      } finally {
        setLoading(false);
      }
    };

    const fetchSummaryData = async () => {
      setLoadingSummary(true);
      try {
        const res = await axiosServer.get(`/api/qc/summary/7days/${stationCode}`);
        // Populate untuk semua kombinasi prioritas agar dynamic logic membaca data dengan aman
        setSummaryData({
          SHE: res.data, SHN: res.data, SHZ: res.data,
          BHE: res.data, BHN: res.data, BHZ: res.data,
          HHE: res.data, HHN: res.data, HHZ: res.data,
        });
      } catch (err) {
        console.error("Gagal memuat data summary:", err);
        setSummaryData({});
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchQcData();
    fetchSummaryData();

  }, [stationCode]);
  
  const xAxisConfig = {
    tickFormatter: formatDateTick, 
    angle: -45, 
    textAnchor: "end", 
    height: 50, 
    interval: 0, 
  };

  // --- LOGIC PENENTUAN PRIORITAS CHANNEL ---
  const activeChannels = useMemo(() => {
    const available = Array.from(new Set(qcData.map((d) => d.channel.toUpperCase())));
    
    // Prioritas pencarian: SH > BH > HH
    const getBest = (comp: string) => {
      if (available.includes(`SH${comp}`)) return `SH${comp}`;
      if (available.includes(`BH${comp}`)) return `BH${comp}`;
      if (available.includes(`HH${comp}`)) return `HH${comp}`;
      return `SH${comp}`; // Default fallback jika data channel kosong
    };

    return {
      E: getBest("E"),
      N: getBest("N"),
      Z: getBest("Z"),
    } as Record<string, string>;
  }, [qcData]);

  // Digunakan untuk render bagian Summary (menggantikan CHANNELS_FULL hardcode)
  const activeChannelsFull = [activeChannels.E, activeChannels.N, activeChannels.Z];

  // Grouping sekarang dipastikan strict sesuai best channel yang didapat dari prioritas
  const groupedByChannel = CHANNELS.reduce<Record<string, QCData[]>>(
    (acc, ch) => {
      const targetChannel = activeChannels[ch];
      acc[ch] = qcData.filter((d) => d.channel.toUpperCase() === targetChannel);
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
    <div className="bg-white p-2 sm:p-3 rounded-xl shadow mb-4">
      <h2 className="text-lg font-bold mb-2 text-gray-800">{title}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">{children}</div>
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
      <div className="p-2 sm:p-3 space-y-4 bg-gray-50 min-h-screen">
        {/* --- Header --- */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <div
              aria-hidden
              className="min-w-[80px] bg-gray-200 text-gray-800 font-bold px-3 py-2 rounded-md text-sm flex items-center justify-center"
            >
              Station
            </div>
 
             <div className="relative">
               <select
                 value={selectedStation ?? ""}
                 onChange={(e) => {
                   const newStationCode = e.target.value;
                   setSelectedStation(newStationCode);
                   if (newStationCode) navigate(`/station/${newStationCode}`);
                 }}

                className="appearance-none min-w-[120px] border border-gray-300 rounded px-3 pr-10 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
               >
                 {stationList.length === 0 && <option value="">Loading...</option>}
                 {stationList.map((station) => (
                   <option key={station} value={station}>
                     {station}
                   </option>
                 ))}
               </select>

               <div className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
                 <span className="w-px h-6 bg-gray-200 mr-2" />
                 <svg
                   className="w-4 h-4 text-gray-400"
                   viewBox="0 0 20 20"
                   fill="none"
                   xmlns="http://www.w3.org/2000/svg"
                   aria-hidden="true"
                 >
                   <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                 </svg>
               </div>
             </div>
            </div>
          <div className="flex flex-col items-end">
            <div className="flex space-x-1 rounded bg-gray-200 p-0.5">
              <button
                className="px-2 py-0.5 rounded text-xs font-medium text-gray-700 hover:bg-gray-300"
                onClick={() => {
                  if (stationCode) {
                    navigate(`/station-daily/${stationCode}`);
                  }
                }}
              >
                Daily
              </button>
              <button className="px-2 py-0.5 rounded text-xs font-medium bg-white shadow text-blue-600">
                Time Series
              </button>
            </div>
            <div className="mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-semibold rounded-full">
              Last 7 Days
            </div>
          </div>
        </div>

        {/* --- Summary Section --- */}
        <div className="bg-white p-1 sm:p-2 rounded-lg shadow mb-2">
          <h2 className="text-base font-bold mb-1 text-gray-800">Summary</h2>
          {loadingSummary ? (
            <div className="text-center text-gray-500 text-xs">Memuat summary...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {activeChannelsFull.map((channel) => (
                <div key={channel} className="flex flex-col items-center">
                  <h3 className="text-sm font-semibold text-center mb-1">{channel}</h3>
                  <div className="inline-flex flex-col items-center">
                    <div className="flex">
                      {summaryData[channel]?.map((item) => (
                        <div
                          key={item.date}
                          className={`flex flex-col items-center justify-center px-2 py-0.5 border border-gray-200 border-b-0 first:rounded-tl last:rounded-tr text-[11px] font-bold ${getStatusColor(item.status)}`}
                          style={{ minWidth: 48 }}
                        >
                          <span>{item.status}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex">
                      {summaryData[channel]?.map((item) => (
                        <div
                          key={item.date + "-date"}
                          className="flex items-center justify-center px-2 py-0.5 border border-gray-200 border-t-0 first:rounded-bl last:rounded-br text-[10px] bg-white"
                          style={{ minWidth: 48 }}
                        >
                          {/* --- PERUBAHAN FORMAT TANGGAL DI SUMMARY --- */}
                          <span>{dayjs(item.date).format("DD-MMM")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- Time Series Chart Sections --- */}
        <ChartGridSection title="RMS">
          {CHANNELS.map((ch) => (
            <div key={`rms-${ch}`}>
              <ChartSlide
                channel={ch}
                titlePrefix={`RMS - ${activeChannels[ch]}`}
                data={groupedByChannel[ch]}
                lines={[{ dataKey: "rms", stroke: "#6366f1" }]}
                height={180}
                xAxisProps={xAxisConfig}
              />
            </div>
          ))}
        </ChartGridSection>

        <ChartGridSection title="Amplitude Ratio per Channel">
          {CHANNELS.map((ch, idx) => (
            <div key={`amp-${ch}`}>
              <ChartSlide
                channel={ch}
                titlePrefix={`Amplitude Ratio - ${activeChannels[ch]}`}
                data={groupedByChannel[ch]}
                lines={[
                  {
                    dataKey: "amplitude_ratio",
                    stroke: ["#10b981", "#3b82f6", "#f59e0b"][idx],
                  },
                ]}
                height={180}
                xAxisProps={xAxisConfig} 
              />
            </div>
          ))}
        </ChartGridSection>

        <ChartGridSection title="Gaps">
          {CHANNELS.map((ch) => (
            <div key={`gaps-${ch}`}>
              <ChartSlide
                channel={ch}
                titlePrefix={`Gaps - ${activeChannels[ch]}`}
                data={groupedByChannel[ch]}
                lines={[{ dataKey: "num_gap", stroke: "#f97316" }]}
                yAxisProps={{ domain: [0, 24], tickCount: 7 }}
                height={180}
                xAxisProps={xAxisConfig} 
              />
            </div>
          ))}
        </ChartGridSection>

        <ChartGridSection title="Spikes">
          {CHANNELS.map((ch) => (
            <div key={`spikes-${ch}`}>
              <ChartSlide
                channel={ch}
                titlePrefix={`Spikes - ${activeChannels[ch]}`}
                data={groupedByChannel[ch]}
                lines={[{ dataKey: "num_spikes", stroke: "#ef4444" }]}
                yAxisProps={{ domain: [0, 24], tickCount: 7 }}
                height={180}
                xAxisProps={xAxisConfig} 
              />
            </div>
          ))}
        </ChartGridSection>

        <ChartGridSection title="SP / BW / LP Percentage">
          {CHANNELS.map((ch) => (
            <div key={`sbl-${ch}`}>
              <ChartSlide
                channel={ch}
                titlePrefix={`SP / BW / LP - ${activeChannels[ch]}`}
                data={groupedByChannel[ch]}
                lines={[
                  { dataKey: "sp_percentage", stroke: "#6366f1" },
                  { dataKey: "bw_percentage", stroke: "#10b981" },
                  { dataKey: "lp_percentage", stroke: "#f59e0b" },
                ]}
                yAxisProps={{ domain: [50, 120] }}
                height={180}
                xAxisProps={xAxisConfig} 
              />
            </div>
          ))}
        </ChartGridSection>

        {stationCode && <LazyLatencyChart stationCode={stationCode} />}

        <ChartGridSection title="% Below NLNM & % Above NHNM">
          {CHANNELS.map((ch) => (
            <div key={`nlnm-nhnm-${ch}`}>
              <ChartSlide
                channel={ch}
                titlePrefix={`% Below NLNM & % Above NHNM - ${activeChannels[ch]}`}
                data={groupedByChannel[ch]}
                lines={[
                  { dataKey: "perc_below_nlnm", stroke: "#10b981" },
                  { dataKey: "perc_above_nhnm", stroke: "#ef4444" },
                ]}
                yAxisProps={{ domain: [0, 100] }}
                height={180}
                xAxisProps={xAxisConfig} 
              />
            </div>
          ))}
        </ChartGridSection>

        <ChartGridSection title="Linear Dead Channel">
          {CHANNELS.map((ch) => (
            <div key={`ldc-${ch}`}>
              <ChartSlide
                channel={ch}
                titlePrefix={`Linear Dead Channel - ${activeChannels[ch]}`}
                data={groupedByChannel[ch]}
                lines={[
                  { dataKey: "linear_dead_channel", stroke: "#6366f1" },
                ]}
                yAxisProps={{ domain: [0, "auto"] }}
                height={180}
                xAxisProps={xAxisConfig} 
              />
            </div>
          ))}
        </ChartGridSection>

        <ChartGridSection title="GSN Dead Channel">
          {CHANNELS.map((ch) => (
            <div key={`gsn-${ch}`}>
              <ChartSlide
                channel={ch}
                titlePrefix={`GSN Dead Channel - ${activeChannels[ch]}`}
                data={groupedByChannel[ch]}
                lines={[
                  { dataKey: "gsn_dead_channel", stroke: "#f59e0b" },
                ]}
                yAxisProps={{ domain: [0, "auto"] }}
                height={180}
                xAxisProps={xAxisConfig} 
              />
            </div>
          ))}
        </ChartGridSection>
      </div>
    </MainLayout>
  );
};

export default StationDetail;