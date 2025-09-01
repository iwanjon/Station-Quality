// src/pages/StationDetail.tsx
import { useEffect, useState } from "react";
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

const CHANNELS = ["SHE", "SHN", "SHZ"];

// komponen arrow untuk slider  
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

// component wrapper section chart
const ChartSection = ({
  title,
  sliderRef,
  sliderInstance,
  children,
}: {
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
    color: "#94a3b8", // gray-400
  };

  return (
    <section className="relative">
      <h2 className="text-lg font-semibold text-gray-700 mb-3">{title}</h2>

      {/* Panah navigasi */}
      <button
        aria-label="Prev"
        style={{ ...arrowStyle, left: 12 }}
        onClick={() => sliderInstance.current?.prev()}
      >
        <Arrow dir="left" />
      </button>
      <button
        aria-label="Next"
        style={{ ...arrowStyle, right: 12 }}
        onClick={() => sliderInstance.current?.next()}
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

// mainpage component
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

  // sliders
  const [sliderRefRMS, sliderRMS] = useKeenSlider<HTMLDivElement>({
    mode: "snap",
    slides: { perView: 2, spacing: 8 },
  });
  const [sliderRefAmp, sliderAmp] = useKeenSlider<HTMLDivElement>({
    mode: "snap",
    slides: { perView: 2, spacing: 8 },
  });
  const [sliderRefGap, sliderGap] = useKeenSlider<HTMLDivElement>({
    mode: "snap",
    slides: { perView: 2, spacing: 8 },
  });

  const [sliderRefNoise, sliderNoise] = useKeenSlider<HTMLDivElement>({
    mode: "snap",
    slides: { perView: 2, spacing: 8 },
  });
  // const [sliderRefDead, sliderDead] = useKeenSlider<HTMLDivElement>({
  //   mode: "snap",
  //   slides: { perView: 2, spacing: 8 },
  // });
  const [sliderRefPerc, sliderPerc] = useKeenSlider<HTMLDivElement>({
    mode: "snap",
    slides: { perView: 2, spacing: 8 },
  });

  const slideClass =
    "keen-slider__slide flex-shrink-0 min-w-[0px] md:min-w-[0px] lg:min-w-[0px]";

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

      {/* Gap / Overlap / Spikes */}
      <ChartSection title="Spikes" sliderRef={sliderRefGap} sliderInstance={sliderGap}>
        {CHANNELS.map((ch) => (
          <div key={ch} className={slideClass}>
            <CardContainer>
              <h3 className="text-base font-medium mb-2">Gap/Overlap/Spikes - {ch}</h3>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={groupedByChannel[ch]}>
                    <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    {/* <Line dataKey="num_gap" stroke="#ef4444" dot={false} /> */}
                    {/* <Line dataKey="num_overlap" stroke="#3b82f6" dot={false} /> */}
                    <Line dataKey="num_spikes" stroke="#10b981" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContainer>
          </div>
        ))}
      </ChartSection>

      {/* Noise */}
      <ChartSection title="Noise" sliderRef={sliderRefNoise} sliderInstance={sliderNoise}>
        {CHANNELS.map((ch) => (
          <div key={ch} className={slideClass}>
            <CardContainer>
              <h3 className="text-base font-medium mb-2">Noise - {ch}</h3>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={groupedByChannel[ch]}>
                    <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line dataKey="perc_above_nhnm" stroke="#f59e0b" dot={false} />
                    <Line dataKey="perc_below_nlnm" stroke="#3b82f6" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContainer>
          </div>
        ))}
      </ChartSection>

      {/* Dead Channel
      <ChartSection title="Dead Channel" sliderRef={sliderRefDead} sliderInstance={sliderDead}>
        {CHANNELS.map((ch) => (
          <div key={ch} className={slideClass}>
            <CardContainer>
              <h3 className="text-base font-medium mb-2">Dead Channel - {ch}</h3>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={groupedByChannel[ch]}>
                    <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line dataKey="linear_dead_channel" stroke="#ef4444" dot={false} />
                    <Line dataKey="gsn_dead_channel" stroke="#10b981" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContainer>
          </div>
        ))}
      </ChartSection> */}

      {/* SP / BW / LP */}
      <ChartSection title="SP / BW / LP Percentage" sliderRef={sliderRefPerc} sliderInstance={sliderPerc}>
        {CHANNELS.map((ch) => (
          <div key={ch} className={slideClass}>
            <CardContainer>
              <h3 className="text-base font-medium mb-2">SP / BW / LP - {ch}</h3>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={groupedByChannel[ch]}>
                    <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[50, 120]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line dataKey="sp_percentage" stroke="#6366f1" dot={false} />
                    <Line dataKey="bw_percentage" stroke="#10b981" dot={false} />
                    <Line dataKey="lp_percentage" stroke="#f59e0b" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContainer>
          </div>
        ))}
      </ChartSection>
    </div>
  );
};

export default StationDetail;