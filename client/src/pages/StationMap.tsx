import { useState, useEffect, useMemo } from "react";
import MainLayout from "../layouts/MainLayout";
import axiosServer from "../utilities/AxiosServer";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import DataTable from "../components/DataTable";
import TableFilters from "../components/TableFilters";
import FieldGuidelines from "../components/FieldGuidelines";
import { Link } from "react-router-dom";
import { Download, Upload, FileText } from "lucide-react";
import type { CellContext } from "@tanstack/react-table";

// Tipe data station
interface Stasiun {
  stasiun_id: number;
  net: string;
  kode_stasiun: string;
  lintang: number;
  bujur: number;
  elevasi: number;
  lokasi: string;
  provinsi: string; // field sebenarnya
  upt_penanggung_jawab: string; // field sebenarnya
  status: string;
  tahun_instalasi: number;
  jaringan: string; // field sebenarnya
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

const StationMap = () => {
  const [data, setData] = useState<Stasiun[]>([]);
  const [loading, setLoading] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [showForeignKeyHelp, setShowForeignKeyHelp] = useState(false);
  const [foreignKeyOptions, setForeignKeyOptions] = useState<{
    provinces: string[];
    upts: string[];
    networks: string[];
  } | null>(null);

  // Filter states - consolidated into single object for TableFilters
  const [filters, setFilters] = useState<Record<string, string | string[]>>({
    provinsi: [],
    upt: [],
    tahun_instalasi: [],
    prioritas: [],
    status: []
  });

  // Separate state for station code search (text input)
  const [searchKode, setSearchKode] = useState<string>("");

  // Column visibility states
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    net: true,
    kode_stasiun: true,
    lokasi: true,
    provinsi: true,
    upt_penanggung_jawab: true,
    status: true,
    tahun_instalasi: true,
    lintang: true,
    bujur: true,
  });

  // Selected station for card display
  const [selectedStation, setSelectedStation] = useState<Stasiun | null>(null);

  // Column visibility toggle handler
  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  // Generate CSV template for station creation
  const handleDownloadTemplate = () => {
    // Define CSV headers based on station fields
    const headers = [
      "net",
      "kode_stasiun",
      "lintang",
      "bujur",
      "elevasi",
      "lokasi",
      "provinsi",
      "upt_penanggung_jawab",
      "status",
      "tahun_instalasi",
      "jaringan",
      "prioritas",
      "keterangan",
      "accelerometer",
      "digitizer_komunikasi",
      "tipe_shelter",
      "lokasi_shelter",
      "penjaga_shelter",
      "kondisi_shelter",
      "assets_shelter",
      "access_shelter",
      "photo_shelter",
      "penggantian_terakhir_alat",
      "is_sample"
    ];

    // Create sample data row with detailed comments
    const sampleData = [
      "IA", // net - Network code: "IA" or "II"
      "ABC123", // kode_stasiun - Unique station code
      "-6.2088", // lintang - Latitude (decimal format)
      "106.8456", // bujur - Longitude (decimal format)
      "100", // elevasi - Elevation in meters
      "Jakarta Pusat", // lokasi - Full address/location
      "DKI Jakarta", // provinsi - EXACT province name from database (see View Valid Options)
      "UPT Jakarta", // upt_penanggung_jawab - EXACT UPT name from database (see View Valid Options)
      "aktif", // status - Station status: "aktif" or "nonaktif"
      "2020", // tahun_instalasi - Installation year
      "BMKG", // jaringan - EXACT network name from database (see View Valid Options)
      "P1", // prioritas - Priority level: "P1", "P2", or "P3"
      "Sample station description", // keterangan - Description/notes
      "installed", // accelerometer - Accelerometer: "installed" or "not_installed"
      "installed", // digitizer_komunikasi - Communication equipment: "installed" or "not_installed"
      "bunker", // tipe_shelter - Shelter type: "bunker", "posthole", or "surface"
      "outside_BMKG_office", // lokasi_shelter - Shelter location: "outside_BMKG_office" or "inside_BMKG_office"
      "ada", // penjaga_shelter - Shelter guard: "ada" or "tidak_ada"
      "baik", // kondisi_shelter - Shelter condition: "baik", "rusak_ringan", or "rusak_berat"
      "GPS, Solar Panel, Battery", // assets_shelter - Shelter assets
      "Easy access, 24/7 available", // access_shelter - Shelter access information
      "shelter_photo.jpg", // photo_shelter - Shelter photo filename
      "2023-01-15", // penggantian_terakhir_alat - Last equipment replacement date (YYYY-MM-DD)
      "true" // is_sample - Mark as sample (true/false)
    ];

    // Create CSV content with headers and sample data
    const csvContent = [headers, sampleData]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `station_template_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch foreign key options
  const fetchForeignKeyOptions = async () => {
    try {
      const response = await axiosServer.get('/api/stasiun/foreign-key-options');
      setForeignKeyOptions(response.data.data);
      setShowForeignKeyHelp(true);
    } catch (error) {
      console.error('Error fetching foreign key options:', error);
      alert('Failed to fetch foreign key options');
    }
  };

  // Handle CSV file import
  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', file);

      const response = await axiosServer.post('/api/stasiun/import-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setImportSuccess(`Successfully imported ${response.data.insertedCount} stations`);
        // Refresh data
        const stationsResponse = await axiosServer.get("/api/stasiun");
        setData(stationsResponse.data);
      } else {
        setImportError(response.data.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportError('Failed to import CSV file');
    } finally {
      setImportLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }

    // Define CSV headers
    const headers = [
      "Net",
      "Kode Stasiun", 
      "Lokasi",
      "Provinsi",
      "UPT",
      "Status",
      "Tahun Instalasi",
      "Lintang",
      "Bujur",
      "Elevasi",
      "Jaringan",
      "Prioritas",
      "Keterangan",
      "Accelerometer",
      "Digitizer Komunikasi",
      "Tipe Shelter",
      "Lokasi Shelter",
      "Penjaga Shelter",
      "Kondisi Shelter",
      "Assets Shelter",
      "Access Shelter",
      "Photo Shelter",
      "Penggantian Terakhir Alat",
      "Updated At"
    ];

    // Convert data to CSV rows
    const csvRows = filteredData.map(station => [
      station.net,
      station.kode_stasiun,
      station.lokasi,
      station.provinsi,
      station.upt_penanggung_jawab,
      station.status,
      station.tahun_instalasi,
      station.lintang,
      station.bujur,
      station.elevasi,
      station.jaringan,
      station.prioritas,
      station.keterangan || "",
      station.accelerometer,
      station.digitizer_komunikasi,
      station.tipe_shelter || "",
      station.lokasi_shelter,
      station.penjaga_shelter,
      station.kondisi_shelter || "",
      station.assets_shelter || "",
      station.access_shelter || "",
      station.photo_shelter || "",
      station.penggantian_terakhir_alat || "",
      station.updated_at
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `stasiun_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    axiosServer
      .get("/api/stasiun")
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error("Error fetching station data:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Filter data berdasarkan All filter
  const filteredData = data && Array.isArray(data) ? data.filter((station) => {
    return (
      (filters.prioritas.length === 0 || filters.prioritas.includes(station.prioritas)) &&
      (filters.provinsi.length === 0 || filters.provinsi.includes(station.provinsi)) &&
      (filters.upt.length === 0 || filters.upt.includes(station.upt_penanggung_jawab)) &&
      (filters.tahun_instalasi.length === 0 || filters.tahun_instalasi.includes(String(station.tahun_instalasi))) &&
      (filters.status.length === 0 || filters.status.includes(station.status)) &&
      (searchKode === "" || station.kode_stasiun.toLowerCase().includes(searchKode.toLowerCase()))
    );
  }) : [];

  // Get all available options from data (not filtered)
  const allOptions = useMemo(() => {
    if (!data || !Array.isArray(data)) return { provinsi: [], upt: [], tahun: [], prioritas: [], status: [] };

    return {
      provinsi: Array.from(new Set(data.map(s => s.provinsi))).filter(v => v !== null && v !== undefined).sort(),
      upt: Array.from(new Set(data.map(s => s.upt_penanggung_jawab))).filter(v => v !== null && v !== undefined).sort(),
      tahun: Array.from(new Set(data.map(s => s.tahun_instalasi))).filter(v => v !== null && v !== undefined).sort(),
      prioritas: Array.from(new Set(data.map(s => s.prioritas))).filter(v => v !== null && v !== undefined).sort(),
      status: Array.from(new Set(data.map(s => s.status))).filter(v => v !== null && v !== undefined).sort()
    };
  }, [data]);

  // Filter configuration for TableFilters component
  const filterConfig = useMemo(() => ({
    provinsi: {
      label: "Province",
      type: "multi" as const,
      options: allOptions.provinsi
    },
    upt: {
      label: "UPT",
      type: "multi" as const,
      options: allOptions.upt
    },
    tahun_instalasi: {
      label: "Installation Year",
      type: "multi" as const,
      options: allOptions.tahun.map(String)
    },
    prioritas: {
      label: "Priority",
      type: "multi" as const,
      options: allOptions.prioritas
    },
    status: {
      label: "Status",
      type: "multi" as const,
      options: allOptions.status
    }
  }), [allOptions]);

  // Default center Indonesia
  const center: [number, number] = [-2.5, 118];

  const columns = [
    {
      header: "Net",
      accessorKey: "net",
      cell: (info: CellContext<Stasiun, unknown>) => info.getValue(),
    },
    {
      header: "Station Code",
      accessorKey: "kode_stasiun",
      cell: (info: CellContext<Stasiun, unknown>) => info.getValue(),
    },
    {
      header: "Location",
      accessorKey: "lokasi",
      cell: (info: CellContext<Stasiun, unknown>) => info.getValue(),
    },
    {
      header: "Province",
      accessorKey: "provinsi",
      cell: (info: CellContext<Stasiun, unknown>) => info.getValue(),
    },
    {
      header: "UPT",
      accessorKey: "upt_penanggung_jawab",
      cell: (info: CellContext<Stasiun, unknown>) => info.getValue(),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (info: CellContext<Stasiun, unknown>) => info.getValue(),
    },
    {
      header: "Installation Year",
      accessorKey: "tahun_instalasi",
      cell: (info: CellContext<Stasiun, unknown>) => info.getValue(),
    },
    {
      header: "Latitude",
      accessorKey: "lintang",
      cell: (info: CellContext<Stasiun, unknown>) => info.getValue(),
    },
    {
      header: "Longitude",
      accessorKey: "bujur",
      cell: (info: CellContext<Stasiun, unknown>) => info.getValue(),
    },
  ];

  // Filter columns based on visibility
  const visibleColumnsArray = columns.filter(column => visibleColumns[column.accessorKey]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainLayout>
        <h1 className="text-left text-2xl font-bold mt-0 mb-2 ml-1">
          Station Metadata
        </h1>

        {/* Foreign Key Options Modal */}
        {showForeignKeyHelp && foreignKeyOptions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Valid Foreign Key Options</h3>
                  <button
                    onClick={() => setShowForeignKeyHelp(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Provinces */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      📍 Provinces (provinsi)
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                      <ul className="text-sm space-y-1">
                        {foreignKeyOptions.provinces.map((province, index) => (
                          <li key={index} className="text-gray-600 hover:text-gray-800 cursor-default">
                            "{province}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* UPT Names */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      🏢 UPT Names (upt_penanggung_jawab)
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                      <ul className="text-sm space-y-1">
                        {foreignKeyOptions.upts.map((upt, index) => (
                          <li key={index} className="text-gray-600 hover:text-gray-800 cursor-default">
                            "{upt}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Networks */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      🌐 Networks (jaringan)
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                      <ul className="text-sm space-y-1">
                        {foreignKeyOptions.networks.map((network, index) => (
                          <li key={index} className="text-gray-600 hover:text-gray-800 cursor-default">
                            "{network}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>💡 Copy and paste these exact values</strong> into your CSV file to avoid foreign key errors. 
                    The names must match exactly (including capitalization and spacing).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Combined Filter and Map Container */}
        <div className="flex bg-white p-2 rounded-xl shadow">
          <div className="w-80 p-4 flex-shrink-0 border-r border-gray-200">
            <h3 className="text-lg font-bold mb-4">Advanced Filter</h3>

            {/* Station Code Search */}
            <div className="mb-4">
              <label htmlFor="search-kode" className="font-semibold text-sm mb-1 block">
                Station Code:
              </label>
              <input
                id="search-kode"
                type="text"
                className="border rounded px-2 py-1 text-sm w-full"
                placeholder="Input station code..."
                value={searchKode}
                onChange={(e) => setSearchKode(e.target.value)}
              />
            </div>

            {/* TableFilters Component */}
            <TableFilters
              filters={filters}
              setFilters={setFilters}
              filterConfig={filterConfig}
            />

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className="flex-1 px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm font-semibold"
                onClick={handleExportCSV}
              >
                Export CSV
              </button>
            </div>

            {/* Station Count Display */}
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600">
                {filteredData.length === 0
                  ? "No stations found"
                  : `Now showing ${filteredData.length} station${filteredData.length === 1 ? '' : 's'}`
                }
              </p>
            </div>
          </div>

          {/* Map Container - Right Side */}
          <div className="flex-1 overflow-hidden shadow relative">
            <MapContainer center={center} zoom={5} style={{ height: "80vh", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {!loading &&
                filteredData.map((station) =>
                  station.lintang && station.bujur ? (
                    <Marker
                      key={station.stasiun_id}
                      position={[station.lintang, station.bujur]}
                      icon={triangleIcon(getColorByStatus())}
                      eventHandlers={{
                        click: () => setSelectedStation(station)
                      }}
                    />
                  ) : null
                )}
            </MapContainer>

            {/* Station Info Card - Top Right */}
            {selectedStation && (
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-64 z-[1000]">
                <div className="space-y-2">
                  <div className="font-bold text-lg text-blue-600">{selectedStation.kode_stasiun}</div>
                  <div className="text-sm text-gray-600">{selectedStation.lokasi}, {selectedStation.provinsi}</div>
                  <div className="text-sm"><span className="font-medium">UPT:</span> {selectedStation.upt_penanggung_jawab}</div>
                  <div className="text-sm"><span className="font-medium">Priority:</span> {selectedStation.prioritas}</div>
                  <div className="text-sm"><span className="font-medium">Status:</span> {selectedStation.status}</div>
                  <Link 
                    to={`/station-map/${selectedStation.kode_stasiun}`}
                    state={{ station: selectedStation }}
                    className="w-full mt-3 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors text-center block"
                  >
                    Show details &gt;&gt;&gt;
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Table Stasiun */}
        <div className="bg-white p-4 rounded-xl shadow mt-8">
          <div className="flex justify-between items-center mb-4">            
            {/* Column Visibility Controls */}
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="font-medium text-gray-700">Show/Hide Column(s):</span>
              {columns.map((column) => (
                <button
                  key={column.accessorKey}
                  onClick={() => toggleColumnVisibility(column.accessorKey)}
                  className={`px-2 py-1 rounded border text-xs transition-colors ${
                    visibleColumns[column.accessorKey]
                      ? 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200'
                      : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={`${visibleColumns[column.accessorKey] ? 'Hide' : 'Show'} ${column.header}`}
                >
                  {column.header}
                </button>
              ))}
            </div>
          </div>
          
          <DataTable columns={visibleColumnsArray} data={filteredData} />
        </div>

        {/* Import/Export Controls */}
        <div className="bg-white p-4 rounded-xl shadow mb-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Data Management</h2>
            <div className="flex gap-3">
              {/* Download Template Button */}
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                title="Download CSV template for bulk station creation"
              >
                <Download size={16} />
                Download Template
              </button>

              {/* Show Foreign Key Options Button */}
              <button
                onClick={fetchForeignKeyOptions}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                title="Show valid values for foreign key fields"
              >
                <FileText size={16} />
                View Valid Options
              </button>

              {/* Import CSV Button */}
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={importLoading}
                />
                <button
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    importLoading
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                  disabled={importLoading}
                  title="Import stations from CSV file"
                >
                  <Upload size={16} />
                  {importLoading ? 'Importing...' : 'Import CSV'}
                </button>
              </div>
            </div>
          </div>

          {/* Import Status Messages */}
          {importError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{importError}</p>
            </div>
          )}
          {importSuccess && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{importSuccess}</p>
            </div>
          )}

          {/* Instructions */}
          <FieldGuidelines />
        </div>
      </MainLayout>
    </div>
  );
};

export default StationMap;
