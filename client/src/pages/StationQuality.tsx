import { useEffect, useState, useMemo } from "react";
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
// import axiosInstance from "../utilities/Axios";
import axiosServer from "../utilities/AxiosServer.tsx";

export interface StationMetadata {
  stasiun_id: number;
  net: string;
  id: number;
  kode_stasiun: string;
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
  keterangan: string | null;
  accelerometer: string;
  digitizer_komunikasi: string;
  tipe_shelter: string | null;
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
  const [filterConfig, setFilterConfig] = useState<Record<string, FilterConfig>>({});

  const stationPositions = stationData
    .filter((s) => s.lintang && s.bujur)
    .map((s) => ({
      name: s.kode_stasiun ?? "Unknown",
      coords: [s.lintang, s.bujur] as [number, number],
    }));


const fetchStationMetadata = async () => {
  try {
    setLoading(true);
    const response = await axiosServer.get("/api/stasiun"); 
    console.log("Station API Response:", response.data);  // 👈 cek hasilnya
    setStationData(response.data);
  } catch (error) {
    console.error("Error fetching station data:", error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (stationData.length > 0) {
      const getUniqueOptions = (key: keyof StationMetadata): string[] => {
        const allValues = stationData.map(item => item[key]);
        return [...new Set(allValues)].filter(Boolean).sort() as string[];
      };

      const dynamicFilterConfig: Record<string, FilterConfig> = {
        prioritas: {
          label: "Prioritas",
          type: "multi",
          options: getUniqueOptions("prioritas"),
        },
        upt_penanggung_jawab: {
          label: "UPT",
          type: "multi",
          options: getUniqueOptions("upt_penanggung_jawab"),
        },
        jaringan: {
          label: "Jaringan",
          type: "multi",
          options: getUniqueOptions("jaringan"),
        },
        provinsi: {
          label: "Provinsi",
          type: "multi",
          options: getUniqueOptions("provinsi"),
        },
      };
      
      setFilterConfig(dynamicFilterConfig);
    }
  }, [stationData]); // Dijalankan setiap kali stationData berubah

  const filteredData = useMemo(() => {
    // Jika tidak ada filter yang aktif, kembalikan semua data
    const activeFilterKeys = Object.keys(filters).filter(key =>
      filters[key] && filters[key].length > 0
    );

    if (activeFilterKeys.length === 0) {
      return stationData;
    }

    // Lakukan proses filter
    return stationData.filter(station => {
      // 'every' berarti stasiun harus memenuhi SEMUA kriteria filter yang aktif
      return activeFilterKeys.every(key => {
        const filterValues = filters[key]; // Array, contoh: ['P1', 'P2']
        const stationValue = station[key as keyof StationMetadata]; 
        

        return filterValues.includes(stationValue);
      });
    });
  }, [stationData, filters]); 

  useEffect(() => {
    fetchStationMetadata();
  }, []);

  const columns: ColumnDef<StationMetadata>[] = [
    { accessorKey: "stasiun_id", header: "No" },
    { accessorKey: "kode_stasiun", header: "Kode Stasiun" },
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
          onClick={() => navigate(`/station/${row.original.kode_stasiun}`)}  // konsisten dengan Router.tsx
          className="bg-black text-white rounded-lg px-3 py-1 hover:bg-gray-800"
        >
          <span className="text-sm">Lihat Detail</span>
        </button>
        );
      },
    },
  ];
  
  return (
    <div className="min-h-screen flex flex-col">
      <MainLayout className="flex-1 p-8 ml-16">
        <h1 className="bg-gray-100 rounded-2xl text-center text-3xl font-bold my-4 mx-48 py-2">
          Stasiun Quality
        </h1>

        {/* Map */}
        <CardContainer className="mb-6">
          <div className="w-full h-120 z-0">
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
          {/* {!loading && <DataTable columns={columns} data={stationData} />} */}
        {!loading && <DataTable columns={columns} data={filteredData} />} 
        </CardContainer>
      </MainLayout>
    </div>
  );
};

export default StationQuality;
