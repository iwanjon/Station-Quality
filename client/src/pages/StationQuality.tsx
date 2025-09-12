import { useEffect, useState, useMemo } from "react";
import MainLayout from "../layouts/MainLayout.tsx";
import DataTable from "../components/DataTable.tsx";
import TableFilters from "../components/TableFilters";
import type { FilterConfig } from "../components/TableFilters";
import type { ColumnDef } from "@tanstack/react-table";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
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
  const navigate = useNavigate();

const fetchStationMetadata = async () => {
  try {
    setLoading(true);
    const response = await axiosServer.get("/api/stasiun"); 
    console.log("Station API Response:", response.data); 
    setStationData(response.data);
  } catch (error) {
    console.error("Error fetching station data:", error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    // Load filters from localStorage on component mount
    const savedFilters = localStorage.getItem('stationQualityFilters');
    if (savedFilters) {
      setFilters(JSON.parse(savedFilters));
    }

    fetchStationMetadata();
  }, []);

  useEffect(() => {
    // Save filters to localStorage whenever filters state changes
    localStorage.setItem('stationQualityFilters', JSON.stringify(filters));

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
  }, [stationData, filters]); // Dijalankan setiap kali stationData atau filters berubah

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

  // PENTING: Pindahkan logika stationPositions ke sini, agar bergantung pada filteredData
  const stationPositions = useMemo(() => {
    return filteredData
      .filter((s) => s.lintang && s.bujur)
      .map((s) => ({
        name: s.kode_stasiun ?? "Unknown",
        coords: [s.lintang, s.bujur] as [number, number],
        // Menambahkan properti lain dari data stasiun yang relevan
        data: s,
      }));
  }, [filteredData]);

  const handleDownloadCSV = () => {
    const dataToDownload = filteredData;
    if (dataToDownload.length === 0) {
      console.log("Tidak ada data untuk diunduh.");
      return;
    }

    const headers = Object.keys(dataToDownload[0]).join(",");
    const csvContent =
      headers +
      "\n" +
      dataToDownload
        .map((row) =>
          Object.values(row)
            .map((val) => (typeof val === "string" ? `"${val}"` : val))
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "station_quality.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const columns: ColumnDef<StationMetadata>[] = [
    { accessorKey: "stasiun_id", header: "No" },
    { accessorKey: "kode_stasiun", header: "Kode Stasiun" },
    { accessorKey: "lokasi", header: "Lokasi" },
    { accessorKey: "jaringan", header: "Jaringan" },
    { 
      accessorKey: "status", 
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const colorClass = status === "Aktif" ? "text-red-600" : "text-green-600";
        return <span className={`font-semibold ${colorClass}`}>{status}</span>;
      },
    },
    { accessorKey: "prioritas", header: "Prioritas" },
    { accessorKey: "upt_penanggung_jawab", header: "UPT" },
    { accessorKey: "Summary", header: "Summary" },
    {
      id: "detail",
      header: "Detail Stasiun",
      cell: ({ row }) => {
        return (
        <button
          onClick={() => navigate(`/station/${row.original.kode_stasiun}`)}
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
                <Marker 
                  key={idx} 
                  position={station.coords}
                >
                  <Tooltip permanent={false} direction="top" opacity={1} offset={L.point(0, -10)}>
                    {station.data.kode_stasiun}
                  </Tooltip>
                  <Popup closeOnClick={false}>
                    <div className="p-2">
                      <h3 className="font-bold text-lg mb-1">{station.data.kode_stasiun}</h3>
                      <p><strong>Lokasi:</strong> {station.data.lokasi}</p>
                      <p><strong>Status:</strong> {station.data.status}</p>
                      <p><strong>Digitizer Komunikasi:</strong> {station.data.digitizer_komunikasi}</p>
                      <button
                        onClick={() => navigate(`/station/${station.data.kode_stasiun}`)}
                        className="mt-3 bg-black text-white rounded-lg px-3 py-1 text-xs hover:bg-gray-800 transition duration-300"
                      >
                        Lihat Detail Stasiun
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContainer>

        {/* Table */}
        <CardContainer>
          <div className="flex justify-between items-center mb-6">
            <TableFilters
              filters={filters}
              setFilters={setFilters}
              filterConfig={filterConfig}
            />
            <button
              onClick={handleDownloadCSV}
              className="bg-black text-white rounded-lg px-4 py-2 hover:bg-gray-800 transition duration-300"
            >
              Unduh CSV
            </button>
          </div>

          {loading && <p>Loading station data...</p>}
          {!loading && <DataTable columns={columns} data={filteredData} />} 
        </CardContainer>
      </MainLayout>
    </div>
  );
};

export default StationQuality;
