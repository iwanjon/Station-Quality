import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import axiosServer from "../utilities/AxiosServer";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
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

const stationIcon = new L.Icon({
  iconUrl: '/broadcast-tower.png',
  iconSize: [10, 10],
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

  // Ambil nilai unik untuk dropdown filter
  const jaringanOptions = data && Array.isArray(data) ? Array.from(
    new Set(data.map((station) => station.jaringan))
  ).filter((v) => v !== null && v !== undefined) : [];

  const provinsiOptions = data && Array.isArray(data) ? Array.from(
    new Set(data.map((station) => station.provinsi))
  ).filter((v) => v !== null && v !== undefined) : [];

  const uptOptions = data && Array.isArray(data) ? Array.from(
    new Set(data.map((station) => station.upt_penanggung_jawab))
  ).filter((v) => v !== null && v !== undefined) : [];

  const tahunOptions = data && Array.isArray(data) ? Array.from(
    new Set(data.map((station) => station.tahun_instalasi))
  ).filter((v) => v !== null && v !== undefined) : [];

  

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
              {jaringanOptions.map((jaringan) => (
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
              {provinsiOptions.map((provinsi) => (
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
              {uptOptions.map((upt) => (
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
              {tahunOptions.map((tahun) => (
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
                    icon={stationIcon}
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
