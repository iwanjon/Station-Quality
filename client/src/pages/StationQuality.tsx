import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout.tsx";
import DataTable from "../components/DataTable.tsx";
import TableFilters from "../components/TableFilters";
import type { FilterConfig } from "../components/TableFilters";
import type { ColumnDef } from "@tanstack/react-table";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import CardContainer from "../components/Card.tsx"; 
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface StationMetadata {
  id_stasiun: number;
  net: string;
  id: number;
  kode: string;
  lintang: number;
  bujur: number;
  elevasi: number;
  lokasi: string;
  provinsi: string;
  upt_penanggung_jawab: string;
  status: string;
  tahun_instalasi_site: number;
  jaringan: string;
  prioritas: string;
  keterangan: string;
  accelerometer: string;
  digitizer_komunikasi: string;
  tipe_shelter: string;
  lokasi_shelter: string;
  penjaga_shelter: string;
}

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker,
  shadowUrl: markerShadow,
});

const StationQuality = () => {
  const [stationData, setStationData] = useState<StationMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const stationPositions = stationData
    .filter((s) => s.lintang && s.bujur)
    .map((s) => ({
      name: s.kode ?? "Unknown",
      coords: [s.lintang, s.bujur] as [number, number]
    }));

  const fetchStationMetadata = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/stasiun`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data: StationMetadata[] = await response.json();
      setStationData(data);
    } catch (error) {
      console.error("Error fetching station data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStationMetadata();
  }, []);

  const columns: ColumnDef<StationMetadata>[] = [
    { accessorKey: "id_stasiun", header: "No" },
    { accessorKey: "kode", header: "Kode Stasiun" },
    { accessorKey: "lokasi", header: "Lokasi" },
    { accessorKey: "jaringan", header: "Jaringan" },
    { accessorKey: "status", header: "Status" },
    { accessorKey: "prioritas", header: "Prioritas" },
    { accessorKey: "upt_penanggung_jawab", header: "UPT" },
    { accessorKey: "Summary", header: "Summary" },
    {
      id: "detail",
      header: "Detail Stasiun",
      cell: ({ row }) => {
        const navigate = useNavigate();
        return (
          <button
            onClick={() => navigate(`/stasiun/${row.original.id_stasiun}`)}
            className="bg-black text-white rounded-lg px-3 py-1 hover:bg-gray-800"
          >
            <span className="text-sm">Lihat Detail</span>
          </button>
        );
      },
    }
  ];

  const filterConfig: Record<string, FilterConfig> = {
    prioritas: { label: "Prioritas", type: "multi", options: ["P1", "P2", "P3"] },
    upt_penanggung_jawab: { label: "UPT", type: "multi", options: ["UPT A", "UPT B", "UPT C"] },
    jaringan: { label: "Jaringan", type: "multi", options: ["ALOPTAMA 2023", "LAINNYA"] },
    provinsi: { label: "Provinsi", type: "multi", options: ["Aceh", "Sumut", "Sumbar"] },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <MainLayout className="flex-1 p-8 ml-16">
        <h1 className="bg-gray-100 rounded-2xl text-center text-3xl font-bold my-4 mx-48 py-2">
          Stasiun Quality
        </h1>

        {/* Map */}
        <CardContainer className="mb-6">
          <div className="w-full h-96 z-0">
            <MapContainer
              center={[-2.5, 118]}
              zoom={5}
              className="w-full h-full rounded-lg"
            >
              <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {stationPositions.map((station, idx) => (
                <Marker key={idx} position={station.coords}>
                  <Popup>{station.name}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContainer>

        {/* Table */}
        <CardContainer>
          <div className="mb-6">
            <TableFilters
              filters={filters}
              setFilters={setFilters}
              filterConfig={filterConfig}
            />
          </div>

          {loading && <p>Loading station data...</p>}
          {!loading && <DataTable columns={columns} data={stationData} />}
        </CardContainer>
      </MainLayout>
    </div>
  );
};

export default StationQuality;
