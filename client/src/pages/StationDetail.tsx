// src/pages/StationDetail.tsx
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axiosServer from "../utilities/AxiosServer";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import CardContainer from "../components/Card";
import "keen-slider/keen-slider.min.css";
import { useKeenSlider } from "keen-slider/react";

type QCData = {
  code?: string;
  date: string;
  channel: string;
  rms: number | string;
  amplitude_ratio: number | string;
};

const CHANNELS = ["SHE", "SHN", "SHZ"];

const Arrow = ({ dir = "left" }: { dir?: "left" | "right" }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    {dir === "left" ? (
      <path
        d="M15 18L9 12L15 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : (
      <path
        d="M9 6L15 12L9 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </svg>
);

const StationDetail = () => {
  const { stationCode } = useParams<{ stationCode: string }>();
  const [qcData, setQcData] = useState<QCData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosServer.get(
          `/api/qc/data/detail/7days/${stationCode}`
        );
        const normalized: QCData[] = (res.data || []).map((d: any) => ({
          ...d,
          rms: d.rms !== undefined ? Number(d.rms) : 0,
          amplitude_ratio:
            d.amplitude_ratio !== undefined ? Number(d.amplitude_ratio) : 0,
        }));
        setQcData(normalized);
      } catch (err) {
        console.error("Error fetching QC 7days:", err);
      }
    };
    if (stationCode) fetchData();
  }, [stationCode]);

  const groupedByChannel = CHANNELS.reduce<Record<string, QCData[]>>(
    (acc, ch) => {
      acc[ch] = qcData.filter((d) => d.channel === ch);
      return acc;
    },
    {}
  );

  // Keen slider config (gunakan perView:auto supaya min-w dipakai)
  const [sliderRefRMS, sliderRMS] = useKeenSlider<HTMLDivElement>({
    mode: "snap",
    slides: { perView: 2, spacing: 2 },
  });

  const [sliderRefAmp, sliderAmp] = useKeenSlider<HTMLDivElement>({
    mode: "snap",
    slides: { perView: 2, spacing: 2 },
  });

  // Styling slide: biar grafik tidak penuh layar
  const slideClass =
    "keen-slider__slide flex-shrink-0 min-w-[360px] md:min-w-[480px] lg:min-w-[560px]";

  const arrowStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 40,
    background: "transparent",
    border: "none",
    padding: 8,
    cursor: "pointer",
    color: "#475569", // gray-600
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-center text-2xl font-bold">
        Detail Stasiun {stationCode}
      </h1>

      {/* RMS */}
      <section className="relative">
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-gray-700">
            RMS per Channel
          </h2>
        </div>

        <div className="relative">
          <button
            aria-label="Prev RMS"
            style={{ ...arrowStyle, left: 12 }}
            onClick={() => sliderRMS.current?.prev()}
          >
            <Arrow dir="left" />
          </button>
          <button
            aria-label="Next RMS"
            style={{ ...arrowStyle, right: 12 }}
            onClick={() => sliderRMS.current?.next()}
          >
            <Arrow dir="right" />
          </button>

          <div
            ref={sliderRefRMS}
            className="keen-slider px-3"
            style={{
              touchAction: "pan-y",
              userSelect: "none",
              cursor: "grab",
            }}
          >
            {CHANNELS.map((ch) => (
              <div key={ch} className={slideClass}>
                <div className="px-2 w-full">
                  <CardContainer>
                    <h3 className="text-base font-medium mb-2">RMS - {ch}</h3>
                    <div style={{ width: "100%", height: 240 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={groupedByChannel[ch]}>
                          <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis
                            domain={["auto", "auto"]}
                            tick={{ fontSize: 12 }}
                            width={56}
                          />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="rms"
                            stroke="#6366f1"
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContainer>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Amplitude */}
      <section className="relative">
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-gray-700">
            Amplitude Ratio per Channel
          </h2>
        </div>

        <div className="relative">
          <button
            aria-label="Prev Amp"
            style={{ ...arrowStyle, left: 12 }}
            onClick={() => sliderAmp.current?.prev()}
          >
            <Arrow dir="left" />
          </button>
          <button
            aria-label="Next Amp"
            style={{ ...arrowStyle, right: 12 }}
            onClick={() => sliderAmp.current?.next()}
          >
            <Arrow dir="right" />
          </button>

          <div
            ref={sliderRefAmp}
            className="keen-slider px-3"
            style={{
              touchAction: "pan-y",
              userSelect: "none",
              cursor: "grab",
            }}
          >
            {CHANNELS.map((ch, idx) => (
              <div key={ch} className={slideClass}>
                <div className="px-2 w-full">
                  <CardContainer>
                    <h3 className="text-base font-medium mb-2">
                      Amplitude Ratio - {ch}
                    </h3>
                    <div style={{ width: "100%", height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={groupedByChannel[ch]}>
                          <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="amplitude_ratio"
                            stroke={["#10b981", "#3b82f6", "#f59e0b"][idx]}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContainer>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .keen-slider__slide { padding-left: 6px; padding-right: 6px; }
        button[aria-label] { outline: none; }
        button[aria-label]:focus {
          box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
};

export default StationDetail;
