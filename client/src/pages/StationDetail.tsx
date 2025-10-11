import { useEffect, useState } from "react";
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
const CHANNELS_FULL = ["SHE", "SHN", "SHZ"];

// --- FUNGSI BARU UNTUK FORMAT TANGGAL ---
const formatDateTick = (tickItem: string) => dayjs(tickItem).format("DD-MMM");

const StationDetail = () => {
  const { stationCode } = useParams<{ stationCode: string }>();
  const navigate = useNavigate();

  const [qcData, setQcData] = useState<QCData[]>([]);
  const [summaryData, setSummaryData] = useState<Record<string, SummaryDataItem[]>>({
    SHE: [],
    SHN: [],
    SHZ: [],
  });
  const [loadingSummary, setLoadingSummary] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stationList, setStationList] = useState<string[]>([]);

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
        setSummaryData({
          SHE: res.data,
          SHN: res.data,
          SHZ: res.data,
        });
      } catch (err) {
        console.error("Gagal memuat data summary:", err);
        setSummaryData({ SHE: [], SHN: [], SHZ: [] });
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchQcData();
    fetchSummaryData();

  }, [stationCode]);
  
  // --- KONFIGURASI BARU UNTUK X-AXIS ---
  // Objek ini akan kita teruskan sebagai props ke setiap ChartSlide
  const xAxisConfig = {
    tickFormatter: formatDateTick, // Menggunakan fungsi format tanggal baru
    angle: -45, // Memutar label 45 derajat
    textAnchor: "end", // Meratakan teks setelah diputar
    height: 50, // Menambah ruang untuk label diagonal
    interval: 0, // Memastikan semua 7 label tanggal ditampilkan
  };

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
            <button
              type="button"
              className="bg-gray-200 text-gray-800 font-bold px-3 py-1.5 rounded-md hover:bg-gray-300 text-xs"
              onClick={() => navigate('/dashboard')}
            >
              Station
            </button>
            <select
              value={stationCode}
              onChange={(e) => {
                const newStationCode = e.target.value;
                if (newStationCode) {
                  navigate(`/station/${newStationCode}`);
                }
              }}
              className="p-1 border rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-bold text-xs"
              style={{ minWidth: 80 }}
            >
              {stationList.map((station) => (
                <option key={station} value={station}>
                  {station}
                </option>
              ))}
            </select>
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
              {CHANNELS_FULL.map((channel) => (
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
                titlePrefix={`RMS - SH${ch}`}
                data={groupedByChannel[ch]}
                lines={[{ dataKey: "rms", stroke: "#6366f1" }]}
                height={180}
                xAxisProps={xAxisConfig} // <-- PROP BARU DITERUSKAN
              />
            </div>
          ))}
        </ChartGridSection>

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
                height={180}
                xAxisProps={xAxisConfig} // <-- PROP BARU DITERUSKAN
              />
            </div>
          ))}
        </ChartGridSection>

        <ChartGridSection title="Gaps">
          {CHANNELS.map((ch) => (
            <div key={`gaps-${ch}`}>
              <ChartSlide
                channel={ch}
                titlePrefix="Gaps"
                data={groupedByChannel[ch]}
                lines={[{ dataKey: "num_gap", stroke: "#f97316" }]}
                yAxisProps={{ domain: [0, 24], tickCount: 7 }}
                height={180}
                xAxisProps={xAxisConfig} // <-- PROP BARU DITERUSKAN
              />
            </div>
          ))}
        </ChartGridSection>

        <ChartGridSection title="Spikes">
          {CHANNELS.map((ch) => (
            <div key={`spikes-${ch}`}>
              <ChartSlide
                channel={ch}
                titlePrefix="Spikes"
                data={groupedByChannel[ch]}
                lines={[{ dataKey: "num_spikes", stroke: "#ef4444" }]}
                yAxisProps={{ domain: [0, 24], tickCount: 7 }}
                height={180}
                xAxisProps={xAxisConfig} // <-- PROP BARU DITERUSKAN
              />
            </div>
          ))}
        </ChartGridSection>

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
                height={180}
                xAxisProps={xAxisConfig} // <-- PROP BARU DITERUSKAN
              />
            </div>
          ))}
        </ChartGridSection>

        <LazyLatencyChart stationCode={stationCode} />

        <ChartGridSection title="% Below NLNM & % Above NHNM">
          {CHANNELS.map((ch) => (
            <div key={`nlnm-nhnm-${ch}`}>
              <ChartSlide
                channel={ch}
                titlePrefix={`% Below NLNM & % Above NHNM - SH${ch}`}
                data={groupedByChannel[ch]}
                lines={[
                  { dataKey: "perc_below_nlnm", stroke: "#10b981" },
                  { dataKey: "perc_above_nhnm", stroke: "#ef4444" },
                ]}
                yAxisProps={{ domain: [0, 100] }}
                height={180}
                xAxisProps={xAxisConfig} // <-- PROP BARU DITERUSKAN
              />
            </div>
          ))}
        </ChartGridSection>

        <ChartGridSection title="Linear Dead Channel">
          {CHANNELS.map((ch) => (
            <div key={`ldc-${ch}`}>
              <ChartSlide
                channel={ch}
                titlePrefix={`Linear Dead Channel - SH${ch}`}
                data={groupedByChannel[ch]}
                lines={[
                  { dataKey: "linear_dead_channel", stroke: "#6366f1" },
                ]}
                yAxisProps={{ domain: [0, "auto"] }}
                height={180}
                xAxisProps={xAxisConfig} // <-- PROP BARU DITERUSKAN
              />
            </div>
          ))}
        </ChartGridSection>

        <ChartGridSection title="GSN Dead Channel">
          {CHANNELS.map((ch) => (
            <div key={`gsn-${ch}`}>
              <ChartSlide
                channel={ch}
                titlePrefix={`GSN Dead Channel - SH${ch}`}
                data={groupedByChannel[ch]}
                lines={[
                  { dataKey: "gsn_dead_channel", stroke: "#f59e0b" },
                ]}
                yAxisProps={{ domain: [0, "auto"] }}
                height={180}
                xAxisProps={xAxisConfig} // <-- PROP BARU DITERUSKAN
              />
            </div>
          ))}
        </ChartGridSection>
      </div>
    </MainLayout>
  );
};

export default StationDetail;