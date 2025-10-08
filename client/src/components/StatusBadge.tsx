// components/StatusBadge.tsx

import React from "react";

interface Props {
  value: string; // Teks yang akan ditampilkan, misal: "Good", "Fair", "Poor", "No Data"
}

// Mapping label Inggris ke warna sesuai permintaan
const styleMap: Record<string, string> = {
  Good: "bg-green-100 text-green-600",
  Fair: "bg-orange-100 text-orange-800",
  Poor: "bg-red-100 text-red-800",
  "No Data": "bg-gray-100 text-gray-800",
};

const StatusBadge: React.FC<Props> = ({ value }) => (
  <span
    className={`inline-block w-full px-2 py-1 rounded text-xs font-semibold text-center ${
      styleMap[value] || "bg-gray-100 text-gray-800"
    }`}
    style={{
      minWidth: "100%",
      boxSizing: "border-box",
      letterSpacing: "0.5px",
    }}
  >
    {value}
  </span>
);

export default StatusBadge;