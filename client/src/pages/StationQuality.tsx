import { useEffect, useState, useMemo } from "react";
import MainLayout from "../layouts/MainLayout.tsx";
import DataTable from "../components/DataTable.tsx";
import TableFilters from "../components/TableFilters";
import type { FilterConfig } from "../components/TableFilters";
import type { ColumnDef } from "@tanstack/react-table";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
// import marker2x from "leaflet/dist/images/marker-icon-2x.png";
// import marker from "leaflet/dist/images/marker-icon.png";
// import markerShadow from "leaflet/dist/images/marker-shadow.png";
import CardContainer from "../components/Card.tsx";
import { useNavigate } from "react-router-dom";
import axiosServer from "../utilities/AxiosServer.tsx";
import StatusBadge from "../components/StatusBadge";
import dayjs from "dayjs";

// Interface data QC Summary
interface QCSummary {
  code: string;
  quality_percentage: number | null;
  result: string;
}

// [PENAMBAHAN] Interface baru untuk data yang sudah digabungkan
// Penamaan yang lebih jelas: data stasiun yang sudah lengkap dengan summary.
export interface StasiunDenganSummary extends StationMetadata {
  quality_percentage: number | null;
  // 'result' sudah ada di StationMetadata, tidak perlu ditambahkan lagi
}

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
  result: string | null;
}

// delete (L.Icon.Default.prototype as any)._getIconUrl;

// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: marker2x,
//   iconUrl: marker,
//   shadowUrl: markerShadow,
// });

// Ganti fungsi triangleIcon agar sama dengan Dashboard (dengan lineart tebal)
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

const getColorByQuality = (quality: number | null): string => {
  if (quality === null) return "#6b7280"; // no data
  if (quality >= 80) return "#14532d"; // very good (Hijau Tua)
  if (quality >= 60) return "#22c55e"; // good (Hijau Terang)
  if (quality >= 40) return "#f97316"; // fair (Oranye)
  if (quality >= 20) return "#ef4444"; // poor (Merah)
  return "#6b7280"; // default
};

// Tambahkan fungsi pewarnaan berdasarkan result (seperti Dashboard)
const getColorByResult = (result: string | null): string => {
  switch (result) {
    case "Baik": return "#14b8a6";      // Good - teal
    case "Cukup Baik": return "#fb923c"; // Fair - orange
    case "Buruk": return "#ef4444";      // Bad - red
    case "No Data": return "#818cf8";    // No Data - indigo
    case "Mati": return "#374151";       // Mati - gray
    default: return "#979797";
  }
};

const MapLegend = () => {
  // Warna legend disesuaikan dengan warna segitiga pada map (berdasarkan result)
  const legendItems = [
    { color: "#14b8a6", label: "Baik" },        // Baik (Good)
    { color: "#fb923c", label: "Cukup Baik" },  // Cukup Baik (Fair)
    { color: "#ef4444", label: "Buruk" },       // Buruk (Bad)
    { color: "#818cf8", label: "No Data" },     // No Data
    { color: "#374151", label: "Mati" },        // Mati
  ];

  return (
    <div className="absolute bottom-5 left-5 z-[1000] bg-white/70 backdrop-blur-sm p-3 rounded-lg shadow-lg">
      <h3 className="font-bold mb-2 text-sm">Keterangan</h3>
      <ul>
        {legendItems.map((item) => (
          <li key={item.label} className="flex items-center mb-1 text-xs">
            <span
              className="w-3 h-3 inline-block mr-2"
              style={{
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderBottom: `12px solid ${item.color}`,
              }}
            ></span>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

const getStatusText = (result: string | null, quality: number | null): string => {
  if (result === 'Mati') return 'Mati';
  if (quality === null) return 'No Data';
  if (quality >= 80) return 'Sangat Baik';
  if (quality >= 60) return 'Baik';
  if (quality >= 40) return 'Cukup';
  return 'Buruk';
};

const StationQuality = () => {
  const [stationData, setStationData] = useState<StationMetadata[]>([]);
  const [qcSummaryData, setQcSummaryData] = useState<QCSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [filterConfig, setFilterConfig] = useState<Record<string, FilterConfig>>({});
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const navigate = useNavigate();

  const fetchStationMetadata = async () => {
    try {
      setLoading(true);
      const response = await axiosServer.get("/api/stasiun"); 
      setStationData(response.data);
    } catch (error) {
      console.error("Error fetching station data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQCSummary = async () => {
    try {
      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
      const response = await axiosServer.get(`/api/qc/summary/${yesterday}`);
      setQcSummaryData(response.data);
    } catch (error) {
      console.error("Error fetching QC summary data:", error);
    }
  };

  useEffect(() => {
    const savedFilters = localStorage.getItem('stationQualityFilters');
    if (savedFilters) {
      setFilters(JSON.parse(savedFilters));
    }

    fetchStationMetadata();
    fetchQCSummary(); // [PENAMBAHAN] Memanggil fungsi untuk mengambil data summary
  }, []);

  useEffect(() => {
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
  }, [stationData, filters]);

  // [PENAMBAHAN] useMemo untuk menggabungkan data stasiun dengan data summary
  const dataStasiunLengkap = useMemo<StasiunDenganSummary[]>(() => {
    if (stationData.length === 0) {
      return [];
    }
    const summaryMap = new Map(qcSummaryData.map(item => [item.code, item]));
    return stationData.map(station => {
      const summary = summaryMap.get(station.kode_stasiun);
      return {
        ...station,
        quality_percentage: summary ? summary.quality_percentage : null,
        result: summary ? summary.result : station.result,
      };
    });
  }, [stationData, qcSummaryData]);

  // [UBAH] DataTable dan Map akan sinkron dengan hasil pencarian (globalFilter)
  // Filter dataStasiunLengkap dengan globalFilter (search)
  const filteredData = useMemo(() => {
    const activeFilterKeys = Object.keys(filters).filter(key =>
      filters[key] && filters[key].length > 0
    );
    let dataSource = dataStasiunLengkap;

    // Apply TableFilters
    if (activeFilterKeys.length > 0) {
      dataSource = dataSource.filter(station => {
        return activeFilterKeys.every(key => {
          const filterValues = filters[key];
          const stationValue = station[key as keyof StationMetadata];
          return filterValues.includes(stationValue);
        });
      });
    }

    // Apply global search (search seluruh kolom string)
    if (globalFilter && globalFilter.trim() !== "") {
      const search = globalFilter.toLowerCase();
      dataSource = dataSource.filter(station =>
        Object.values(station)
          .join(" ")
          .toLowerCase()
          .includes(search)
      );
    }

    return dataSource;
  }, [dataStasiunLengkap, filters, globalFilter]);

  const stationPositions = useMemo(() => {
    return filteredData
      .filter((s) => s.lintang && s.bujur)
      .map((s) => ({
        name: s.kode_stasiun ?? "Unknown",
        coords: [s.lintang, s.bujur] as [number, number],
        data: s,
      }));
  }, [filteredData]);

  const handleDownloadCSV = () => {
    // [PENAMBAHAN] Menambahkan kolom summary ke data unduhan CSV
    const dataToDownload = filteredData.map(item => {
      const statusText = getStatusText(item.result, item.quality_percentage);
      return {
        ...item,
        summary_kualitas: statusText,
        persentase_kualitas: item.quality_percentage !== null ? `${item.quality_percentage.toFixed(1)}%` : 'N/A',
      };
    });

    if (dataToDownload.length === 0) {
      console.log("Tidak ada data untuk diunduh.");
      return;
    }

    const headers = Object.keys(dataToDownload[0]).join(",");
    const csvContent =
      headers +
      "\n" +
      dataToDownload
        .map((row: any) =>
          Object.values(row)
            .map((val) => (typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val))
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

  // Menggunakan interface StasiunDenganSummary dan memperbarui kolom Summary
  const columns: ColumnDef<StasiunDenganSummary>[] = [
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
    {
      id: "summary",
      header: "Summary Kualitas",
      cell: ({ row }) => {
        const { result, quality_percentage } = row.original;
        
        if (quality_percentage === undefined || quality_percentage === null) {
          return <span className="text-gray-500">-</span>;
        }

        const statusText = getStatusText(result, quality_percentage);
        
        return (
          <div className="flex flex-col justify-center">
            <StatusBadge value={statusText} />
            {/* <span className="text-xs text-gray-600 mt-1"> */}
              {/* {quality_percentage.toFixed(1)}% */}
            {/* </span> */}
          </div>
        );
      },
    },
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
        <CardContainer className="mb-6 relative">
          <div className="w-full h-[500px] z-0">
            <MapContainer
              center={[-2.5, 118]}
              zoom={5}
              className="w-full h-full rounded-lg"
            >
              <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {stationPositions.map((station, idx) => {
                const { result, kode_stasiun, quality_percentage } = station.data;
                return (
                  <Marker 
                    key={idx} 
                    position={station.coords}
                    icon={triangleIcon(getColorByResult(result))}
                  >
                    <Popup>
                      <b>Stasiun: {kode_stasiun}</b><br />
                      Status: {result}<br />
                      {quality_percentage !== null && `Kualitas: ${quality_percentage.toFixed(1)}%`}
                    </Popup>
                  </Marker>
                );
              })}
              <MapLegend />
            </MapContainer>
          </div>
        </CardContainer>
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
              Export CSV
            </button>
          </div>

          {loading && <p>Loading station data...</p>}
          {/* [UBAH] DataTable menerima globalFilter dan setGlobalFilter */}
          {!loading && (
            <DataTable
              columns={columns}
              data={filteredData}
              globalFilter={globalFilter}
              setGlobalFilter={setGlobalFilter}
            />
          )}
        </CardContainer>
      </MainLayout>
    </div>
  );
};

export default StationQuality;