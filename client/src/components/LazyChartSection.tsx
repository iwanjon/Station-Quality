// src/components/LazyChartSection.tsx
import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import axiosServer from '../utilities/AxiosServer';

// Komponen placeholder (kerangka) saat loading
const ChartSkeleton = () => (
    <div className="keen-slider px-3" style={{ display: 'flex' }}>
        <div className="keen-slider__slide" style={{ minWidth: '50%' }}>
            <div className="px-2 w-full h-[288px] bg-gray-200 animate-pulse rounded-xl"></div>
        </div>
        <div className="keen-slider__slide" style={{ minWidth: '50%' }}>
            <div className="px-2 w-full h-[288px] bg-gray-200 animate-pulse rounded-xl"></div>
        </div>
    </div>
);

// Tipe untuk data yang akan diterima oleh children (render prop)
type RenderPropsData = {
  [key: string]: any[];
};

// Tipe untuk props komponen
interface LazyChartSectionProps {
  title: string;
  apiEndpoint: string;
  stationCode: string;
  dataProcessor: (rawData: any) => RenderPropsData;
  children: (data: RenderPropsData) => React.ReactNode;
  sliderRef: (node: HTMLDivElement | null) => void;
  sliderInstance: any;
}

// Komponen Arrow harus didefinisikan atau diimpor di sini
const Arrow = ({ dir = "left" }: { dir?: "left" | "right" }) => ( <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden> {dir === "left" ? ( <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /> ) : ( <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /> )} </svg> );


const LazyChartSection: React.FC<LazyChartSectionProps> = ({
  title,
  apiEndpoint,
  stationCode,
  dataProcessor,
  children,
  sliderRef,
  sliderInstance,
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true, // Hanya fetch data sekali saat pertama kali terlihat
    threshold: 0.1,    // Trigger saat 10% komponen terlihat
  });

  const [data, setData] = useState<RenderPropsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Hanya fetch jika terlihat, punya stationCode, dan belum ada data
      if (!inView || !stationCode || data) return;

      setIsLoading(true);
      setError(null);
      try {
        const fullApiEndpoint = apiEndpoint.replace(':stationCode', stationCode);
        const res = await axiosServer.get(fullApiEndpoint);
        const processedData = dataProcessor(res.data);
        setData(processedData);
      } catch (err) {
        console.error(`Error fetching data for ${title}:`, err);
        setError('Gagal memuat data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [inView, stationCode, apiEndpoint, dataProcessor, title, data]);
  
  const arrowStyle: React.CSSProperties = { position: "absolute", top: "50%", transform: "translateY(-50%)", zIndex: 40, background: "transparent", border: "none", padding: 8, cursor: "pointer", color: "#94a3b8" };

  return (
    <section className="relative" ref={ref}>
      <h2 className="text-lg font-semibold text-gray-700 mb-3">{title}</h2>
      
      {/* Tampilkan panah navigasi hanya jika tidak loading atau error */}
      {!isLoading && !error && data && (
        <>
            <button aria-label="Prev" style={{ ...arrowStyle, left: 12 }} onClick={() => sliderInstance.current?.prev()}><Arrow dir="left" /></button>
            <button aria-label="Next" style={{ ...arrowStyle, right: 12 }} onClick={() => sliderInstance.current?.next()}><Arrow dir="right" /></button>
        </>
      )}

      <div ref={sliderRef} className="keen-slider px-3" style={{ touchAction: "pan-y", cursor: "grab", userSelect: "none" }}>
        {isLoading && <ChartSkeleton />}
        {error && <div className="text-red-500 text-center p-4 w-full">{error}</div>}
        {data && children(data)}
      </div>
    </section>
  );
};

export default LazyChartSection;