// src/components/ChartSlide.tsx

import React from "react";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import CardContainer from "./Card";
import type { AxisDomain } from "recharts/types/util/types";

// Definisikan tipe untuk data yang diterima
type QCData = {
  date: string;
  [key: string]: any;
};

// Definisikan tipe untuk konfigurasi setiap garis
type LineConfig = {
  dataKey: keyof QCData;
  stroke: string;
};

// Definisikan tipe untuk konfigurasi garis batas
type ReferenceLineConfig = {
  y: number;
  label: string;
  stroke: string;
};

// Definisikan tipe untuk properti (props) komponen
interface ChartSlideProps {
  channel: string;
  titlePrefix: string;
  data: QCData[];
  lines: LineConfig[];
  yAxisProps?: {
    domain?: AxisDomain;
    width?: number;
    tickCount?: number;
  };
  height?: number;
  referenceLines?: ReferenceLineConfig[];
  xAxisProps?: any; // <-- [LANGKAH 1] Tambahkan prop baru di sini
}

const ChartSlide: React.FC<ChartSlideProps> = ({
  channel,
  titlePrefix,
  data,
  lines,
  yAxisProps = {},
  height = 240,
  referenceLines,
  xAxisProps = {}, // <-- [LANGKAH 2] Terima prop baru, dengan default objek kosong
}) => {
  return (
    <CardContainer>
      <h3 className="text-base font-medium mb-2">
        {titlePrefix} - {channel}
      </h3>
      <div style={{ width: "100%", height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" />
            
            {/*-- [LANGKAH 3] Terapkan prop baru ke komponen XAxis --*/}
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }} // Atur font dasar
              {...xAxisProps} // Terapkan semua konfigurasi dari parent (angle, formatter, dll)
            />

            <Tooltip wrapperStyle={{ fontSize: "13px", zIndex: 1000 }} />

            <YAxis
              domain={yAxisProps.domain || ["auto", "auto"]}
              tick={{ fontSize: 12 }}
              width={yAxisProps.width || 56}
              tickCount={yAxisProps.tickCount}
            />

            {lines.map((line) => (
              <Line
                key={line.dataKey as string}
                type="monotone"
                dataKey={line.dataKey as string}
                stroke={line.stroke}
                dot={false}
                isAnimationActive={false}
              />
            ))}
            
            {referenceLines && referenceLines.map((line, index) => (
              <ReferenceLine
                key={`ref-${index}`}
                y={line.y}
                label={{ value: line.label, position: "insideTopRight", fill: line.stroke, fontSize: 11 }}
                stroke={line.stroke}
                strokeDasharray="4 4"
              />
            ))}
            
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContainer>
  );
};

export default ChartSlide;