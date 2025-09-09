// src/components/LazyLatencyChart.tsx
import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useKeenSlider } from "keen-slider/react";
import axiosServer from "../utilities/AxiosServer";
import dayjs from "dayjs";
import ChartSlide from "./ChartSlide";
// Pastikan Anda juga mengimpor ChartSection jika sudah dipisah
// import ChartSection from "./ChartSection"; 

// Tipe data yang dibutuhkan
type FormattedLatencyData = {
  date: string;
  latency: number;
};
const CHANNELS = ["SHE", "SHN", "SHZ"];

// Jika ChartSection belum dipisah, definisinya ada di sini
const Arrow = ({ dir = "left" }: { dir?: "left" | "right" }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      {dir === "left" ? (
        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
  
const ChartSection = ({ title, sliderRef, sliderInstance, children }: {
    title: string;
    sliderRef: (node: HTMLDivElement | null) => void;
    sliderInstance: any;
    children: React.ReactNode;
    }) => {
    const arrowStyle: React.CSSProperties = {
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      zIndex: 40,
      background: "transparent",
      border: "none",
      padding: 8,
      cursor: "pointer",
      color: "#94a3b8",
    };
  
    const isSliderReady = !!sliderInstance.current;
  
    return (
      <section className="relative">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">{title}</h2>
        <button
          aria-label="Prev"
          style={arrowStyle}
          className={`absolute left-3 ${!isSliderReady ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => sliderInstance.current?.prev()}
          disabled={!isSliderReady}
        >
          <Arrow dir="left" />
        </button>
        <button
          aria-label="Next"
          style={arrowStyle}
          className={`absolute right-3 ${!isSliderReady ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => sliderInstance.current?.next()}
          disabled={!isSliderReady}
        >
          <Arrow dir="right" />
        </button>
        <div
          ref={sliderRef}
          className="keen-slider px-3"
          style={{ touchAction: "pan-y", cursor: "grab", userSelect: "none" }}
        >
          {children}
        </div>
      </section>
    );
  }; 

// Komponen Utama
const LazyLatencyChart = ({ stationCode }: { stationCode?: string }) => {
  const [latencyData, setLatencyData] = useState<Record<string, FormattedLatencyData[]>>({});
  const [isLoading, setIsLoading] = useState(true); 

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1, 
  });
  
  const [sliderRefLatency, sliderLatency] = useKeenSlider<HTMLDivElement>({
    mode: "snap",
    slides: { perView: 2, spacing: 8 },
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

  // ======================================================================
  // KUNCI PERBAIKAN: useEffect ini yang hilang dari kode Anda.
  // Pastikan ini ada di dalam komponen LazyLatencyChart.
  // ======================================================================
  useEffect(() => {
    // Setelah data latensi berubah (selesai dimuat),
    // panggil method `update()` pada slider untuk me-render ulang.
    if (sliderLatency.current) {
      sliderLatency.current.update();
    }
  }, [latencyData, sliderLatency]); // Dijalankan setiap kali data latensi berubah

  const slideClass = "keen-slider__slide flex-shrink-0 min-w-[0px] md:min-w-[0px] lg:min-w-[0px]";
  
  return (
    <div ref={ref}>
      <ChartSection title="Latency per Channel" sliderRef={sliderRefLatency} sliderInstance={sliderLatency}>
        {isLoading ? (
          <div className="keen-slider__slide flex-shrink-0 min-w-[0px] md:min-w-[0px] lg:min-w-[0px]">
            <div className="bg-white rounded-lg shadow-sm p-4 h-[260px] flex items-center justify-center text-gray-500 font-medium">
              Memuat data latensi...
            </div>
          </div>
        ) : (
          CHANNELS.map((ch, idx) => (
            <div key={ch} className={slideClass}>
              <div className="px-2 w-full">
                <ChartSlide
                  channel={ch}
                  titlePrefix="Latency"
                  data={latencyData[ch] || []}
                  lines={[{ dataKey: "latency", stroke: ["#8b5cf6", "#ec4899", "#f97316"][idx] }]}
                />
              </div>
            </div>
          ))
        )}
      </ChartSection>
    </div>
  );
};

export default LazyLatencyChart;