// src/components/LazyLatencyChart.tsx
import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import axiosServer from "../utilities/AxiosServer";
import dayjs from "dayjs";
import ChartSlide from "./ChartSlide";

// Tipe data yang dibutuhkan
type FormattedLatencyData = {
  date: string;
  latency: number | null; // Latency bisa null jika tidak ada data
};

// Ubah dari CHANNELS full ke komponen axis dan prefix prioritas
const COMPONENTS = ["E", "N", "Z"];
const PREFIXES = ["SH", "BH", "HH"];

// Komponen Utama
const LazyLatencyChart = ({ stationCode }: { stationCode?: string }) => {
  // Ubah state untuk menyimpan tidak hanya array data, tapi juga channel string mana yang akhirnya digunakan
  const [latencyData, setLatencyData] = useState<Record<string, { channel: string, data: FormattedLatencyData[] }>>({});
  const [isLoading, setIsLoading] = useState(true);

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    const fetchLatencyData = async () => {
      if (!stationCode) { setIsLoading(false); return; }
      try {
        const allLatencyData: Record<string, { channel: string, data: FormattedLatencyData[] }> = {};

        // Fetch pararel per axis (E, N, Z), tapi di dalam masing-masing axis, cari berurutan SH -> BH -> HH
        const fetchPromises = COMPONENTS.map(async (comp) => {
          let finalChannel = `SH${comp}`; // Default fallback
          let finalData: FormattedLatencyData[] = [];

          for (const prefix of PREFIXES) {
            const targetChannel = `${prefix}${comp}`;
            try {
              const response = await axiosServer.get(`/api/metadata/latency/${stationCode}/${targetChannel}`);
              const rawData = response.data;

              // Jika data ditemukan dan tidak kosong, set hasil dan break loop agar tidak fetch prioritas di bawahnya
              if (rawData && Object.keys(rawData).length > 0) {
                finalChannel = targetChannel;
                finalData = Object.entries(rawData)
                  .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                  .map(([ts, val]) => ({
                    date: dayjs(ts).format('YYYY-MM-DD HH:mm'),
                    latency: val === null || val === undefined ? null : (val as number),
                  }));
                break; 
              }
            } catch (err) {
              // Abaikan error (misal 404 Not Found), biarkan loop mencoba prefix selanjutnya
            }
          }

          allLatencyData[comp] = { channel: finalChannel, data: finalData };
        });

        await Promise.all(fetchPromises);
        setLatencyData(allLatencyData);
      } catch (err) { 
        console.error("Error fetching latency data:", err); 
      } finally { 
        setIsLoading(false); 
      }
    };

    if (inView && isLoading) {
      fetchLatencyData();
    }
  }, [inView, stationCode, isLoading]);
  
  // --- KONFIGURASI BARU UNTUK X-AXIS ---
  const xAxisConfig = {
    tickFormatter: (tickItem: string) => dayjs(tickItem).format("DD-MMM"),
    angle: -45,
    textAnchor: "end",
    height: 50,
    interval: 'preserveStartEnd', // Opsi agar label tidak terlalu padat
  };

  return (
    <div ref={ref} className="bg-white p-3 rounded-xl shadow mb-4">
      <h2 className="text-lg font-bold mb-2 text-gray-800">Latency per Channel</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="rounded-lg bg-gray-100 h-[180px] flex items-center justify-center text-gray-500 font-medium text-xs">
                Memuat data latensi...
              </div>
            ))
          : COMPONENTS.map((comp, idx) => {
              const channelInfo = latencyData[comp] || { channel: `SH${comp}`, data: [] };
              return (
                <div key={comp}>
                  <ChartSlide
                    channel={channelInfo.channel}
                    titlePrefix={`Latency - ${channelInfo.channel}`} // Title disesuaikan dinamis
                    data={channelInfo.data}
                    lines={[{ dataKey: "latency", stroke: ["#8b5cf6", "#ec4899", "#f97316"][idx] }]}
                    yAxisProps={{ domain: [0, 600] }}
                    referenceLines={[{ y: 180, label: "", stroke: "black" }]}
                    height={180}
                    xAxisProps={xAxisConfig} 
                  />
                </div>
              );
            })}
      </div>
    </div>
  );
};

export default LazyLatencyChart;