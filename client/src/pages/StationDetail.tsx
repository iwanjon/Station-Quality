// src/pages/StationDetail.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosServer from "../utilities/AxiosServer";
import "keen-slider/keen-slider.min.css";
import { useKeenSlider } from "keen-slider/react";
import ChartSlide from "../components/ChartSlide";
// import LazyChartSection from "../components/LazyChartSection";f
// import dayjs from "dayjs";
import LazyLatencyChart from "../components/LazyLatencyChart";
import ChartSection from '../components/ChartSection'

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

type FormattedLatencyData = {
  date: string; // Ini akan menjadi timestamp
  latency: number;
}

const CHANNELS = ["SHE", "SHN", "SHZ"];

// mainpage component
const StationDetail = () => {
  const { stationCode } = useParams<{ stationCode: string }>();
  const [qcData, setQcData] = useState<QCData[]>([]);
  // const [latencyData, setLatencyData] = useState<Record<string, FormattedLatencyData[]>>({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []); 

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

  // const [sliderRefLatency, sliderLatency] = useKeenSlider<HTMLDivElement>({ mode: "snap", slides: { perView: 2, spacing: 8 } });

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

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-center text-2xl font-bold">
        Detail Stasiun {stationCode}
      </h1>

      {/* RMS */}
      <ChartSection title="RMS per Channel" sliderRef={sliderRefRMS} sliderInstance={sliderRMS}>
        {CHANNELS.map((ch) => (
          <div key={ch} className={slideClass}>
            {/* FIX: Tambahkan kembali div ini untuk memberikan jarak antar grafik */}
            <div className="px-2 w-full">
              <ChartSlide
                channel={ch}
                titlePrefix="RMS"
                data={groupedByChannel[ch]}
                lines={[{ dataKey: "rms", stroke: "#6366f1" }]}
              />
            </div>
          </div>
        ))}
      </ChartSection>

      {/* Amplitude */}
      <ChartSection title="Amplitude Ratio per Channel" sliderRef={sliderRefAmp} sliderInstance={sliderAmp}>
        {CHANNELS.map((ch, idx) => (
          <div key={ch} className={slideClass}>
            {/* FIX: Tambahkan kembali div ini untuk memberikan jarak antar grafik */}
            <div className="px-2 w-full">
              <ChartSlide
                channel={ch}
                titlePrefix="Amplitude Ratio"
                data={groupedByChannel[ch]}
                lines={[{ dataKey: "amplitude_ratio", stroke: ["#10b981", "#3b82f6", "#f59e0b"][idx] }]}
                height={260}
              />
            </div>
          </div>
        ))}
      </ChartSection>
      
      {/* latensi */}
      {/* <ChartSection title="Latency per Channel" sliderRef={sliderRefLatency} sliderInstance={sliderLatency}>
        {CHANNELS.map((ch, idx) => (
          <div key={ch} className={slideClass}>
            <div className="px-2 w-full">
              <ChartSlide
                channel={ch}
                titlePrefix="Latency"
                data={latencyData[ch] || []} // Ambil data dari state latency
                lines={[{ dataKey: "latency", stroke: ["#8b5cf6", "#ec4899", "#f97316"][idx] }]}
              />
            </div>
          </div>
        ))}
      </ChartSection> */}
      <LazyLatencyChart stationCode={stationCode} />

      {/* Spikes */}
      <ChartSection title="Spikes" sliderRef={sliderRefGap} sliderInstance={sliderGap}>
        {CHANNELS.map((ch) => (
          <div key={ch} className={slideClass}>
            {/* FIX: Tambahkan kembali div ini untuk memberikan jarak antar grafik */}
            <div className="px-2 w-full">
              <ChartSlide
                  channel={ch}
                  titlePrefix="Spikes"
                  data={groupedByChannel[ch]}
                  lines={[{ dataKey: 'num_spikes', stroke: '#10b981' }]}
              />
            </div>
          </div>
        ))}
      </ChartSection>

      {/* Noise */}
      <ChartSection title="Noise" sliderRef={sliderRefNoise} sliderInstance={sliderNoise}>
        {CHANNELS.map((ch) => (
          <div key={ch} className={slideClass}>
            {/* FIX: Tambahkan kembali div ini untuk memberikan jarak antar grafik */}
            <div className="px-2 w-full">
              <ChartSlide
                  channel={ch}
                  titlePrefix="Noise"
                  data={groupedByChannel[ch]}
                  lines={[
                    { dataKey: 'perc_above_nhnm', stroke: '#f59e0b' },
                    { dataKey: 'perc_below_nlnm', stroke: '#3b82f6' },
                  ]}
                  yAxisProps={{ domain: [0, 10] }}
              />
            </div>
          </div>
        ))}
      </ChartSection>
      
      {/* SP / BW / LP */}
      <ChartSection title="SP / BW / LP Percentage" sliderRef={sliderRefPerc} sliderInstance={sliderPerc}>
        {CHANNELS.map((ch) => (
          <div key={ch} className={slideClass}>
            {/* FIX: Tambahkan kembali div ini untuk memberikan jarak antar grafik */}
            <div className="px-2 w-full">
              <ChartSlide
                channel={ch}
                titlePrefix="SP / BW / LP"
                data={groupedByChannel[ch]}
                lines={[
                  { dataKey: 'sp_percentage', stroke: '#6366f1' },
                  { dataKey: 'bw_percentage', stroke: '#10b981' },
                  { dataKey: 'lp_percentage', stroke: '#f59e0b' },
                ]}
                yAxisProps={{ domain: [50, 120] }}
              />
            </div>
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
    </div>
  );
};

export default StationDetail;

// // src/pages/StationDetail.tsx

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