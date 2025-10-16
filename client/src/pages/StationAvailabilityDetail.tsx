import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import axiosServer from "../utilities/AxiosServer";
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

interface StationData {
  kode_stasiun: string;
}

const StationAvailabilityDetail = () => {
  const { stationCode } = useParams<{ stationCode: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stationList, setStationList] = useState<string[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | undefined>(stationCode);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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
    let mounted = true;
    axiosServer
      .get("/api/stasiun")
      .then((res) => {
        if (!mounted) return;
        const codes = (res.data || []).map((s: StationData) => s.kode_stasiun);
        setStationList(codes);
        
        if (!stationCode && codes.length > 0) {
          navigate(`/station-availability/${codes[0]}`, { replace: true });
        }
      })
      .catch(() => {
        if (!mounted) setStationList([]);
      });
    return () => { mounted = false; };
  }, [navigate, stationCode]);

  useEffect(() => {
    if (stationCode) {
      setSelectedStation(stationCode);
    }
  }, [stationCode]);

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
      <MainLayout>
        <div className="p-3 bg-gray-50 min-h-screen">
          <div className="flex items-start mb-3">
            <div className="flex items-center space-x-3">
              <div
                aria-hidden
                className="min-w-[90px] bg-gray-200 text-gray-800 font-bold px-3 py-2 rounded-md text-sm flex items-center justify-center"
              >
                Station
              </div>

              <div className="relative">
                <select
                  value={selectedStation ?? ""}
                  onChange={(e) => {
                    if (e.target.value) navigate(`/station-availability/${e.target.value}`);
                  }}
                  className="appearance-none min-w-[160px] border border-gray-300 rounded px-3 pr-10 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {stationList.length === 0 && <option value="">Loading...</option>}
                  {stationList.map((station) => (
                    <option key={station} value={station}>{station}</option>
                  ))}
                </select>

                <div className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
                  <span className="w-px h-6 bg-gray-200 mr-2" />
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
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
    );
  }

  return (
    <MainLayout>
      <div className="p-3 bg-gray-50 min-h-screen">
        <div className="flex items-start mb-3">
          <div className="flex items-center space-x-3">
            <div
              aria-hidden
              className="min-w-[90px] bg-gray-200 text-gray-800 font-bold px-3 py-2 rounded-md text-sm flex items-center justify-center"
            >
              Station
            </div>

            <div className="relative">
              <select
                value={selectedStation ?? ""}
                onChange={(e) => {
                  if (e.target.value) navigate(`/station-availability/${e.target.value}`);
                }}
                className="appearance-none min-w-[160px] border border-gray-300 rounded px-3 pr-10 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {stationList.length === 0 && <option value="">Loading...</option>}
                {stationList.map((station) => (
                  <option key={station} value={station}>{station}</option>
                ))}
              </select>

              <div className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
                <span className="w-px h-6 bg-gray-200 mr-2" />
                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
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
                  ‹
                </button>
                <span className="text-lg font-semibold text-gray-800 min-w-[140px] text-center">
                  {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Next Month"
                >
                  ›
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
  );
};

export default StationAvailabilityDetail;