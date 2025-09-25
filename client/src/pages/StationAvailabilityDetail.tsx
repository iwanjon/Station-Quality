import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import axiosInstance from "../utilities/AxiosServer";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

interface StationData {
  timestamp: string;
  availability: number | null;
  note?: string;
}

interface Station {
  kode_stasiun: string;
}

interface APIResponse {
  success: boolean;
  message: string;
  cached: boolean;
  cache_key: string;
  meta: {
    stationCode: string;
    totalRecords: number;
    dateRange: {
      start_date: string;
      end_date: string;
    };
  };
  data: Record<string, StationData[]>;
}

interface DailyDataPoint {
  date: string;
  availability: number | null;
  formattedDate: string;
  dayOfWeek: string;
}

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

const StationAvailabilityDetail = () => {
  const { stationCode } = useParams<{ stationCode: string }>();
  const navigate = useNavigate();
  const [dailyData, setDailyData] = useState<DailyDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return {
      year: today.getFullYear(),
      month: today.getMonth() // 0-based
    };
  });
  const [stats, setStats] = useState({
    totalDays: 0,
    availableDays: 0,
    averageAvailability: 0,
    minAvailability: 0,
    maxAvailability: 0
  });

  const handleStationSelect = (selectedStationCode: string) => {
    setDropdownOpen(false);
    navigate(`/station-availability/${selectedStationCode}`);
  };

  const getCurrentStationName = () => {
    const currentStation = stations.find(station => station.kode_stasiun === stationCode);
    return currentStation ? currentStation.kode_stasiun : stationCode;
  };

  const fetchStations = useCallback(async () => {
    try {
      setStationsLoading(true);
      const response = await axiosInstance.get('/api/stasiun/codes');
      if (response.data.success) {
        const stationList: Station[] = response.data.data.map((item: { kode_stasiun: string }) => ({
          kode_stasiun: item.kode_stasiun
        }));
        setStations(stationList);
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      // Fallback: create station from current stationCode
      const fallbackStation: Station = {
        kode_stasiun: stationCode!
      };
      setStations([fallbackStation]);
    } finally {
      setStationsLoading(false);
    }
  }, [stationCode]);

  const getMonthName = (month: number) => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[month];
  };

  const fetchStationData = useCallback(async () => {
    if (!stationCode) return;

    setLoading(true);
    setError(null);
    // Reset stats when fetching new data
    setStats({
      totalDays: 0,
      availableDays: 0,
      averageAvailability: 0,
      minAvailability: 0,
      maxAvailability: 0
    });

    try {
      // Get data dari awal bulan hingga akhir bulan yang dipilih
      const startDate = new Date(selectedMonth.year, selectedMonth.month, 1); // Awal bulan
      
      // Hitung akhir bulan dengan benar - hari terakhir dari bulan yang dipilih
      const endDate = new Date(selectedMonth.year, selectedMonth.month + 1, 0); // Akhir bulan
      
      // Jika bulan yang dipilih adalah bulan saat ini, gunakan hari ini sebagai end date
      const today = new Date();
      const isCurrentMonth = selectedMonth.year === today.getFullYear() && selectedMonth.month === today.getMonth();
      const actualEndDate = isCurrentMonth ? today : endDate;
      
      const start_date = startDate.toISOString().split('T')[0];
      const end_date = actualEndDate.toISOString().split('T')[0];

      const response = await axiosInstance.get(`/api/availability/${stationCode}`, {
        params: {
          start_date,
          end_date
        },
      });

      const apiResponse: APIResponse = response.data;

      if (apiResponse.success && apiResponse.data[stationCode]) {
        const stationData = apiResponse.data[stationCode];

        // Fetch station codes from the new API endpoint
        fetchStations();

        // Create data points directly from API response, filtered for selected month only
        const allDaysInMonth: DailyDataPoint[] = stationData
          .filter((record) => {
            const date = new Date(record.timestamp);
            return date.getFullYear() === selectedMonth.year && date.getMonth() === selectedMonth.month;
          })
          .map((record) => {
            const date = new Date(record.timestamp);
            const dayOfMonth = date.getDate();
            
            return {
              date: record.timestamp.split('T')[0], // Use API timestamp date directly
              availability: record.availability,
              formattedDate: `${getMonthName(selectedMonth.month).slice(0, 3)} ${dayOfMonth}`,
              dayOfWeek: DAYS_OF_WEEK[date.getDay()]
            };
          });

        // Sort data by date to ensure chronological order
        allDaysInMonth.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setDailyData(allDaysInMonth);

        // Calculate statistics based on complete month data
        const validData = allDaysInMonth.filter(d => d.availability !== null);
        const availabilityValues = validData.map(d => d.availability!);

        setStats({
          totalDays: allDaysInMonth.length,
          availableDays: validData.length,
          averageAvailability: availabilityValues.length > 0
            ? Math.round((availabilityValues.reduce((sum, val) => sum + val, 0) / availabilityValues.length) * 100) / 100
            : 0,
          minAvailability: availabilityValues.length > 0 ? Math.min(...availabilityValues) : 0,
          maxAvailability: availabilityValues.length > 0 ? Math.max(...availabilityValues) : 0
        });
      } else {
        setError("Station data not found");
      }
    } catch (err) {
      console.error("Error fetching station data:", err);
      setError("Failed to load station data");
    } finally {
      setLoading(false);
    }
  }, [stationCode, selectedMonth, fetchStations]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen && !(event.target as Element).closest('.relative')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!stationCode) {
      setError("Station code not provided");
      setLoading(false);
      return;
    }

    fetchStationData();
  }, [stationCode, fetchStationData]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev.year, prev.month + (direction === 'next' ? 1 : -1), 1);
      return {
        year: newDate.getFullYear(),
        month: newDate.getMonth()
      };
    });
  };

  const getAvailabilityColor = (value: number | null) => {
    if (value === null) return "#gray";
    if (value >= 95) return "#16a34a"; // green
    if (value >= 80) return "#ca8a04"; // yellow
    return "#dc2626"; // red
  };

  const getAvailabilityStatus = (value: number | null) => {
    if (value === null) return "No Data";
    if (value >= 95) return "Excellent";
    if (value >= 80) return "Good";
    return "Poor";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading station data...</p>
          </div>
        </MainLayout>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainLayout>
        <div className="mb-4">
          {/* Compact Header with Station Selector */}
          <div className="bg-white rounded-xl shadow p-4 mb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Station Selector */}
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-800">Station:</h1>
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors min-w-[180px]"
                  >
                    <span className="text-gray-700 text-sm">
                      {stationsLoading ? 'Loading...' : getCurrentStationName()}
                    </span>
                    <ChevronDown size={14} className={`text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[180px] max-h-48 overflow-y-auto">
                      {stations.map((station) => (
                        <button
                          key={station.kode_stasiun}
                          onClick={() => handleStationSelect(station.kode_stasiun)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-sm"
                        >
                          <div className="font-medium text-gray-900">{station.kode_stasiun}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Empty Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 flex-1 lg:ml-6">
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Total Days</div>
                  <div className="text-lg font-bold text-gray-900">-</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Available</div>
                  <div className="text-lg font-bold text-green-600">-</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Average</div>
                  <div className="text-lg font-bold text-blue-600">-</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Min</div>
                  <div className="text-lg font-bold text-orange-600">-</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Max</div>
                  <div className="text-lg font-bold text-purple-600">-</div>
                </div>
              </div>
            </div>
          </div>

            {/* Error Message */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>

            {/* Chart Section with Navigation */}
            <div className="bg-white p-4 rounded-xl shadow mb-4">
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <h2 className="text-xl font-semibold text-gray-700 min-w-[200px] text-center">
                  {getMonthName(selectedMonth.month)} {selectedMonth.year}
                </h2>

                <button
                  onClick={() => navigateMonth('next')}
                  disabled={selectedMonth.year === new Date().getFullYear() && selectedMonth.month === new Date().getMonth()}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-md text-sm font-medium transition-colors"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="h-80 flex items-center justify-center">
                <p className="text-gray-500">No data available for selected month</p>
              </div>
            </div>

            {/* Empty Data Table */}
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Daily Availability Data
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Day
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Availability
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No data available
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </MainLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainLayout>
        <div className="mb-4">
          {/* Compact Header with Station Selector and Stats */}
          <div className="bg-white rounded-xl shadow p-4 mb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Station Selector */}
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-800">Station:</h1>
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors min-w-[180px]"
                  >
                    <span className="text-gray-700 text-sm">
                      {stationsLoading ? 'Loading...' : getCurrentStationName()}
                    </span>
                    <ChevronDown size={14} className={`text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[180px] max-h-48 overflow-y-auto">
                      {stations.map((station) => (
                        <button
                          key={station.kode_stasiun}
                          onClick={() => handleStationSelect(station.kode_stasiun)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-sm"
                        >
                          <div className="font-medium text-gray-900">{station.kode_stasiun}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Compact Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 flex-1 lg:ml-6">
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Total Days</div>
                  <div className="text-lg font-bold text-gray-900">{stats.totalDays}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Available</div>
                  <div className="text-lg font-bold text-green-600">{stats.availableDays}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Average</div>
                  <div className="text-lg font-bold text-blue-600">{stats.averageAvailability}%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Min</div>
                  <div className="text-lg font-bold text-orange-600">{stats.minAvailability}%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Max</div>
                  <div className="text-lg font-bold text-purple-600">{stats.maxAvailability}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-white p-4 rounded-xl shadow mb-4">
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              
              <h2 className="text-xl font-semibold text-gray-700 min-w-[200px] text-center">
                {getMonthName(selectedMonth.month)} {selectedMonth.year}
              </h2>
              
              <button
                onClick={() => navigateMonth('next')}
                disabled={selectedMonth.year === new Date().getFullYear() && selectedMonth.month === new Date().getMonth()}
                className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-md text-sm font-medium transition-colors"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="formattedDate"
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0} // Changed from 0 to 1 to show every other label
                  />
                  <YAxis
                    domain={[0, 100]}
                    label={{ value: 'Availability (%)', angle: -90, position: 'insideLeft' }}
                    fontSize={12}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      value !== null ? `${value}%` : 'No Data',
                      'Availability'
                    ]}
                    labelFormatter={(label: string) => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="availability"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Data Table */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Daily Availability Data
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Day
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Availability
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyData.map((day, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {day.formattedDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {day.dayOfWeek}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {day.availability !== null ? (
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${getAvailabilityColor(day.availability)}20`,
                                color: getAvailabilityColor(day.availability)
                              }}
                            >
                              {day.availability}%
                            </span>
                          ) : (
                            <span className="text-gray-400">No Data</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${getAvailabilityColor(day.availability)}20`,
                              color: getAvailabilityColor(day.availability)
                            }}
                          >
                            {getAvailabilityStatus(day.availability)}
                          </span>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </MainLayout>
    </div>
  );
};

export default StationAvailabilityDetail;
