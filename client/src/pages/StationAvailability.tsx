import { useState, useMemo, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import TableFilters from "../components/TableFilters";
import type { FilterConfig } from "../components/TableFilters";
import DataTable from "../components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import axiosInstance from "../utilities/Axios";

interface Station {
  id: number;
  net: string;
  kode: string;
  lokasi: string;
  upt: string;
  jaringan: string;
  availability: number[];
}

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function getDefaultMonthRange() {
  const now = new Date();
  const end = now.getMonth();
  let start = end - 2;
  if (start <= 0) start += 12;
  return { start, end };
}

function MonthRangePicker({value, onChange,}: {
    value: { start: number; end: number };
    onChange: (range: { start: number; end: number }) => void;
  }){
    return (
      <div className="flex gap-2 items-center mb-4">
        <label>Rentang Bulan:</label>
        <select
          value={value?.start ?? 1}
          onChange={(e) => {
            const newStart = Number(e.target.value);
            const currentEnd = value?.end ?? 12;
            onChange({ start: newStart, end: newStart > currentEnd ? newStart : currentEnd });
          }}
          className="border p-1 rounded"
        >
          {monthNames.map((name, i) => (
            <option key={i} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
        <span>s/d</span>
        <select
          value={value?.end ?? 12}
          onChange={(e) => {
            const newEnd = Number(e.target.value);
            const currentStart = value?.start ?? 1;
            onChange({ start: currentStart, end: newEnd > currentStart ? newEnd : currentStart });
          }}
          className="border p-1 rounded"
        >
          {monthNames.map((name, i) => (
            <option key={i} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
      </div>
    );
}

function YearPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (year: number) => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i); // 5 tahun terakhir

  return (
    <div className="flex gap-2 items-center mb-4">
      <label>Tahun:</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border p-1 rounded"
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}

const StationAvailability = () => {
  const [data, setData] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonthRange, setSelectedMonthRange] = useState<{ start: number; end: number }>(
    getDefaultMonthRange()
  );
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [filterConfig, setFilterConfig] = useState<Record<string, FilterConfig>>({});
  const [filters, setFilters] = useState<Record<string, string[]>>({
    kode: [],
  });

  useEffect(() => {
    // Fetch data saat komponen pertama kali dimuat atau saat bulan/tahun berubah
    setLoading(true);
    axiosInstance
      .get("/data/stationData.json", {
        params: {
          startMonth: selectedMonthRange.start,
          endMonth: selectedMonthRange.end,
          year: selectedYear, // kirim tahun
        },
      })
      .then((res) => {
        const stations: Station[] = res.data;
        setData(stations);

        const uniqueKode = Array.from(new Set(stations.map(s => s.kode))).sort();

        setFilterConfig({
          kode: { label: "Kode Stasiun", type: "multi", options: uniqueKode },
        });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedMonthRange, selectedYear]); // fetch ulang jika bulan atau tahun berubah

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (filters.kode.length > 0 && !filters.kode.includes(item.kode)) return false;
      return true;
    });
  }, [filters, data]);

  const availabilityColumns = useMemo(() => {
    if (!selectedMonthRange) return [];

    let count = selectedMonthRange.end - selectedMonthRange.start + 1;
    if (count <= 0) count += 12;

    return Array.from({ length: count }).map((_, idx) => {
      const monthIndex = (selectedMonthRange.start - 1 + idx) % 12;
      return {
        header: monthNames[monthIndex],
        accessorFn: (row: Station) => row.availability[idx] ?? null,
        id: `availability-${monthIndex}`,
      };
    });
  }, [selectedMonthRange]);

  const columns: ColumnDef<Station>[] = [
    { 
      header: "ID", 
      accessorKey: "id", 
      enableSorting: false,
      size: 80,
    },
    { 
      header: "Kode Stasiun", 
      accessorKey: "kode", 
      enableSorting: false,
      size: 120,
    },
    {
      header: "Availability (%)",
      columns: availabilityColumns.map(col => ({
        ...col,
        cell: ({ getValue }: { getValue: () => number | null }) => {
          const value = getValue();
          if (value === null || value === undefined) return "-";
          
          // Format dengan 2 decimal dan tambahkan warna berdasarkan nilai
          const formatted = value.toFixed(2);
          let colorClass = "";
          
          if (value >= 95) colorClass = "text-green-600 font-semibold";
          else if (value >= 80) colorClass = "text-yellow-600 font-semibold";
          else colorClass = "text-gray-600 font-semibold";
          
          return <span className={colorClass}>{formatted}</span>;
        },
        size: 100,
      })),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainLayout>
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <h1 className="bg-gray-100 rounded-2xl text-center text-4xl font-bold my-4 mx-48 py-2 border-2">
            Stasiun Availability
          </h1>

          <div className="flex gap-4 items-center flex-wrap mb-4">
            <YearPicker value={selectedYear} onChange={setSelectedYear} />
            <MonthRangePicker value={selectedMonthRange} onChange={setSelectedMonthRange} />
          </div>
          {Object.keys(filterConfig).length > 0 && (
            <TableFilters
              filters={filters}
              setFilters={setFilters}
              filterConfig={filterConfig}
              closeOnClickOutside={true}
            />
          )}
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          {loading ? (
            <p className="text-center text-gray-500">Loading data...</p>
          ) : (
            <DataTable columns={columns} data={filteredData} />
          )}
        </div>
      </MainLayout>
    </div>
  );
};

export default StationAvailability;
