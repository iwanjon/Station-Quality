// src/components/ChartSlide.tsx

import React from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import CardContainer from "./Card";

// FIX: Impor tipe AxisDomain dari recharts
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

// Definisikan tipe untuk properti (props) komponen
interface ChartSlideProps {
  channel: string;
  titlePrefix: string;
  data: QCData[];
  lines: LineConfig[];
  yAxisProps?: {
    // FIX: Gunakan tipe AxisDomain yang diimpor
    domain?: AxisDomain;
    width?: number;
  };
  height?: number;
}

const ChartSlide: React.FC<ChartSlideProps> = ({
  channel,
  titlePrefix,
  data,
  lines,
  yAxisProps = {},
  height = 240,
}) => {
  return (
    <CardContainer>
      <h3 className="text-base font-medium mb-2">
        {titlePrefix} - {channel}
      </h3>
      <div style={{ width: "100%", height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            {/* Elemen Seragam */}
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <Tooltip wrapperStyle={{ fontSize: "13px", zIndex: 1000 }} />

            {/* Sumbu Y yang dapat dikustomisasi */}
            <YAxis
              // Sekarang tipe domain sudah cocok dan tidak akan error lagi
              domain={yAxisProps.domain || ["auto", "auto"]}
              tick={{ fontSize: 12 }}
              width={yAxisProps.width || 56}
            />

            {/* Render semua garis secara dinamis */}
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
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContainer>
  );
};

export default ChartSlide;