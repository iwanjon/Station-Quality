import { useState, useMemo, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import TableFilters from "../components/TableFilters";
import type { FilterConfig } from "../components/TableFilters";
import DataTable from "../components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import axiosInstance from "../utilities/AxiosServer";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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
  dailyData: StationData[];
  monthlyData: Record<string, number | null>;
  totalDays: number;
  availableDays: number;
  missingDays: number;
}

interface Station {
  id: number;
  kode: string;
  monthlyData: Record<string, number | null>;
  totalDays: number;
  availableDays: number;
  missingDays: number;
}

interface DateRange {
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
}

interface ChartDataPoint {
  month: string;
  '> 97%': number;
  '90-97%': number;
  '0-90%': number;
  '0%': number;
  counts: Record<string, number>;
}

interface ApiInfo {
  cached: boolean;
  totalStations: number;
  dateRange: string;
}

// Function to process API response and calculate statistics per station
function processStationData(apiResponse: APIResponse, selectedRange: DateRange): ProcessedStation[] {
  const stations: ProcessedStation[] = [];
  let id = 1;

  // Loop through each station in data
  Object.entries(apiResponse.data).forEach(([stationCode, stationData]) => {
    // Filter data yang valid (availability tidak null)
    const validData = stationData.filter(record => record.availability !== null);
    const totalDays = stationData.length;
    const availableDays = validData.length;
    const missingDays = totalDays - availableDays;
    
    // Group data by month and calculate monthly averages
    const monthlyData: Record<string, number | null> = {};
    
    // Generate all months in the selected range
    const currentDate = new Date(selectedRange.startYear, selectedRange.startMonth, 1);
    const endDate = new Date(selectedRange.endYear, selectedRange.endMonth, 1);
    
    while (currentDate <= endDate) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Filter data for this month
      const monthData = stationData.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate.getFullYear() === currentDate.getFullYear() && 
               recordDate.getMonth() === currentDate.getMonth();
      });
      
      // Calculate average for this month
      const validMonthData = monthData.filter(record => record.availability !== null);
      if (validMonthData.length > 0) {
        const sum = validMonthData.reduce((acc, record) => acc + (record.availability || 0), 0);
        monthlyData[monthKey] = Math.round((sum / validMonthData.length) * 100) / 100;
      } else {
        monthlyData[monthKey] = null;
      }
      
      // Next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    stations.push({
      id: id++,
      kode: stationCode,
      dailyData: stationData,
      monthlyData,
      totalDays,
      availableDays,
      missingDays
    });
  });

  return stations;
}

// Function to convert ProcessedStation to Station format
function convertToStationFormat(processedStations: ProcessedStation[]): Station[] {
  return processedStations.map(station => ({
    id: station.id,
    kode: station.kode,
    monthlyData: station.monthlyData,
    totalDays: station.totalDays,
    availableDays: station.availableDays,
    missingDays: station.missingDays
  }));
}

// Function to determine availability category based on overall average
function getAvailabilityCategory(station: Station): string {
  const monthlyValues = Object.values(station.monthlyData).filter(val => val !== null) as number[];
  
  if (monthlyValues.length === 0) {
    return 'No Data';
  }
  
  const overallAverage = monthlyValues.reduce((sum, val) => sum + val, 0) / monthlyValues.length;
  
  if (overallAverage < 50) {
    return 'Low (< 50%)';
  } else if (overallAverage >= 50 && overallAverage < 90) {
    return 'Medium (50% - 90%)';
  } else {
    return 'High (90% - 100%)';
  }
}

const StationAvailability = () => {
  const [data, setData] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiInfo, setApiInfo] = useState<ApiInfo | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<DateRange>(() => {
    const today = new Date();
    let endYear = today.getFullYear();
    let endMonth = today.getMonth() - 1; // Bulan lalu (0-based)
    if (endMonth < 0) {
      endMonth = 11;
      endYear -= 1;
    }
    // Start: 12 bulan sebelum endMonth
    let startMonth = endMonth - 12;
    let startYear = endYear;
    if (startMonth < 0) {
      startMonth += 12;
      startYear -= 1;
    }
    return {
      startYear,
      startMonth,
      endYear,
      endMonth
    };
  });
  const [filterConfig, setFilterConfig] = useState<Record<string, FilterConfig>>({});
  const [filters, setFilters] = useState<Record<string, string[]>>({
    kode: [],
    availabilityCategory: [],
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    // Fetch data dari API availability baru
    setLoading(true);
    
    // Gunakan range bulan yang dipilih
    const firstDayOfRange = new Date(selectedMonth.startYear, selectedMonth.startMonth, 1);
    const lastDayOfRange = new Date(selectedMonth.endYear, selectedMonth.endMonth + 1, 0);
    
    const start_date = firstDayOfRange.toISOString().split('T')[0];
    const end_date = lastDayOfRange.toISOString().split('T')[0];
    
    axiosInstance
      .get("/api/availability", {
        params: {
          start_date,
          end_date
        },
      })
      .then((res) => {
        const apiResponse: APIResponse = res.data;
        
        if (apiResponse.success) {
          // Process data to calculate statistics per station
          const processedStations = processStationData(apiResponse, selectedMonth);
          
          // Convert to Station format for table
          const stations = convertToStationFormat(processedStations);
          
          setData(stations);

          // Calculate chart data: station distribution per availability range per month
          const chartDataTemp: ChartDataPoint[] = [];
          
          // Generate all months in the selected range
          const currentDate = new Date(selectedMonth.startYear, selectedMonth.startMonth, 1);
          const endDate = new Date(selectedMonth.endYear, selectedMonth.endMonth, 1);
          
          while (currentDate <= endDate) {
            const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
            
            // Calculate station distribution based on availability range for this month
            const distribution = {
              '> 97%': 0,
              '90-97%': 0,
              '0-90%': 0,
              '0%': 0
            };
            
            stations.forEach(station => {
              const value = station.monthlyData[monthKey];
              if (value !== null && value !== undefined) {
                if (value > 97) {
                  distribution['> 97%']++;
                } else if (value >= 90 && value <= 97) {
                  distribution['90-97%']++;
                } else if (value > 0 && value < 90) {
                  distribution['0-90%']++;
                } else {
                  distribution['0%']++;
                }
              } else {
                // Jika tidak ada data, hitung sebagai 0%
                distribution['0%']++;
              }
            });
            
            // Calculate total stations and convert to percentage
            const totalStations = distribution['> 97%'] + distribution['90-97%'] + distribution['0-90%'] + distribution['0%'];
            
            chartDataTemp.push({
              month: monthLabel,
              '> 97%': totalStations > 0 ? Math.round((distribution['> 97%'] / totalStations) * 100 * 10) / 10 : 0,
              '90-97%': totalStations > 0 ? Math.round((distribution['90-97%'] / totalStations) * 100 * 10) / 10 : 0,
              '0-90%': totalStations > 0 ? Math.round((distribution['0-90%'] / totalStations) * 100 * 10) / 10 : 0,
              '0%': totalStations > 0 ? Math.round((distribution['0%'] / totalStations) * 100 * 10) / 10 : 0,
              counts: {
                '> 97%': distribution['> 97%'],
                '90-97%': distribution['90-97%'],
                '0-90%': distribution['0-90%'],
                '0%': distribution['0%']
              }
            });
            
            // Next month
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
          
          setChartData(chartDataTemp);

          // Setup filter config
          const uniqueKode = Array.from(new Set(stations.map((s: Station) => s.kode))).sort();
          const availabilityCategories = ['Low (< 50%)', 'Medium (50% - 90%)', 'High (90% - 100%)', 'No Data'];
          
          setFilterConfig({
            kode: { label: "Station Code", type: "multi", options: uniqueKode },
            availabilityCategory: { label: "Availability Category", type: "multi", options: availabilityCategories },
          });
          
          // Set API info for display
          setApiInfo({
            cached: apiResponse.cached,
            totalStations: apiResponse.meta.stationCount,
            dateRange: `${apiResponse.meta.dateRange.start_date} to ${apiResponse.meta.dateRange.end_date}`
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
  }, [selectedMonth]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (filters.kode.length > 0 && !filters.kode.includes(item.kode)) return false;
      
      // Filter by availability category
      if (filters.availabilityCategory.length > 0) {
        const category = getAvailabilityCategory(item);
        if (!filters.availabilityCategory.includes(category)) return false;
      }
      
      return true;
    });
  }, [filters, data]);

  // Helper function to generate dynamic columns based on month range
  const generateColumns = (): ColumnDef<Station>[] => {
    const columns: ColumnDef<Station>[] = [
      { 
        header: "Station Code", 
        accessorKey: "kode", 
        enableSorting: true,
      }
    ];

    // Generate kolom untuk setiap bulan dalam range
    const currentDate = new Date(selectedMonth.startYear, selectedMonth.startMonth, 1);
    const endDate = new Date(selectedMonth.endYear, selectedMonth.endMonth, 1);
    
    while (currentDate <= endDate) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      
      columns.push({
        header: monthLabel,
        accessorKey: `monthlyData.${monthKey}`,
        enableSorting: true,
        cell: ({ row }) => {
          const station = row.original;
          const value = station.monthlyData[monthKey];
          if (value === null || value === undefined) return "-";
          
          // Format dengan 2 decimal dan tambahkan warna berdasarkan nilai
          const formatted = value.toFixed(2);
          let colorClass = "";
          
          if (value >= 95) colorClass = "text-green-600 font-semibold";
          else if (value >= 80) colorClass = "text-yellow-600 font-semibold";
          else colorClass = "text-red-600 font-semibold";
          
          return <span className={colorClass}>{formatted}%</span>;
        },
      });
      
      // Next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return columns;
  };

  const columns = generateColumns();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainLayout>
        <h1 className="bg-gray-100 rounded-2xl text-left text-3xl font-bold my-2">
            Data Availability
          </h1>
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <div className="flex gap-4">
            {/* Filters on the left - More Compact */}
            <div className="w-1/5 bg-gray-50 p-2 rounded-lg">
              <div className="space-y-3">
                {/* Month Range Picker - Vertical Layout */}
                <div className="space-y-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-700">From:</label>
                    <select
                      value={`${selectedMonth.startYear}-${selectedMonth.startMonth}`}
                      onChange={(e) => {
                        const [year, month] = e.target.value.split('-').map(Number);
                        setSelectedMonth({ ...selectedMonth, startYear: year, startMonth: month });
                      }}
                      className="border px-2 py-1 rounded text-xs w-full"
                    >
                      {(() => {
                        const currentDate = new Date();
                        const currentYear = currentDate.getFullYear();
                        const currentMonth = currentDate.getMonth();
                        const months = [];
                        
                        for (let year = currentYear; year >= currentYear - 1; year--) {
                          const maxMonth = year === currentYear ? currentMonth - 1 : 11;
                          for (let month = maxMonth; month >= 0; month--) {
                            months.push({ year, month });
                          }
                        }
                        
                        return months.map(({ year, month }) => (
                          <option key={`start-${year}-${month}`} value={`${year}-${month}`}>
                            {MONTH_NAMES[month]} {year}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-700">To:</label>
                    <select
                      value={`${selectedMonth.endYear}-${selectedMonth.endMonth}`}
                      onChange={(e) => {
                        const [year, month] = e.target.value.split('-').map(Number);
                        setSelectedMonth({ ...selectedMonth, endYear: year, endMonth: month });
                      }}
                      className="border px-2 py-1 rounded text-xs w-full"
                    >
                      {(() => {
                        const currentDate = new Date();
                        const currentYear = currentDate.getFullYear();
                        const currentMonth = currentDate.getMonth();
                        const months = [];
                        
                        for (let year = currentYear; year >= currentYear - 1; year--) {
                          const maxMonth = year === currentYear ? currentMonth - 1 : 11;
                          for (let month = maxMonth; month >= 0; month--) {
                            months.push({ year, month });
                          }
                        }
                        
                        return months.map(({ year, month }) => (
                          <option key={`end-${year}-${month}`} value={`${year}-${month}`}>
                            {MONTH_NAMES[month]} {year}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>

                {/* API Info - Compact */}
                {apiInfo && (
                  <div className="space-y-1 text-xs">
                    <div className={`px-2 py-1 rounded text-center ${apiInfo.cached ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {apiInfo.cached ? '📋 Cache' : '🌐 Fresh'}
                    </div>
                    <div className="text-gray-600 text-center">📊 {apiInfo.totalStations} Stations</div>
                    <div className="text-gray-600 text-center">📅 {apiInfo.dateRange}</div>
                  </div>
                )}

                {/* Table Filters - Compact */}
                {Object.keys(filterConfig).length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <TableFilters
                      filters={filters}
                      setFilters={setFilters}
                      filterConfig={filterConfig}
                      closeOnClickOutside={true}
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Chart on the right - More Space */}
            <div className="w-4/5">
              {/* Chart Section */}
              {loading ? (
                <div className="bg-white p-4 rounded-lg">
                  <h2 className="text-lg font-semibold text-gray-700 mb-3">Station Percentage Distribution by Month based on Availability</h2>
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-center text-gray-500 text-sm">Loading chart data...</p>
                  </div>
                </div>
              ) : chartData.length > 0 ? (
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-700 mb-3">Station Percentage Distribution by Month based on Availability</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          angle={-45} 
                          textAnchor="end" 
                          height={60}
                          interval={0}
                          fontSize={11}
                        />
                        <YAxis 
                          domain={[0, 100]} 
                          ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                          label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '12px' } }} 
                          fontSize={11}
                        />
                        <Tooltip 
                          formatter={(_, name, item) => {
                            const count = item.payload.counts[name];
                            return [`${count} stations`, name];
                          }}
                          labelStyle={{ color: '#000' }}
                        />
                        <Bar dataKey="> 97%" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="90-97%" stackId="a" fill="#ffff00" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="0-90%" stackId="a" fill="#ff7f00  " radius={[0, 0, 0, 0]} />
                        <Bar dataKey="0%" stackId="a" fill="#ff0000" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-600 rounded"></div>
                      <span>&gt; 97%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-200 rounded"></div>
                      <span>90-97%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-400 rounded"></div>
                      <span>0-90%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span>0%</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          
        </div>

        <div className="bg-white p-2 rounded-xl shadow">
          {loading ? (
            <p className="text-center text-gray-500 text-sm py-4">Loading data...</p>
          ) : (
            <div className="overflow-x-auto text-xs">
              <div className="min-w-full">
                <DataTable columns={columns} data={filteredData} />
              </div>
            </div>
          )}
        </div>
      </MainLayout>
    </div>
  );
};

export default StationAvailability;
