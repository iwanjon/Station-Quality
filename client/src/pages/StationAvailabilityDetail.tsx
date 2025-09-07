import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import axiosInstance from "../utilities/Axios";
import { ArrowLeft, MapPin, Network, Building, Activity } from "lucide-react";

interface StationDetail {
  id: number;
  net: string;
  kode: string;
  lokasi: string;
  upt: string;
  jaringan: string;
  availability: number[];
  koordinat?: { lat: number; lng: number };
  instalasi_date?: string;
  last_maintenance?: string;
  status: string;
  perangkat?: string[];
}

interface AvailabilityStats {
  average: number;
  highest: number;
  lowest: number;
  trend: 'up' | 'down' | 'stable';
}

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const StationAvailabilityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [station, setStation] = useState<StationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonthRange, setSelectedMonthRange] = useState<{ start: number; end: number }>({
    start: 1,
    end: 12
  });

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    axiosInstance
      .get("/data/stationDetailData.json")
      .then((res) => {
        const stations: StationDetail[] = res.data;
        const stationData = stations.find(s => s.id === parseInt(id));
        
        if (!stationData) {
          setStation(null);
          return;
        }

        setStation(stationData);
      })
      .catch((err) => {
        console.error("Error fetching station detail:", err);
        setStation(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Filter availability data based on selected month range
  const getFilteredAvailability = () => {
    if (!station || !station.availability) return { data: [], months: [] };
    
    const { start, end } = selectedMonthRange;
    let filteredData = [];
    let filteredMonths = [];
    
    if (start <= end) {
      // Normal range (e.g., Jan to Jun)
      for (let i = start - 1; i < end; i++) {
        if (i < station.availability.length) {
          filteredData.push(station.availability[i]);
          filteredMonths.push(monthNames[i]);
        }
      }
    } else {
      // Wrap around range (e.g., Oct to Mar)
      for (let i = start - 1; i < 12 && i < station.availability.length; i++) {
        filteredData.push(station.availability[i]);
        filteredMonths.push(monthNames[i]);
      }
      for (let i = 0; i < end && i < station.availability.length; i++) {
        filteredData.push(station.availability[i]);
        filteredMonths.push(monthNames[i]);
      }
    }
    
    return { data: filteredData, months: filteredMonths };
  };

  const filteredChart = getFilteredAvailability();

  // Recalculate stats for filtered data
  const getFilteredStats = () => {
    const availability = filteredChart.data.filter(val => val !== null && val !== undefined && !isNaN(val));
    if (availability.length === 0) return null;

    const average = availability.reduce((sum, val) => sum + val, 0) / availability.length;
    const highest = Math.max(...availability);
    const lowest = Math.min(...availability);
    
    // Simple trend calculation for filtered data
    if (availability.length < 2) {
      return { average, highest, lowest, trend: 'stable' as const };
    }

    const firstHalf = availability.slice(0, Math.ceil(availability.length / 2));
    const secondHalf = availability.slice(Math.floor(availability.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const trend = secondAvg > firstAvg + 1 ? 'up' : secondAvg < firstAvg - 1 ? 'down' : 'stable';

    return { average, highest, lowest, trend };
  };

  const filteredStats = getFilteredStats();

  const getAvailabilityColor = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) return "bg-gray-200";
    if (value >= 95) return "bg-green-500";
    if (value >= 90) return "bg-yellow-500";
    if (value >= 80) return "bg-orange-500";
    return "bg-red-500";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <span className="text-green-500">↗️</span>;
      case 'down': return <span className="text-red-500">↘️</span>;
      default: return <span className="text-gray-500">➡️</span>;
    }
  };

  // MonthRangePicker component
  const MonthRangePicker = () => {
    return (
      <div className="flex gap-4 items-center mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="font-medium text-gray-700">Filter Bulan:</label>
        <div className="flex gap-2 items-center">
          <select
            value={selectedMonthRange.start}
            onChange={(e) => {
              const newStart = Number(e.target.value);
              setSelectedMonthRange(prev => ({ ...prev, start: newStart }));
            }}
            className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {monthNames.map((name, i) => (
              <option key={i} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <span className="text-gray-500">s/d</span>
          <select
            value={selectedMonthRange.end}
            onChange={(e) => {
              const newEnd = Number(e.target.value);
              setSelectedMonthRange(prev => ({ ...prev, end: newEnd }));
            }}
            className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {monthNames.map((name, i) => (
              <option key={i} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setSelectedMonthRange({ start: 1, end: 12 })}
          className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
        >
          Reset
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading station detail...</p>
        </div>
      </MainLayout>
    );
  }

  if (!station) {
    return (
      <MainLayout>
        <div className="text-center">
          <p className="text-red-500 mb-4">Station not found</p>
          <button
            onClick={() => navigate("/station-availability")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Back to Station List
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate("/station-availability")}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft size={20} />
              Kembali
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {station.kode} - {station.lokasi}
              </h1>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Network size={16} />
                  <span>Net: {station.net}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Building size={16} />
                  <span>UPT: {station.upt}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Activity size={16} />
                  <span>Jaringan: {station.jaringan}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={16} />
                  <span>Status: <span className={`font-semibold ${station.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>{station.status}</span></span>
                </div>
              </div>
            </div>

            {/* Statistics - Update to use filtered stats */}
            {filteredStats && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Statistik Availability</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Rata-rata</p>
                    <p className="text-xl font-bold text-blue-600">{filteredStats.average.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tertinggi</p>
                    <p className="text-xl font-bold text-green-600">{filteredStats.highest.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Terendah</p>
                    <p className="text-xl font-bold text-red-600">{filteredStats.lowest.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Trend</p>
                    <p className="text-xl font-bold flex items-center gap-1">
                      {getTrendIcon(filteredStats.trend)}
                      {filteredStats.trend === 'up' ? 'Naik' : filteredStats.trend === 'down' ? 'Turun' : 'Stabil'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Availability Chart */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Availability per Bulan</h2>
          
          {/* Month Range Filter */}
          <MonthRangePicker />
          
          {/* Bar Chart - Update to use filtered data */}
          <div className="flex items-end space-x-2 h-64 mb-4">
            {filteredChart.data.length > 0 ? (
              filteredChart.data.map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full ${getAvailabilityColor(value)} transition-all duration-300 hover:opacity-80`}
                    style={{ 
                      height: `${value && !isNaN(value) ? Math.max((value / 100) * 200, 2) : 2}px`,
                      minHeight: '2px'
                    }}
                    title={`${filteredChart.months[index]}: ${value && !isNaN(value) ? value.toFixed(1) : 'N/A'}%`}
                  />
                  <span className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-left">
                    {filteredChart.months[index]}
                  </span>
                </div>
              ))
            ) : (
              <div className="w-full flex items-center justify-center h-32">
                <p className="text-gray-500">No data available for selected range</p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>≥95% (Excellent)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>90-94% (Good)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span>80-89% (Fair)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>&lt;80% (Poor)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span>No Data</span>
            </div>
          </div>

          {/* Chart Info */}
          {filteredChart.months.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Menampilkan data dari <strong>{filteredChart.months[0]}</strong> sampai <strong>{filteredChart.months[filteredChart.months.length - 1]}</strong>
                {filteredChart.data.length < 12 && (
                  <span> ({filteredChart.data.length} bulan)</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Detailed Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Technical Info */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4">Informasi Teknis</h3>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600">Tanggal Instalasi:</span>
                <span className="ml-2 font-medium">{station.instalasi_date || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Maintenance Terakhir:</span>
                <span className="ml-2 font-medium">{station.last_maintenance || 'N/A'}</span>
              </div>
              {station.koordinat && (
                <div>
                  <span className="text-gray-600">Koordinat:</span>
                  <span className="ml-2 font-medium">
                    {station.koordinat.lat}, {station.koordinat.lng}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Equipment */}
          {station.perangkat && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-4">Perangkat</h3>
              <div className="space-y-2">
                {station.perangkat.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Monthly Availability Table - Keep showing all months */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4">Data Availability Bulanan (Semua Bulan)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Bulan</th>
                  <th className="text-left p-2">Availability (%)</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {station.availability?.map((value, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{monthNames[index] || `Month ${index + 1}`}</td>
                    <td className="p-2">
                      {value !== null && value !== undefined && !isNaN(value) ? (
                        <span className={`font-semibold ${
                          value >= 95 ? 'text-green-600' : 
                          value >= 90 ? 'text-yellow-600' : 
                          value >= 80 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {value.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">No Data</span>
                      )}
                    </td>
                    <td className="p-2">
                      {value !== null && value !== undefined && !isNaN(value) ? (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          value >= 95 ? 'bg-green-100 text-green-800' : 
                          value >= 90 ? 'bg-yellow-100 text-yellow-800' : 
                          value >= 80 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {value >= 95 ? 'Excellent' : value >= 90 ? 'Good' : value >= 80 ? 'Fair' : 'Poor'}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">N/A</span>
                      )}
                    </td>
                  </tr>
                )) || []}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default StationAvailabilityDetail;
