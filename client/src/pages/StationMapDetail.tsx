import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { ChevronLeft, MapPin } from "lucide-react";
import axiosServer from "../utilities/AxiosServer";

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
  upt_penanggung_jawab: string;
  status: string;
  tahun_instalasi: number;
  jaringan: string;
  prioritas: string;
  keterangan: string | null;
  accelerometer: string;
  digitizer_komunikasi: string;
  tipe_shelter: string | null;
  lokasi_shelter: string;
  penjaga_shelter: string;
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

  const fetchStationDetail = useCallback(async () => {
    if (!stationCode) return;

    try {
      setLoading(true);
      // Fetch detail station berdasarkan kode
      const response = await axiosServer.get(`api/stasiun/${stationCode}`);
      setStation(response.data);
    } catch (err) {
      console.error('Error fetching station detail:', err);
      setError('Failed to load station detail');
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'aktif':
        return 'text-green-600 bg-green-100';
      case 'inactive':
      case 'non-aktif':
        return 'text-red-600 bg-red-100';
      case 'maintenance':
      case 'perawatan':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
      case 'tinggi':
        return 'text-red-600 bg-red-100';
      case 'medium':
      case 'sedang':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
      case 'rendah':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
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
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigate('/station-map')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ChevronLeft size={20} />
                Back to Station Map
              </button>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(station.status)}`}>
                  {station.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(station.prioritas)}`}>
                  {station.prioritas} Priority
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{station.kode_stasiun}</h1>
                <p className="text-gray-600">{station.net} Network</p>
              </div>
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
                  <h4 className="text-md font-semibold mb-3 text-gray-700">Site Information</h4>
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
                  <h4 className="text-md font-semibold mb-3 text-gray-700">Location Information</h4>
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
                        <td className="px-3 py-2 font-medium bg-gray-50 border-r border-gray-300">Status</td>
                        <td className="px-3 py-2">{station.status}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-medium bg-gray-50 border-r border-gray-300">Priority</td>
                        <td className="px-3 py-2">{station.prioritas}</td>
                      </tr>
                      {station.keterangan && (
                        <tr>
                          <td className="px-3 py-2 font-medium bg-gray-50 border-r border-gray-300">Description</td>
                          <td className="px-3 py-2">{station.keterangan}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Kanan: Leaflet Street View */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Location Map</h3>
                <div className="h-96 rounded-lg overflow-hidden border border-gray-300">
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
                </div>
                <div className="mt-4 text-end">
                  <a
                    href={`https://www.google.com/maps?q=${station.lintang},${station.bujur}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <MapPin size={16} />
                    Open in Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bagian 2: Kosongkan dulu */}
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Section 2</h2>
            <div className="text-center py-16 text-gray-500">
              This section is currently empty
            </div>
          </div>
        </div>
      </MainLayout>
    </div>
  );
};

export default StationMapDetail;