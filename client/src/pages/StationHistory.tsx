import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import axiosInstance from "../utilities/AxiosServer";
import { ChevronLeft } from "lucide-react";

interface StationHistory {
  history_id: number;
  stasiun_id: number;
  kode_stasiun: string;
  net: string;
  channel: string | null;
  digitizer_name: string | null;
  total_gain: number | null;
  input_unit: string | null;
  sampling_rate: number | null;
  sensor_name: string | null;
  start_date: string | null;
  end_date: string | null;
  PAZ: number | null;
  status: boolean;
  created_at: string;
}

const StationHistory = () => {
  const { stationCode } = useParams<{ stationCode: string }>();
  const navigate = useNavigate();
  const [historyData, setHistoryData] = useState<StationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');

  useEffect(() => {
    const fetchStationHistory = async () => {
      if (!stationCode) return;

      setLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.get(`/api/station-history/bycode`, {
          params: { code: stationCode }
        });

        if (response.data.success) {
          setHistoryData(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch station history');
        }
      } catch (err) {
        console.error('Error fetching station history:', err);
        setError('Failed to load station history data');
      } finally {
        setLoading(false);
      }
    };

    fetchStationHistory();
  }, [stationCode]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get unique channels for filter
  const uniqueChannels = Array.from(new Set(historyData.map(item => item.channel).filter(Boolean))).sort();

  // Filter data based on selected channel
  const filteredData = selectedChannel === 'all' 
    ? historyData 
    : historyData.filter(item => item.channel === selectedChannel);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading station history...</p>
            </div>
          </div>
        </MainLayout>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainLayout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft size={20} />
                Back
              </button>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Station History: {stationCode}
                  </h1>
                  <p className="text-gray-600">
                    Complete equipment history and configuration changes for station {stationCode}
                  </p>
                </div>
                
                {/* Channel Filter */}
                <div className="flex items-center gap-2">
                  <label htmlFor="channel-filter" className="text-sm font-medium text-gray-700">
                    Filter by Channel:
                  </label>
                  <select
                    id="channel-filter"
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="all">All Channels</option>
                    {uniqueChannels.map(channel => (
                      <option key={channel!} value={channel!}>
                        {channel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Equipment History Records ({filteredData.length} entries)
                {selectedChannel !== 'all' && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    - Filtered by Channel: {selectedChannel}
                  </span>
                )}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Channel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sensor Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Digitizer Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Gain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Input Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sampling Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PAZ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-4 text-center text-gray-500">
                        {selectedChannel === 'all' 
                          ? 'No history data available for this station'
                          : `No history data available for channel ${selectedChannel}`
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((history, index) => (
                      <tr key={history.history_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(history.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {history.channel || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {history.sensor_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {history.digitizer_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {history.total_gain || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {history.input_unit || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {history.sampling_rate || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(history.start_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(history.end_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {history.PAZ || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              history.status
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {history.status ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </MainLayout>
    </div>
  );
};

export default StationHistory;