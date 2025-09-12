// src/components/ChartSection.tsx
import React from 'react';

// Komponen Arrow sekarang ada di sini
const Arrow = ({ dir = "left" }: { dir?: "left" | "right" }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    {dir === "left" ? (
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    )}
  </svg>
);

// Komponen ChartSection sekarang menjadi komponen utama di file ini
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
    color: "#94a3b8", // gray-400
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

export default ChartSection;