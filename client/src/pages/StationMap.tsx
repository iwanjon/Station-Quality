import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import axiosServer from "../utilities/AxiosServer";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import DataTable from "../components/DataTable";

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

const StationMap = () => {
  const [data, setData] = useState<Stasiun[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterJaringan, setFilterJaringan] = useState<string>("");
  const [filterProvinsi, setFilterProvinsi] = useState<string>("");
  const [filterUpt, setFilterUpt] = useState<string>("");
  const [filterTahun, setFilterTahun] = useState<string>("");
  const [searchKode, setSearchKode] = useState<string>("");

  // Reset filter handler
  const handleResetFilter = () => {
    setFilterJaringan("");
    setFilterProvinsi("");
    setFilterUpt("");
    setFilterTahun("");
    setSearchKode("");
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

  // Filter data berdasarkan semua filter
  const filteredData = data && Array.isArray(data) ? data.filter((station) => {
    return (
      (filterJaringan === "" || String(station.jaringan) === filterJaringan) &&
      (filterProvinsi === "" || String(station.provinsi) === filterProvinsi) &&
      (filterUpt === "" || String(station.upt_penanggung_jawab) === filterUpt) &&
      (filterTahun === "" || String(station.tahun_instalasi) === filterTahun) &&
      (searchKode === "" || station.kode_stasiun.toLowerCase().includes(searchKode.toLowerCase()))
    );
  }) : [];

  // Fungsi untuk mendapatkan opsi dropdown yang tersedia berdasarkan filter yang sudah dipilih
  const getAvailableOptions = () => {
    // Data yang sudah difilter sebagian (tanpa field yang sedang diupdate)
    const getFilteredDataExcept = (excludeField: string) => {
      return data && Array.isArray(data) ? data.filter((station) => {
        return (
          (excludeField === 'jaringan' || filterJaringan === "" || String(station.jaringan) === filterJaringan) &&
          (excludeField === 'provinsi' || filterProvinsi === "" || String(station.provinsi) === filterProvinsi) &&
          (excludeField === 'upt' || filterUpt === "" || String(station.upt_penanggung_jawab) === filterUpt) &&
          (excludeField === 'tahun' || filterTahun === "" || String(station.tahun_instalasi) === filterTahun) &&
          (excludeField === 'search' || searchKode === "" || station.kode_stasiun.toLowerCase().includes(searchKode.toLowerCase()))
        );
      }) : [];
    };

    return {
      jaringan: Array.from(new Set(getFilteredDataExcept('jaringan').map(s => s.jaringan))).filter(v => v !== null && v !== undefined).sort(),
      provinsi: Array.from(new Set(getFilteredDataExcept('provinsi').map(s => s.provinsi))).filter(v => v !== null && v !== undefined).sort(),
      upt: Array.from(new Set(getFilteredDataExcept('upt').map(s => s.upt_penanggung_jawab))).filter(v => v !== null && v !== undefined).sort(),
      tahun: Array.from(new Set(getFilteredDataExcept('tahun').map(s => s.tahun_instalasi))).filter(v => v !== null && v !== undefined).sort()
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
      header: "Kode Stasiun",
      accessorKey: "kode_stasiun",
      cell: (info: { getValue: () => string }) => info.getValue(),
    },
    {
      header: "Lokasi",
      accessorKey: "lokasi",
      cell: (info: { getValue: () => string }) => info.getValue(),
    },
    {
      header: "Provinsi",
      accessorKey: "provinsi",
      cell: (info: { getValue: () => string }) => info.getValue(),
    },
    {
      header: "UPT",
      accessorKey: "upt_penanggung_jawab",
      cell: (info: { getValue: () => string }) => info.getValue(),
    },
    {
      header: "Jaringan",
      accessorKey: "jaringan",
      cell: (info: { getValue: () => string }) => info.getValue(),
    },
    {
      header: "Tahun Instalasi",
      accessorKey: "tahun_instalasi",
      cell: (info: { getValue: () => number }) => info.getValue(),
    },
    {
      header: "Lintang",
      accessorKey: "lintang",
      cell: (info: { getValue: () => number }) => info.getValue(),
    },
    {
      header: "Bujur",
      accessorKey: "bujur",
      cell: (info: { getValue: () => number }) => info.getValue(),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainLayout>
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <h1 className="bg-gray-100 rounded-2xl text-center text-3xl font-bold my-2 mx-48">
            Stasiun Map
          </h1>
          {/* Filter Dropdown */}
          <div className="flex items-center justify-center gap-4 p-4">
            <label htmlFor="search-kode" className="font-semibold">
              Cari Kode Stasiun:
            </label>
            <input
              id="search-kode"
              type="text"
              className="border rounded px-2 py-1"
              placeholder="Masukkan kode stasiun"
              value={searchKode}
              onChange={(e) => setSearchKode(e.target.value)}
            />

            <label htmlFor="filter-jaringan" className="font-semibold">
              Jaringan:
            </label>
            <select
              id="filter-jaringan"
              className="border rounded px-2 py-1 w-32"
              value={filterJaringan}
              onChange={(e) => setFilterJaringan(e.target.value)}
            >
              <option value="">Semua</option>
              {availableOptions.jaringan.map((jaringan: string) => (
                <option key={jaringan} value={jaringan}>
                  {jaringan}
                </option>
              ))}
            </select>

            <label htmlFor="filter-provinsi" className="font-semibold">
              Provinsi:
            </label>
            <select
              id="filter-provinsi"
              className="border rounded px-2 py-1 w-40"
              value={filterProvinsi}
              onChange={(e) => setFilterProvinsi(e.target.value)}
            >
              <option value="">Semua</option>
              {availableOptions.provinsi.map((provinsi: string) => (
                <option key={provinsi} value={provinsi}>
                  {provinsi}
                </option>
              ))}
            </select>

            <label htmlFor="filter-upt" className="font-semibold">
              UPT:
            </label>
            <select
              id="filter-upt"
              className="border rounded px-2 py-1 w-40"
              value={filterUpt}
              onChange={(e) => setFilterUpt(e.target.value)}
            >
              <option value="">Semua</option>
              {availableOptions.upt.map((upt: string) => (
                <option key={upt} value={upt}>
                  {upt}
                </option>
              ))}
            </select>

            <label htmlFor="filter-tahun" className="font-semibold">
              Tahun Instalasi:
            </label>
            <select
              id="filter-tahun"
              className="border rounded px-2 py-1 w-28"
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
            >
              <option value="">Semua</option>
              {availableOptions.tahun.map((tahun: number) => (
                <option key={tahun} value={tahun}>
                  {tahun}
                </option>
              ))}
            </select>

            {/* Reset Filter Button */}
            <button
              type="button"
              className="ml-2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm font-semibold"
              onClick={handleResetFilter}
            >
              Reset Filter
            </button>
          </div>
        </div>

        <div className="w-full h-[70vh] rounded-xl overflow-hidden">
          <MapContainer center={center} zoom={5} style={{ height: "100%", width: "100%" }}>
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
                  >
                    <Popup>
                      <div>
                        <strong>{station.kode_stasiun}</strong>
                        <br />
                        Lokasi: {station.lokasi}
                        <br />
                        UPT: {station.upt_penanggung_jawab}
                      </div>
                    </Popup>
                  </Marker>
                ) : null
              )}
          </MapContainer>
        </div>

        {/* Data Table Stasiun */}
        <div className="bg-white p-4 rounded-xl shadow mt-8">
          <h2 className="text-xl font-bold mb-4">Data Stasiun</h2>
          <DataTable columns={columns} data={filteredData} />
        </div>
      </MainLayout>
    </div>
  );
};

export default StationMap;
