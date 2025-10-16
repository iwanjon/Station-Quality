import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import axiosServer from "../utilities/AxiosServer";
import { ChevronDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

// Configuration for availability ranges, colors, and labels
// Easily modify ranges, colors, and labels here - changes will apply to both chart and table
const AVAILABILITY_CONFIG = {
  ranges: [
    {
      key: '> 97%',
      label: '> 97%',
      min: 97.01,
      max: 100,
      chartColor: '#16a34a',
      legendColor: 'bg-green-600',
      tableColor: 'text-green-600'
    },
    {
      key: '90-97%',
      label: '90-97%',
      min: 90,
      max: 97,
      chartColor: '#ffff00',
      legendColor: 'bg-yellow-200',
      tableColor: 'text-yellow-600'
    },
    {
      key: '1-89%',
      label: '1-89%',
      min: 0.01,
      max: 89.99,
      chartColor: '#ff7f00',
      legendColor: 'bg-orange-400',
      tableColor: 'text-orange-400'
    },
    {
      key: '0%',
      label: '0%',
      min: 0,
      max: 0,
      chartColor: '#ff0000',
      legendColor: 'bg-red-500',
      tableColor: 'text-red-500'
    }
  ]
};

// Helper function to get chart color for a value
function getChartColorForValue(value: number | null): string {
  if (value === null || value === undefined) {
    return AVAILABILITY_CONFIG.ranges[3].chartColor; // 0%
  }

  for (const range of AVAILABILITY_CONFIG.ranges) {
    if (value >= range.min && value <= range.max) {
      return range.chartColor;
    }
  }

  return AVAILABILITY_CONFIG.ranges[3].chartColor; // fallback
}

interface Station {
  kode_stasiun: string;
}

interface ChartDataPoint {
  date: string;
  availability: number;
  day: number;
  color: string;
}

interface AvailabilityRecord {
  timestamp: string;
  availability: number | null;
  note?: string;
}

const StationAvailabilityDetail = () => {
  const { stationCode } = useParams<{ stationCode: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleStationSelect = (selectedStationCode: string) => {
    setDropdownOpen(false);
    navigate(`/station-availability/${selectedStationCode}`);
  };

  const handlePreviousMonth = () => {
    setSelectedMonth(prev => {
      if (prev === 0) {
        setSelectedYear(year => year - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => {
      if (prev === 11) {
        setSelectedYear(year => year + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const getCurrentStationName = () => {
    const currentStation = stations.find(station => station.kode_stasiun === stationCode);
    return currentStation ? currentStation.kode_stasiun : stationCode;
  };

  const fetchStations = useCallback(async () => {
    try {
      setStationsLoading(true);
      const response = await axiosServer.get('/api/stasiun/codes');
      if (response.data.success) {
        const stationList: Station[] = response.data.data.map((item: { kode_stasiun: string }) => ({
          kode_stasiun: item.kode_stasiun
        }));
        setStations(stationList);
      }
    } catch {
      // Fallback: create station from current stationCode
      const fallbackStation: Station = {
        kode_stasiun: stationCode!
      };
      setStations([fallbackStation]);
    } finally {
      setStationsLoading(false);
    }
  }, [stationCode]);

  const fetchCurrentMonthData = useCallback(async () => {
    if (!stationCode) return;

    setLoading(true);
    setError(null);

    try {
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0); // Last day of selected month

      // Use local date formatting to avoid timezone issues
      const start_date = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const end_date = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

      const response = await axiosServer.get(`/api/availability/${stationCode}`, {
        params: {
          start_date,
          end_date
        },
      });

      if (response.data.success && response.data.data && response.data.data[stationCode]) {
        const stationData = response.data.data[stationCode];

        // Create a map of existing data by day
        const dataByDay: { [key: number]: number | null } = {};

        stationData.forEach((record: AvailabilityRecord) => {
          // Extract day from date string directly to avoid timezone issues
          const dateString = record.timestamp.split('T')[0]; // Get YYYY-MM-DD part only
          const dateParts = dateString.split('-');
          const day = parseInt(dateParts[2]); // Get day from YYYY-MM-DD

          dataByDay[day] = record.availability;
        });

        // Get number of days in selected month with validation
        const getDaysInMonth = (year: number, month: number): number => {
          // Validate month range (0-11)
          if (month < 0 || month > 11) {
            return 31; // fallback to maximum days
          }
          // Validate year range (reasonable range)
          if (year < 2000 || year > 2100) {
            return 31; // fallback
          }
          return new Date(year, month + 1, 0).getDate();
        };

        const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

        // Create chart data points for all days in the month
        const chartPoints: ChartDataPoint[] = [];

        for (let day = 1; day <= daysInMonth; day++) {
          // Use string formatting to avoid timezone issues (same as API data parsing)
          const monthStr = String(selectedMonth + 1).padStart(2, '0');
          const dayStr = String(day).padStart(2, '0');
          const dateString = `${selectedYear}-${monthStr}-${dayStr}`;

          const availability = dataByDay[day] !== undefined ? dataByDay[day]! : 0; // Use 0 for missing data

          chartPoints.push({
            date: dateString,
            availability: availability,
            day: day,
            color: getChartColorForValue(availability)
          });
        }

        setChartData(chartPoints);
      } else {
        setError("No data available for selected month");
        setChartData([]);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load current month data: ${errorMessage}`);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [stationCode, selectedMonth, selectedYear]);

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

    fetchStations();
    fetchCurrentMonthData();
  }, [stationCode, fetchStations, fetchCurrentMonthData]);

  useEffect(() => {
    if (stationCode) {
      fetchCurrentMonthData();
    }
  }, [selectedMonth, selectedYear, fetchCurrentMonthData, stationCode]);

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

            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Station Information</h2>
              <div className="text-center py-12">
                <p className="text-gray-500">Station availability data will be displayed here</p>
                <p className="text-sm text-gray-400 mt-2">Chart functionality has been removed</p>
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

              <button
                onClick={() => navigate('/station-availability')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                Back to Station Availability
              </button>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-white p-4 rounded-xl shadow mb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2">
                <button
                  onClick={handlePreviousMonth}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Previous Month"
                >
                  <ChevronDown size={16} className="text-gray-600 rotate-90" />
                </button>
                <span className="text-lg font-semibold text-gray-800 min-w-[140px] text-center">
                  {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Next Month"
                >
                  <ChevronDown size={16} className="text-gray-600 -rotate-90" />
                </button>
              </div>
            </div>
            <div className="h-80">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      fontSize={10}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tickFormatter={(value) => {
                        // value is date string like "2025-10-01"
                        const dateStr = value as string;
                        const date = new Date(dateStr + 'T00:00:00'); // Add time to ensure proper parsing
                        return date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: '2-digit'
                        });
                      }}
                      label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      label={{ value: 'Availability (%)', angle: -90, position: 'insideLeft' }}
                      fontSize={12}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        value > 0 ? `${value}%` : 'No Data',
                        'Availability'
                      ]}
                      labelFormatter={(label: string) => {
                        // label is date string like "2025-10-01"
                        const date = new Date(label + 'T00:00:00');
                        return date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });
                      }}
                    />
                    <Bar
                      dataKey="availability"
                      stroke="#1d4ed8"
                      strokeWidth={1}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500">No data available for current month</p>
                    <p className="text-sm text-gray-400 mt-2">Data will appear as it becomes available</p>
                  </div>
                </div>
              )}
            </div>
            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4 text-sm">
              {AVAILABILITY_CONFIG.ranges.map(range => (
                <div key={range.key} className="flex items-center gap-2">
                  <div className={`w-4 h-4 ${range.legendColor} rounded`}></div>
                  <span>{range.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    </div>
  );
};

export default StationAvailabilityDetail;