import { useState, useMemo, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import TableFilters from "../components/TableFilters";
import type { FilterConfig } from "../components/TableFilters";
import DataTable from "../components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import axiosInstance from "../utilities/AxiosServer";

interface StationData {
  timestamp: string;
  availability: number | null;
  note?: string;
}

interface APIResponse {
  success: boolean;
  message: string;
  cached: boolean;
  cache_key: string;
  meta: {
    stationCount: number;
    totalRecords: number;
    dateRange: {
      start_date: string;
      end_date: string;
    };
  };
  data: Record<string, StationData[]>;
}

interface ProcessedStation {
  id: number;
  kode: string;
  dailyData: StationData[]; // Raw daily data dari API
  monthlyAverage: number | null; // Rata-rata keseluruhan untuk periode
  totalDays: number;
  availableDays: number;
  missingDays: number;
}

// Legacy interface untuk kompatibilitas dengan komponen yang ada
interface Station {
  id: number;
  kode: string;
  monthlyAverage: number | null;
  totalDays: number;
  availableDays: number;
  missingDays: number;
  status: 'Good' | 'Poor' | 'No Data';
}

// Function untuk memproses response API dan menghitung statistik per stasiun
function processStationData(apiResponse: APIResponse): ProcessedStation[] {
  const stations: ProcessedStation[] = [];
  let id = 1;

  // Loop melalui setiap stasiun dalam data
  Object.entries(apiResponse.data).forEach(([stationCode, stationData]) => {
    // Filter data yang valid (availability tidak null)
    const validData = stationData.filter(record => record.availability !== null);
    const totalDays = stationData.length;
    const availableDays = validData.length;
    const missingDays = totalDays - availableDays;
    
    // Hitung rata-rata availability untuk periode
    let monthlyAverage: number | null = null;
    if (validData.length > 0) {
      const sum = validData.reduce((acc, record) => acc + (record.availability || 0), 0);
      monthlyAverage = Math.round((sum / validData.length) * 100) / 100;
    }
    
    stations.push({
      id: id++,
      kode: stationCode,
      dailyData: stationData,
      monthlyAverage,
      totalDays,
      availableDays,
      missingDays
    });
  });

  return stations;
}

// Function untuk mengkonversi ProcessedStation ke format Station
function convertToStationFormat(processedStations: ProcessedStation[]): Station[] {
  return processedStations.map(station => {
    // Tentukan status berdasarkan availability
    let status: 'Good' | 'Poor' | 'No Data';
    if (station.monthlyAverage === null) {
      status = 'No Data';
    } else if (station.monthlyAverage >= 80) {
      status = 'Good';
    } else {
      status = 'Poor';
    }

    return {
      id: station.id,
      kode: station.kode,
      monthlyAverage: station.monthlyAverage,
      totalDays: station.totalDays,
      availableDays: station.availableDays,
      missingDays: station.missingDays,
      status
    };
  });
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
  const [apiInfo, setApiInfo] = useState<{
    cached: boolean;
    totalStations: number;
    dateRange: string;
  } | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [filterConfig, setFilterConfig] = useState<Record<string, FilterConfig>>({});
  const [filters, setFilters] = useState<Record<string, string[]>>({
    kode: [],
  });

  useEffect(() => {
    // Fetch data dari API availability baru
    setLoading(true);
    
    // Generate date range untuk tahun yang dipilih (Januari - Desember)
    const startDate = new Date(selectedYear, 0, 1); // 1 Januari
    const endDate = new Date(selectedYear, 11, 31); // 31 Desember
    
    const start_date = startDate.toISOString().split('T')[0];
    const end_date = endDate.toISOString().split('T')[0];
    
    axiosInstance
      .get("/api/station/availability", {
        params: {
          start_date,
          end_date
        },
      })
      .then((res) => {
        const apiResponse: APIResponse = res.data;
        
        if (apiResponse.success) {
          // Process data untuk menghitung statistik per stasiun
          const processedStations = processStationData(apiResponse);
          
          // Konversi ke format Station untuk tabel
          const stations = convertToStationFormat(processedStations);
          
          setData(stations);

          // Setup filter config
          const uniqueKode = Array.from(new Set(stations.map((s: Station) => s.kode))).sort();
          setFilterConfig({
            kode: { label: "Kode Stasiun", type: "multi", options: uniqueKode },
          });
          
          // Set API info untuk display
          setApiInfo({
            cached: apiResponse.cached,
            totalStations: apiResponse.meta.stationCount,
            dateRange: `${apiResponse.meta.dateRange.start_date} to ${apiResponse.meta.dateRange.end_date}`
          });
          
          // Log hasil untuk debugging
          console.log("📊 Station Availability Summary:");
          processedStations.forEach((station: ProcessedStation) => {
            console.log(`${station.kode}: ${station.monthlyAverage}% (${station.availableDays}/${station.totalDays} days)`);
          });
        } else {
          console.error("API Error:", apiResponse.message);
          setData([]);
        }
      })
      .catch((err) => {
        console.error("Request Error:", err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [selectedYear]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (filters.kode.length > 0 && !filters.kode.includes(item.kode)) return false;
      return true;
    });
  }, [filters, data]);

  const columns: ColumnDef<Station>[] = [
    { 
      header: "ID", 
      accessorKey: "id", 
      enableSorting: true,
      size: 80,
    },
    { 
      header: "Kode Stasiun", 
      accessorKey: "kode", 
      enableSorting: true,
      size: 150,
    },
    {
      header: "Rata-rata Availability (%)",
      accessorKey: "monthlyAverage",
      enableSorting: true,
      size: 180,
      cell: ({ getValue }) => {
        const value = getValue() as number | null;
        if (value === null || value === undefined) return "-";
        
        // Format dengan 2 decimal dan tambahkan warna berdasarkan nilai
        const formatted = value.toFixed(2);
        let colorClass = "";
        
        if (value >= 95) colorClass = "text-green-600 font-semibold";
        else if (value >= 80) colorClass = "text-yellow-600 font-semibold";
        else colorClass = "text-red-600 font-semibold";
        
        return <span className={colorClass}>{formatted}%</span>;
      },
    },
    {
      header: "Total Hari",
      accessorKey: "totalDays",
      enableSorting: true,
      size: 100,
    },
    {
      header: "Hari Tersedia",
      accessorKey: "availableDays",
      enableSorting: true,
      size: 120,
      cell: ({ getValue }) => {
        const value = getValue() as number;
        return <span className="text-green-600 font-semibold">{value}</span>;
      },
    },
    {
      header: "Hari Hilang",
      accessorKey: "missingDays",
      enableSorting: true,
      size: 120,
      cell: ({ getValue }) => {
        const value = getValue() as number;
        const colorClass = value > 0 ? "text-red-600" : "text-gray-600";
        return <span className={`${colorClass} font-semibold`}>{value}</span>;
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      enableSorting: true,
      size: 100,
      cell: ({ getValue }) => {
        const status = getValue() as 'Good' | 'Poor' | 'No Data';
        let colorClass = "";
        let icon = "";
        
        switch (status) {
          case 'Good':
            colorClass = "bg-green-100 text-green-800";
            icon = "✅";
            break;
          case 'Poor':
            colorClass = "bg-yellow-100 text-yellow-800";
            icon = "⚠️";
            break;
          case 'No Data':
            colorClass = "bg-red-100 text-red-800";
            icon = "❌";
            break;
        }
        
        return (
          <span className={`${colorClass} px-2 py-1 rounded-full text-xs font-semibold`}>
            {icon} {status}
          </span>
        );
      },
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
          </div>
          
          {/* API Info Display */}
          {apiInfo && (
            <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm">
              <div className="flex gap-4 items-center flex-wrap">
                <span className="font-medium">Data Status:</span>
                <span className={`px-2 py-1 rounded ${apiInfo.cached ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                  {apiInfo.cached ? '📋 From Cache' : '🌐 Fresh Data'}
                </span>
                <span>📊 {apiInfo.totalStations} Stations</span>
                <span>📅 {apiInfo.dateRange}</span>
              </div>
            </div>
          )}
          
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
