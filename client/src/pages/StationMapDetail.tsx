import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { ChevronLeft, MapPin, ChevronDown, Edit } from "lucide-react";
import axiosServer from "../utilities/AxiosServer";
import EditStationModal from "../components/EditStationModal";

// Define StationData interface
interface StationData {
  [key: string]: string | number | null | undefined;
}

// Define interfaces
interface Stasiun {
  kode_stasiun: string;
  net: string;
  // Add other station properties as needed
}

interface StationHistory {
  history_id: number;
  stasiun_id: number;
  kode_stasiun: string;
  net: string;
  channel: string;
  sensor_name: string | null;
  digitizer_name: string | null;
  total_gain: number | null;
  input_unit: string | null;
  sampling_rate: number | null;
  start_date: string | null;
  end_date: string | null;
  paz: Record<string, unknown> | null;
  status: boolean;
  created_at: string;
}

// Fix Leaflet default markers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker,
  shadowUrl: markerShadow,
});

// Triangle icon function (same as quality page)
const triangleIcon = (color: string) =>
  L.divIcon({
    className: "",
    html: `
      <div style="
        width: 0; 
        height: 0; 
        border-left: 6px solid transparent; 
        border-right: 6px solid transparent; 
        border-bottom: 12px solid ${color};
        position: relative;
      ">
        <div style="
          position: absolute;
          left: -7px; top: -1px;
          width: 0; height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-bottom: 14px solid #222;
          z-index: -1;
        "></div>
      </div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 14],
  });

// Function to get color based on station status
const getColorByStatus = (): string => {
  return '#6b7280'; // gray for all stations
};

// Tipe data station (sama dengan StationMap)
interface Stasiun {
  stasiun_id: number;
  net: string;
  kode_stasiun: string;
  lintang: number;
  bujur: number;
  elevasi: number;
  lokasi: string;
  provinsi: string;
  provinsi_id: number;
  upt_penanggung_jawab: string;
  upt_id: number;
  status: string;
  tahun_instalasi: number;
  jaringan: string;
  jaringan_id: number;
  prioritas: string;
  keterangan: string | null;
  accelerometer: string;
  digitizer_komunikasi: string;
  tipe_shelter: string | null;
  lokasi_shelter: string;
  penjaga_shelter: string;
  kondisi_shelter: string;
  assets_shelter: string;
  access_shelter: string;
  photo_shelter: string;
  penggantian_terakhir_alat: string | null;
  updated_at: string;
}

const StationMapDetail = () => {
  const { stationCode } = useParams<{ stationCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [station, setStation] = useState<Stasiun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stations, setStations] = useState<Stasiun[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [stationHistory, setStationHistory] = useState<StationHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showShelterInfo, setShowShelterInfo] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<string>('');

  const fetchStationDetail = useCallback(async () => {
    if (!stationCode) return;

    try {
      setLoading(true);
      // Fetch detail station berdasarkan kode
      const response = await axiosServer.get(`/api/stasiun/bycode?code=${stationCode}`);
      setStation(response.data.data);
    } catch (err) {
      console.error('Error fetching station detail:', err);
      setError('Failed to load station detail');
    } finally {
      setLoading(false);
    }
  }, [stationCode]);

  const fetchStations = useCallback(async () => {
    try {
      setStationsLoading(true);
      const response = await axiosServer.get('/api/stasiun/codes');
      if (response.data.success) {
        const stationList: Stasiun[] = response.data.data.map((item: { kode_stasiun: string }) => ({
          kode_stasiun: item.kode_stasiun
        } as Stasiun));
        setStations(stationList);
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      // Fallback: create station from current stationCode
      const fallbackStation: Stasiun = {
        kode_stasiun: stationCode!
      } as Stasiun;
      setStations([fallbackStation]);
    } finally {
      setStationsLoading(false);
    }
  }, [stationCode]);

  const handleStationSelect = (selectedStationCode: string) => {
    setDropdownOpen(false);
    navigate(`/station-map/${selectedStationCode}`);
  };

  const getCurrentStationName = () => {
    const currentStation = stations.find(station => station.kode_stasiun === stationCode);
    return currentStation ? currentStation.kode_stasiun : stationCode;
  };

  const fetchStationHistory = useCallback(async () => {
    if (!stationCode) return;

    try {
      setHistoryLoading(true);
      const response = await axiosServer.get(`/api/station-history/bycode?code=${stationCode}`);
      if (response.data.success) {
        setStationHistory(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching station history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [stationCode]);

  useEffect(() => {
    // Cek apakah data station dikirim melalui state navigation
    const stationData = location.state?.station as Stasiun;

    if (stationData) {
      setStation(stationData);
      setLoading(false);
    } else if (stationCode) {
      // Jika tidak ada data di state, fetch berdasarkan stationCode
      fetchStationDetail();
    } else {
      setError("Station code not provided");
      setLoading(false);
    }
  }, [stationCode, location.state, fetchStationDetail]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  useEffect(() => {
    if (stationCode && station) {
      fetchStationHistory();
    }
  }, [stationCode, station, fetchStationHistory]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen && !(event.target as Element).closest('.relative')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleEditSuccess = useCallback(async (updatedData: StationData) => {
    console.log('✅ Update successful, received data:', updatedData);
    console.log('🔄 Refreshing station data...');

    if (!station?.kode_stasiun) {
      console.error('❌ Station code not available for refresh');
      return;
    }

    try {
      // Fetch fresh data from server
      const response = await axiosServer.get(`/api/stasiun/bycode?code=${station.kode_stasiun}`);
      console.log('📡 Server response:', response.data);

      if (response.data.success && response.data.data) {
        console.log('📦 Setting new station data:', response.data.data);
        console.log('🔄 Previous station state:', station);

        // Update station state with fresh data
        setStation(prevStation => {
          const newData = { ...response.data.data };
          console.log('🔄 Updating station from:', prevStation, 'to:', newData);
          return newData;
        });

        console.log('🔄 Data refreshed successfully');

        // Verify the update after a short delay
        setTimeout(() => {
          console.log('🔍 Verification - Current station state:', station);
        }, 100);

      } else {
        console.error('❌ Invalid response format:', response.data);
      }
    } catch (error) {
      console.error('❌ Failed to refresh data:', error);
    }

    setEditModalOpen(false);
    setEditingSection('');

    // Delay alert to ensure state update is complete
    setTimeout(() => {
      alert('Station data updated successfully!');
    }, 200);
  }, [station]);

  const handleEditClick = (section: string) => {
    setEditingSection(section);
    setEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </MainLayout>
      </div>
    );
  }

  if (error || !station) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainLayout>
          <div className="mb-4">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigate('/station-map')}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ChevronLeft size={20} />
                  Back to Station Map
                </button>
              </div>
              <div className="text-center py-12">
                <p className="text-red-600 text-lg">{error || 'Station not found'}</p>
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
        <div className="mb-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow p-6 mb-6">
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
                onClick={() => navigate('/station-map')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ChevronLeft size={20} />
                Back to Station Map
              </button>
            </div>
          </div>

          {/* Bagian 1: Informasi Umum dan Peta */}
          <div className="bg-white p-6 rounded-2xl shadow-md mb-6">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Station Information</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Kiri: Informasi Umum dalam Tabel */}
              <div className="space-y-6">
                {/* Site Information Table */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-md font-semibold text-gray-700">Site Information</h4>
                    <button
                      onClick={() => handleEditClick('site')}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                  </div>
                  <table className="w-full border border-gray-300 text-sm">
                    <tbody>
                      <tr>
                        <td className="px-3 py-2 font-medium bg-gray-50 border-r border-gray-300 w-1/2">Station Code</td>
                        <td className="px-3 py-2">{station.kode_stasiun}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-medium bg-gray-50 border-r border-gray-300">Latitude</td>
                        <td className="px-3 py-2">{station.lintang}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-medium bg-gray-50 border-r border-gray-300">Longitude</td>
                        <td className="px-3 py-2">{station.bujur}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-medium bg-gray-50 border-r border-gray-300">Elevation</td>
                        <td className="px-3 py-2">{station.elevasi} m</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-medium bg-gray-50 border-r border-gray-300">Year of Installation</td>
                        <td className="px-3 py-2">{station.tahun_instalasi}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-medium bg-gray-50 border-r border-gray-300">Group</td>
                        <td className="px-3 py-2">{station.jaringan}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-medium bg-gray-50 border-r border-gray-300">UPT</td>
                        <td className="px-3 py-2">{station.upt_penanggung_jawab}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Location Information Table */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowShelterInfo(false)}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                          !showShelterInfo
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Location Info
                      </button>
                      <button
                        onClick={() => setShowShelterInfo(true)}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                          showShelterInfo
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Shelter Info
                      </button>
                    </div>
                    <button
                      onClick={() => handleEditClick(showShelterInfo ? 'shelter' : 'location')}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                  </div>

                  {!showShelterInfo ? (
                    <table className="w-full border border-gray-300 text-sm">
                      <tbody>
                        <tr>
                          <td className="px-3 py-2 font-medium bg-gray-50 border-r border-gray-300 w-1/2">Address</td>
                          <td className="px-3 py-2">{station.lokasi}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-medium bg-gray-50 border-r border-gray-300">Province</td>
                          <td className="px-3 py-2">{station.provinsi}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-medium bg-gray-50 border-r border-gray-300">Description</td>
                          <td className="px-3 py-2">{station.keterangan || '-'}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-medium bg-gray-50 border-r border-gray-300">Access Shelter</td>
                          <td className="px-3 py-2">{station.access_shelter || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full border border-gray-300 text-sm">
                      <tbody>
                        <tr>
                          <td className="px-3 py-2 font-medium bg-gray-50 border-r border-gray-300 w-1/2">Shelter Type</td>
                          <td className="px-3 py-2">{station.tipe_shelter || '-'}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-medium bg-gray-50 border-r border-gray-300">Installation Sensor Type</td>
                          <td className="px-3 py-2">{station.accelerometer || '-'}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-medium bg-gray-50 border-r border-gray-300">Communication Equipment</td>
                          <td className="px-3 py-2">{station.digitizer_komunikasi || '-'}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-medium bg-gray-50 border-r border-gray-300">Shelter Location</td>
                          <td className="px-3 py-2">{station.lokasi_shelter || '-'}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-medium bg-gray-50 border-r border-gray-300">Shelter Guard</td>
                          <td className="px-3 py-2">{station.penjaga_shelter || '-'}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-medium bg-gray-50 border-r border-gray-300">Assets Shelter</td>
                          <td className="px-3 py-2">{station.assets_shelter || '-'}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-medium bg-gray-50 border-r border-gray-300">Kondisi Shelter</td>
                          <td className="px-3 py-2">{station.kondisi_shelter || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Kanan: Leaflet Street View */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Location Map</h3>
                <div className="h-96 rounded-lg overflow-hidden border border-gray-300">
                  {station.lintang && station.bujur && !isNaN(station.lintang) && !isNaN(station.bujur) ? (
                    <MapContainer
                      center={[station.lintang, station.bujur]}
                      zoom={17}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[station.lintang, station.bujur]} icon={triangleIcon(getColorByStatus())}>
                        <Popup>
                          <div className="text-center">
                            <h3 className="font-semibold">{station.kode_stasiun}</h3>
                            <p className="text-sm text-gray-600">{station.lokasi}</p>
                            <p className="text-sm text-gray-600">{station.provinsi}</p>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-100">
                      <div className="text-center">
                        <div className="text-gray-400 mb-2">
                          <MapPin size={48} className="mx-auto" />
                        </div>
                        <p className="text-gray-500">Loading map...</p>
                        <p className="text-sm text-gray-400">Coordinates not available</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 text-end">
                  {station.lintang && station.bujur && !isNaN(station.lintang) && !isNaN(station.bujur) ? (
                    <a
                      href={`https://www.google.com/maps?q=${station.lintang},${station.bujur}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <MapPin size={16} />
                      Open in Google Maps
                    </a>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-400 text-white text-sm font-medium rounded-lg cursor-not-allowed"
                    >
                      <MapPin size={16} />
                      Open in Google Maps
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bagian 2: Kosongkan dulu */}
          <div className="bg-white p-6 rounded-2xl shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Site photo</h2>
            <div className="text-center py-16 text-gray-500">
              This section is currently empty
            </div>
          </div>

          {/* Bagian 3: Equipment Details dengan Station History per Channel */}
          <div className="bg-white p-6 rounded-2xl shadow-md mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Equipment Details</h2>
              <Link
                to={`/station-history/${stationCode}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
              >
                View Full Station History →
              </Link>
            </div>
            <div className="mb-4">
              <table className="w-full border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 font-medium border-r border-gray-300 text-left">Station Code</th>
                    <th className="px-3 py-2 font-medium border-r border-gray-300 text-left">Channel</th>
                    <th className="px-3 py-2 font-medium border-r border-gray-300 text-left">Sensor Name</th>
                    <th className="px-3 py-2 font-medium border-r border-gray-300 text-left">Digitizer Name</th>
                    <th className="px-3 py-2 font-medium border-r border-gray-300 text-left">Total Gain</th>
                    <th className="px-3 py-2 font-medium border-r border-gray-300 text-left">Input Unit</th>
                    <th className="px-3 py-2 font-medium border-r border-gray-300 text-left">Sampling Rate</th>
                    <th className="px-3 py-2 font-medium text-left">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLoading ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                        Loading equipment data...
                      </td>
                    </tr>
                  ) : stationHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                        No equipment history data available
                      </td>
                    </tr>
                  ) : (
                    // Group by channel and show latest record for each channel
                    ['SHE', 'SHN', 'SHZ'].map((channel) => {
                      const channelData = stationHistory
                        .filter((history: StationHistory) => history.channel === channel)
                        .sort((a: StationHistory, b: StationHistory) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

                      return (
                        <tr key={channel} className="border-t border-gray-200">
                          <td className="px-3 py-2 font-medium text-gray-800">{station.kode_stasiun}</td>
                          <td className="px-3 py-2 font-medium text-blue-600">{channel}</td>
                          <td className="px-3 py-2">{channelData?.sensor_name || '-'}</td>
                          <td className="px-3 py-2">{channelData?.digitizer_name || '-'}</td>
                          <td className="px-3 py-2">{channelData?.total_gain || '-'}</td>
                          <td className="px-3 py-2">{channelData?.input_unit || '-'}</td>
                          <td className="px-3 py-2">{channelData?.sampling_rate || '-'}</td>
                          <td className="px-3 py-2">
                            {channelData?.created_at
                              ? new Date(channelData.created_at).toLocaleDateString('id-ID', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '-'
                            }
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => window.open(`https://geof.bmkg.go.id/fdsnws/station/1/query?network=${station.net}&station=${station.kode_stasiun}&level=response&format=sc3ml&nodata=404`, '_blank')}
              >
                Metadata (SC3ML)
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                onClick={() => window.open(`https://geof.bmkg.go.id/fdsnws/station/1/query?network=${station.net}&station=${station.kode_stasiun}&level=response&format=fdsnxml&nodata=404`, '_blank')}
              >
                Metadata (FDSNXML)
              </button>
            </div>
          </div>
        </div>
      </MainLayout>

      {/* Edit Station Modal */}
      {station && (
        <EditStationModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingSection('');
          }}
          stationCode={station.kode_stasiun}
          stationData={station as unknown as StationData}
          onSuccess={handleEditSuccess}
          fieldsToEdit={
            editingSection === 'site'
              ? ['lintang', 'bujur', 'elevasi', 'tahun_instalasi', 'jaringan', 'upt_penanggung_jawab']
              : editingSection === 'location'
              ? ['lokasi', 'provinsi', 'keterangan', 'access_shelter']
              : editingSection === 'shelter'
              ? ['tipe_shelter', 'accelerometer', 'digitizer_komunikasi', 'lokasi_shelter', 'penjaga_shelter', 'assets_shelter', 'kondisi_shelter']
              : []
          }
          title={
            editingSection === 'site'
              ? 'Edit Site Information'
              : editingSection === 'location'
              ? 'Edit Location Information'
              : editingSection === 'shelter'
              ? 'Edit Shelter Information'
              : 'Edit Information'
          }
        />
      )}
    </div>
  );
};

export default StationMapDetail;