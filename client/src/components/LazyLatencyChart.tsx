// src/components/LazyLatencyChart.tsx
import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import axiosServer from "../utilities/AxiosServer";
import dayjs from "dayjs";
import ChartSlide from "./ChartSlide";

// Tipe data yang dibutuhkan
type FormattedLatencyData = {
  date: string;
  latency: number;
};
const CHANNELS = ["SHE", "SHN", "SHZ"];

// Komponen Utama
const LazyLatencyChart = ({ stationCode }: { stationCode?: string }) => {
  const [latencyData, setLatencyData] = useState<Record<string, FormattedLatencyData[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    const fetchLatencyData = async () => {
      if (!stationCode) { setIsLoading(false); return; }
      try {
        const requests = CHANNELS.map(ch => axiosServer.get(`/api/metadata/latency/${stationCode}/${ch}`));
        const responses = await Promise.all(requests);
        const allLatencyData: Record<string, FormattedLatencyData[]> = {};
        responses.forEach((response, index) => {
          const channel = CHANNELS[index];
          const rawData = response.data;
          allLatencyData[channel] = Object.entries(rawData).map(([ts, val]) => ({
            date: dayjs(ts).format('YYYY-MM-DD HH:mm'),
            latency: val as number,
          }));
        });
        setLatencyData(allLatencyData);
      } catch (err) { console.error("Error fetching latency data:", err); }
      finally { setIsLoading(false); }
    };

    if (inView && isLoading) {
      fetchLatencyData();
    }
  }, [inView, stationCode, isLoading]);

  // --- DESAIN BARU: Grid 3 kolom seperti RMS/Spikes ---
  return (
    <div ref={ref} className="bg-white p-4 sm:p-6 rounded-2xl shadow-md mt-8">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Latency per Channel</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="rounded-lg bg-gray-100 h-[260px] flex items-center justify-center text-gray-500 font-medium">
                Memuat data latensi...
              </div>
            ))
          : CHANNELS.map((ch, idx) => (
              <div key={ch}>
                <ChartSlide
                  channel={ch}
                  titlePrefix="Latency"
                  data={latencyData[ch] || []}
                  lines={[{ dataKey: "latency", stroke: ["#8b5cf6", "#ec4899", "#f97316"][idx] }]}
                />
              </div>
            ))}
      </div>
    </div>
  );
};

export default LazyLatencyChart;