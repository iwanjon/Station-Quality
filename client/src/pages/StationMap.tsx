import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import axiosServer from "../utilities/AxiosServer";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import DataTable from "../components/DataTable";
import { Link } from "react-router-dom";

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

  // Filter states
  const [filterProvinsi, setFilterProvinsi] = useState<string>("");
  const [filterUpt, setFilterUpt] = useState<string>("");
  const [filterTahun, setFilterTahun] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
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

  // Reset filter handler
  const handleResetFilter = () => {
    setFilterProvinsi("");
    setFilterUpt("");
    setFilterTahun("");
    setFilterPriority("");
    setFilterStatus("");
    setSearchKode("");
  };

  // Column visibility toggle handler
  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
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
      (filterPriority === "" || String(station.prioritas) === filterPriority) &&
      (filterProvinsi === "" || String(station.provinsi) === filterProvinsi) &&
      (filterUpt === "" || String(station.upt_penanggung_jawab) === filterUpt) &&
      (filterTahun === "" || String(station.tahun_instalasi) === filterTahun) &&
      (filterStatus === "" || String(station.status) === filterStatus) &&
      (searchKode === "" || station.kode_stasiun.toLowerCase().includes(searchKode.toLowerCase()))
    );
  }) : [];

  // Fungsi untuk mendapatkan opsi dropdown yang tersedia berdasarkan filter yang sudah dipilih
  const getAvailableOptions = () => {
    // Data yang sudah difilter sebagian (tanpa field yang sedang diupdate)
    const getFilteredDataExcept = (excludeField: string) => {
      return data && Array.isArray(data) ? data.filter((station) => {
        return (
          (excludeField === 'priority' || filterPriority === "" || String(station.prioritas) === filterPriority) &&
          (excludeField === 'provinsi' || filterProvinsi === "" || String(station.provinsi) === filterProvinsi) &&
          (excludeField === 'upt' || filterUpt === "" || String(station.upt_penanggung_jawab) === filterUpt) &&
          (excludeField === 'tahun' || filterTahun === "" || String(station.tahun_instalasi) === filterTahun) &&
          (excludeField === 'status' || filterStatus === "" || String(station.status) === filterStatus) &&
          (excludeField === 'search' || searchKode === "" || station.kode_stasiun.toLowerCase().includes(searchKode.toLowerCase()))
        );
      }) : [];
    };

    return {
      prioritas: Array.from(new Set(getFilteredDataExcept('priority').map(s => s.prioritas))).filter(v => v !== null && v !== undefined).sort(), 
      provinsi: Array.from(new Set(getFilteredDataExcept('provinsi').map(s => s.provinsi))).filter(v => v !== null && v !== undefined).sort(),
      upt: Array.from(new Set(getFilteredDataExcept('upt').map(s => s.upt_penanggung_jawab))).filter(v => v !== null && v !== undefined).sort(),
      tahun: Array.from(new Set(getFilteredDataExcept('tahun').map(s => s.tahun_instalasi))).filter(v => v !== null && v !== undefined).sort(),
      status: Array.from(new Set(getFilteredDataExcept('status').map(s => s.status))).filter(v => v !== null && v !== undefined).sort()
    };
  };

  const availableOptions = getAvailableOptions();

  

  // Default center Indonesia
  const center: [number, number] = [-2.5, 118];

  const columns = [
    {
      header: "Net",
      accessorKey: "net",
      cell: (info: { getValue: () => string }) => info.getValue(),
    },
    {
      header: "Station Code",
      accessorKey: "kode_stasiun",
      cell: (info: { getValue: () => string }) => info.getValue(),
    },
    {
      header: "Location",
      accessorKey: "lokasi",
      cell: (info: { getValue: () => string }) => info.getValue(),
    },
    {
      header: "Province",
      accessorKey: "provinsi",
      cell: (info: { getValue: () => string }) => info.getValue(),
    },
    {
      header: "UPT",
      accessorKey: "upt_penanggung_jawab",
      cell: (info: { getValue: () => string }) => info.getValue(),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (info: { getValue: () => string }) => info.getValue(),
    },
    {
      header: "Installation Year",
      accessorKey: "tahun_instalasi",
      cell: (info: { getValue: () => number }) => info.getValue(),
    },
    {
      header: "Latitude",
      accessorKey: "lintang",
      cell: (info: { getValue: () => number }) => info.getValue(),
    },
    {
      header: "Longitude",
      accessorKey: "bujur",
      cell: (info: { getValue: () => number }) => info.getValue(),
    },
  ];

  // Filter columns based on visibility
  const visibleColumnsArray = columns.filter(column => visibleColumns[column.accessorKey]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainLayout>
        <h1 className="bg-gray-100 rounded-2xl text-left text-3xl font-bold my-2 ">
          Station Metadata
        </h1>

        {/* Combined Filter and Map Container */}
        <div className="flex bg-white p-2 rounded-xl shadow">
          {/* Filter Panel - Left Side */}
          <div className="w-80 p-4 flex-shrink-0 border-r border-gray-200">
            <h3 className="text-lg font-bold mb-4">Advanced Filter</h3>
            <div className="space-y-3">
              {/* Search Kode Stasiun */}
              <div className="flex flex-col">
                <label htmlFor="search-kode" className="font-semibold text-sm mb-1">
                  Station Code:
                </label>
                <input
                  id="search-kode"
                  type="text"
                  className="border rounded px-2 py-1 text-sm"
                  placeholder="Input station code..."
                  value={searchKode}
                  onChange={(e) => setSearchKode(e.target.value)}
                />
              </div>

              {/* Provinsi Filter */}
              <div className="flex flex-col">
                <label htmlFor="filter-provinsi" className="font-semibold text-sm mb-1">
                  Province:
                </label>
                <select
                  id="filter-provinsi"
                  className="border rounded px-2 py-1 text-sm"
                  value={filterProvinsi}
                  onChange={(e) => setFilterProvinsi(e.target.value)}
                >
                  <option value="">All</option>
                  {availableOptions.provinsi.map((provinsi: string) => (
                    <option key={provinsi} value={provinsi}>
                      {provinsi}
                    </option>
                  ))}
                </select>
              </div>

              {/* UPT Filter */}
              <div className="flex flex-col">
                <label htmlFor="filter-upt" className="font-semibold text-sm mb-1">
                  UPT:
                </label>
                <select
                  id="filter-upt"
                  className="border rounded px-2 py-1 text-sm"
                  value={filterUpt}
                  onChange={(e) => setFilterUpt(e.target.value)}
                >
                  <option value="">All</option>
                  {availableOptions.upt.map((upt: string) => (
                    <option key={upt} value={upt}>
                      {upt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tahun Instalasi Filter */}
              <div className="flex flex-col">
                <label htmlFor="filter-tahun" className="font-semibold text-sm mb-1">
                  Installation Year:
                </label>
                <select
                  id="filter-tahun"
                  className="border rounded px-2 py-1 text-sm"
                  value={filterTahun}
                  onChange={(e) => setFilterTahun(e.target.value)}
                >
                  <option value="">All</option>
                  {availableOptions.tahun.map((tahun: number) => (
                    <option key={tahun} value={tahun}>
                      {tahun}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prioritas Filter */}
              <div className="flex flex-col">
                <label htmlFor="filter-priority" className="font-semibold text-sm mb-1">
                  Priority:
                </label>
                <select
                  id="filter-priority"
                  className="border rounded px-2 py-1 text-sm"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="">All</option>
                  {availableOptions.prioritas.map((prioritas: string) => (
                    <option key={prioritas} value={prioritas}>
                      {prioritas}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex flex-col">
                <label htmlFor="filter-status" className="font-semibold text-sm mb-1">
                  Status:
                </label>
                <select
                  id="filter-status"
                  className="border rounded px-2 py-1 text-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All</option>
                  {availableOptions.status.map((status: string) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  className="flex-1 px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm font-semibold"
                  onClick={handleResetFilter}
                >
                  Reset Filter
                </button>
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
      </MainLayout>
    </div>
  );
};

export default StationMap;
