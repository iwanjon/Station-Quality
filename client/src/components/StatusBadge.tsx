// components/StatusBadge.tsx

import React from "react";

interface Props {
  value: string; // Teks yang akan ditampilkan, misal: "Sangat Baik", "Mati", dll.
}

const StatusBadge: React.FC<Props> = ({ value }) => {
  // Peta untuk styling kelas Tailwind
  const styleMap: Record<string, string> = {
    // [DIUBAH] "Sangat Baik" sekarang menggunakan text-green-700 agar lebih terang
    "Sangat Baik": "bg-green-100 text-green-600",
    
    "Baik": "bg-orange-100 text-orange-800",
    "Cukup": "bg-amber-100 text-amber-800",
    "Buruk": "bg-red-100 text-red-800",
    "Mati": "bg-red-100 text-red-800",
    "No Data": "bg-gray-100 text-gray-800",
  };

  // Render badge untuk semua nilai menggunakan kelas dari styleMap
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        styleMap[value] || "bg-gray-100 text-gray-800" // Fallback
      }`}
    >
      {value}
    </span>
  );
};

export default StatusBadge;