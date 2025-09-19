import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosServer from "../utilities/AxiosServer";
import ChartSlide from "../components/ChartSlide";
import LazyLatencyChart from "../components/LazyLatencyChart";
import MainLayout from "../layouts/MainLayout"; 

type QCData = {
  code?: string;
  date: string;
  channel: string;
  name: string;
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

const CHANNELS = ["E", "N", "Z"];

const StationDetail = () => {
  const { stationCode } = useParams<{ stationCode: string }>();
  const [qcData, setQcData] = useState<QCData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    window.scrollTo(0, 0);
  }, []); 

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosServer.get(`/api/qc/data/detail/7days/${stationCode}`);
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
        console.error("Error fetching QC 7days:", err);
        setError("Gagal memuat data timeseries untuk stasiun ini.");
      } finally {
        setLoading(false);
      }
    };
    if (stationCode) fetchData();
  }, [stationCode]);
  
  // Tips Debugging: Cek isi qcData di konsol untuk memastikan data dan formatnya benar
  // console.log("Data QC yang sudah dinormalisasi:", qcData);

  const groupedByChannel = CHANNELS.reduce<Record<string, QCData[]>>(
    (acc, ch) => {
      // [PERBAIKAN KRUSIAL] Gunakan .toUpperCase() untuk mengatasi case-sensitivity
      // Ini akan mengubah "she" -> "SHE" sebelum dicek dengan "E"
      acc[ch] = qcData.filter((d) => d.channel.toUpperCase().includes(ch));
      return acc;
    },
    {}
  );

  const ChartGridSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </div>
  );
  
  if (loading) {
    return (
        <MainLayout>
            <div className="flex justify-center items-center h-screen">
                <p>Loading timeseries data...</p>
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
        <h1 className="text-center text-3xl font-bold text-gray-900">
          Detail Stasiun {stationCode}
        </h1>

        {/* RMS */}
        <ChartGridSection title="RMS per Channel">
          {CHANNELS.map((ch) => (
            <div key={`rms-${ch}`}>
              <ChartSlide
                channel={ch}
                titlePrefix="RMS"
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
                lines={[{ dataKey: "amplitude_ratio", stroke: ["#10b981", "#3b82f6", "#f59e0b"][idx] }]}
              />
            </div>
          ))}
        </ChartGridSection>
        
        {/* Latency Chart (tidak diubah) */}
        <LazyLatencyChart stationCode={stationCode} />

        {/* Spikes */}
        <ChartGridSection title="Spikes">
          {CHANNELS.map((ch) => (
            <div key={`spikes-${ch}`}>
              <ChartSlide
                channel={ch}
                titlePrefix="Spikes"
                data={groupedByChannel[ch]}
                lines={[{ dataKey: 'num_spikes', stroke: '#ef4444' }]}
              />
            </div>
          ))}
        </ChartGridSection>

        {/* Noise */}
        <ChartGridSection title="Noise">
          {CHANNELS.map((ch) => (
            <div key={`noise-${ch}`}>
              <ChartSlide
                channel={ch}
                titlePrefix="Noise"
                data={groupedByChannel[ch]}
                lines={[
                  { dataKey: 'perc_above_nhnm', stroke: '#f59e0b'},
                  { dataKey: 'perc_below_nlnm', stroke: '#3b82f6'},
                ]}
                yAxisProps={{ domain: [0, 100] }}
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
                  { dataKey: 'sp_percentage', stroke: '#6366f1'},
                  { dataKey: 'bw_percentage', stroke: '#10b981'},
                  { dataKey: 'lp_percentage', stroke: '#f59e0b'},
                ]}
                yAxisProps={{ domain: [50, 120] }}
              />
            </div>
          ))}
        </ChartGridSection>
      </div>
    </MainLayout>
  );
};

export default StationDetail;