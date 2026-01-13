import { useEffect, useState, useMemo } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import MainLayout from "../layouts/MainLayout.tsx";
import DataTable from "../components/DataTable.tsx";
import TableFilters from "../components/TableFilters";
import type { FilterConfig } from "../components/TableFilters";
import type { ColumnDef } from "@tanstack/react-table";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import CardContainer from "../components/Card.tsx";
import { useNavigate, Link } from "react-router-dom";
import axiosServer from "../utilities/AxiosServer.tsx";
import StatusBadge from "../components/StatusBadge";
import dayjs from "dayjs";


ChartJS.register(ArcElement, Tooltip, Legend);

const STATUS_CONFIG: { [key: string]: { label: string; color: string; textColor: string } } = {
  "Baik": { label: "Baik", color: "#14b8a6", textColor: "text-white" },
  "Cukup Baik": { label: "Cukup Baik", color: "#fb923c", textColor: "text-white" },
  "Buruk": { label: "Buruk", color: "#ef4444", textColor: "text-white" },
  "Mati": { label: "Mati", color: "#374151", textColor: "text-white" },
  "No Data": { label: "No Data", color: "#374151", textColor: "text-white" },
  "default": { label: "N/A", color: "#9ca3af", textColor: "text-white" },
};

// Interface data QC Summary
interface QCSummary {
  code: string;
  quality_percentage: number | null;
  result: string;
}

export interface StasiunDenganSummary extends StationMetadata {
  quality_percentage: number | null;
}

export interface StasiunDenganSummaryextends extends StasiunDenganSummary {
  quality_percentage: number | null;
    site_quality: string | null;
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

// Fungsi ikon segitiga 
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

// [DIUBAH] Fungsi pewarnaan sekarang menggunakan STATUS_CONFIG
const getColorByResult = (result: string | null): string => {
  return STATUS_CONFIG[result || "default"]?.color || STATUS_CONFIG.default.color;
};

const MapLegend = () => {
  const legendItems = [
    { label: "Good", color: STATUS_CONFIG["Baik"].color },
    { label: "Fair", color: STATUS_CONFIG["Cukup Baik"].color },
    { label: "Poor", color: STATUS_CONFIG["Buruk"].color },
    { label: "No Data", color: STATUS_CONFIG["Mati"].color }, // Gabungkan
  ];

  return (
    <div className="absolute bottom-5 left-5 z-[1000] bg-white/70 p-3 rounded-lg shadow-lg">
      <h3 className="font-bold mb-2 text-sm">Keterangan</h3>
      <ul>
        {legendItems.map((item) => (
          <li key={item.label} className="flex items-center mb-1 text-xs">
            <span
              className="w-3 h-3 inline-block mr-2"
              style={{
                width: 0, height: 0,
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

// Komponen untuk Grafik Donat
const QualityDonutChart = ({ data }: { data: StasiunDenganSummary[] }) => {
  const chartData = useMemo(() => {
    const categories: { [key: string]: { count: number; color: string } } = {
      "GOOD": { count: 0, color: STATUS_CONFIG["Baik"].color },
      "FAIR": { count: 0, color: STATUS_CONFIG["Cukup Baik"].color },
      "POOR": { count: 0, color: STATUS_CONFIG["Buruk"].color },
      "NO DATA": { count: 0, color: STATUS_CONFIG["No Data"].color },
    };

    // Debug/insight: hitung semua nilai result mentah untuk verifikasi
    const rawCounts: Record<string, number> = {};
    let ignoredNonMapped = 0;

    data.forEach(station => {
      const r = station.result ?? "null";
      rawCounts[r] = (rawCounts[r] || 0) + 1;

      if (r === "Baik") categories["GOOD"].count++;
      else if (r === "Cukup Baik") categories["FAIR"].count++;
      else if (r === "Buruk") categories["POOR"].count++;
      else if (r === "Mati") categories["NO DATA"].count++; 
      else ignoredNonMapped++; 
    });

    // Tampilkan ringkasan singkat di console untuk debugging (bisa dihapus nanti)
    console.debug("QualityDonutChart - raw result breakdown:", rawCounts, "ignoredNonMapped:", ignoredNonMapped);

    return Object.entries(categories).map(([label, { count, color }]) => ({
      label: `${label} (${count})`,
      count,
      color,
    }));
  }, [data]);

  const dataForChart = {
    labels: chartData.map(d => d.label),
    datasets: [
      {
        label: 'Jumlah Stasiun',
        data: chartData.map(d => d.count),
        backgroundColor: chartData.map(d => d.color),
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };


  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 15,
          padding: 15,
        },
      },
    },
  };

  return <Doughnut data={dataForChart} options={options} />;
};


const StationQuality = () => {
  const [stationData, setStationData] = useState<StationMetadata[]>([]);
  const [qcSummaryData, setQcSummaryData] = useState<QCSummary[]>([]);
  const [siteQualityMap, setSiteQualityMap] = useState<Record<string, string>>({});
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
      console.log(yesterday)
      console.log("dfdfdf")
      const response = await axiosServer.get(`/api/qc/summary/${yesterday}`);
      setQcSummaryData(response.data);
    } catch (error) {
      console.error("Error fetching QC summary data:", error);
    }
  };

  // Ambil site_quality untuk semua stasiun
  const fetchAllSiteQuality = async (stationCodes: string[]) => {
    const map: Record<string, string> = {};
    await Promise.all(
      stationCodes.map(async (code) => {
        try {
          const res = await axiosServer.get(`/api/qc/site/detail/${code}`);
          if (res.data && res.data[0] && res.data[0].site_quality) {
            map[code] = res.data[0].site_quality;
          }
        } catch {
          map[code] = "-";
        }
      })
    );
    setSiteQualityMap(map);
  };

  useEffect(() => {
    const savedFilters = localStorage.getItem('stationQualityFilters');
    if (savedFilters) {
      setFilters(JSON.parse(savedFilters));
    }
    fetchStationMetadata();
    fetchQCSummary();
  }, []);

  useEffect(() => {
    if (stationData.length > 0) {
      const codes = stationData.map(s => s.kode_stasiun);
      fetchAllSiteQuality(codes);

      const getUniqueOptions = (key: keyof StationMetadata): string[] => {
        const allValues = stationData.map(item => item[key]);
        return [...new Set(allValues)].filter(Boolean).sort() as string[];
      };

      const dynamicFilterConfig: Record<string, FilterConfig> = {
        prioritas: { label: "Prioritas", type: "multi", options: getUniqueOptions("prioritas") },
        upt_penanggung_jawab: { label: "UPT", type: "multi", options: getUniqueOptions("upt_penanggung_jawab") },
        jaringan: { label: "Jaringan", type: "multi", options: getUniqueOptions("jaringan") },
        provinsi: { label: "Provinsi", type: "multi", options: getUniqueOptions("provinsi") },
      };
      setFilterConfig(dynamicFilterConfig);
    }
  }, [stationData, filters]);

  const dataStasiunLengkap = useMemo<StasiunDenganSummary[]>(() => {
    if (stationData.length === 0) return [];
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

  const filteredData = useMemo(() => {
    const activeFilterKeys = Object.keys(filters).filter(key => filters[key] && filters[key].length > 0);
    let dataSource = dataStasiunLengkap;

    if (activeFilterKeys.length > 0) {
      dataSource = dataSource.filter(station =>
        activeFilterKeys.every(key =>
          filters[key].includes(station[key as keyof StationMetadata])
        )
      );
    }

    if (globalFilter && globalFilter.trim() !== "") {
      const search = globalFilter.toLowerCase();
      dataSource = dataSource.filter(station =>
        Object.values(station).join(" ").toLowerCase().includes(search)
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

    // 1. Convert the Record to an array of [key, value] pairs
  const siteQualityMapArray = Object.entries(siteQualityMap);
  let filteredSiteQualityMapArray 



  const handleDownloadCSV = () => {
    // console.log(siteQualityMapArray)
    // console.log("ekokop")
    const dataToDownload = filteredData.map(item => {
          // 2. Filter the entries
        filteredSiteQualityMapArray = siteQualityMapArray.filter(([key]) => {
          // Keep entries where the value is NOT 'admin'
          return  key == item.kode_stasiun ;
        });
        // console.log(filteredSiteQualityMapArray[0]);
        let sq;
        if (filteredSiteQualityMapArray[0]){
           sq = filteredSiteQualityMapArray[0][1];
        } else {
            sq = "-";
        }
        return ({
        ...item,
        // summary_kualitas: getStatusText(item.result, item.quality_percentage),
        summary_kualitas: item.result,
        persentase_kualitas: item.quality_percentage !== null ? `${item.quality_percentage.toFixed(1)}%` : 'N/A',
        site_quality : sq
      })  
    });
    
    if (dataToDownload.length === 0) return;

    const headers = Object.keys(dataToDownload[0]).join(",");
    const csvContent = headers + "\n" + dataToDownload.map((row: any) =>
      Object.values(row)
        .map((val) => (typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val))
        .join(",")
    ).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "station_quality.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<StasiunDenganSummary>[] = [
    { accessorKey: "stasiun_id", header: "No" },
    { accessorKey: "kode_stasiun", header: "Kode Stasiun" },
    { accessorKey: "lokasi", header: "Lokasi" },
    { accessorKey: "provinsi", header: "Province" }, // Tambahkan kolom province di sebelah lokasi
    { accessorKey: "jaringan", header: "Group" },
    { accessorKey: "prioritas", header: "Prioritas" },
    { accessorKey: "upt_penanggung_jawab", header: "UPT" },
    {
      id: "summary",
      header: "Summary Kualitas",
      cell: ({ row }) => {
        // Konversi result Indonesia ke label Inggris untuk StatusBadge
        const { result } = row.original;
        let label = "-";
        if (result === "Baik") label = "Good";
        else if (result === "Cukup Baik") label = "Fair";
        else if (result === "Buruk") label = "Poor";
        else if (result === "Mati" || result === null) label = "No Data";
        return (
          <div className="flex flex-col justify-center">
            <StatusBadge value={label} />
          </div>
        );
      },
    },
    {
      id: "site_quality",
      header: "Site Quality",
      cell: ({ row }) => {
        const code = row.original.kode_stasiun;
        const siteQuality = siteQualityMap[code] || "-";
        return (
            <span className="block w-full py-1 rounded-sm text-[11px] font-bold text-center bg-blue-50 text-blue-800">
            {siteQuality}
          </span>
        );
      },
    },
    {
      id: "detail",
      header: "Detail Stasiun",
      cell: ({ row }) => (
        <Link
          to={`/station/${row.original.kode_stasiun}`}
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          Detail
        </Link>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainLayout>
        {/* Judul serupa dashboard */}
        <h1 className="text-left text-2xl font-bold mt-0 mb-2 ml-1">
          Stasiun Quality
        </h1>

        <CardContainer className="mb-4 p-3">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Kolom Grafik Donat */}
            <div className="lg:w-1/4 w-full h-[405px] flex flex-col items-center justify-center p-2">
              <h2 className="text-lg font-bold mb-2">Ringkasan Status Stasiun</h2>
              <div className="w-full h-full max-w-xs">
                <QualityDonutChart data={dataStasiunLengkap} />
              </div>
            </div>

            {/* Kolom Peta */}
            <div className="lg:w-3/4 w-full h-[405px] relative">
              <MapContainer center={[-2.2, 117]} zoom={5} className="w-full h-full rounded-lg">
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
          </div>
        </CardContainer>
        
        <CardContainer className="p-5">
          <div className="flex justify-between items-center mb-4">
            <TableFilters
              filters={filters}
              setFilters={setFilters}
              filterConfig={filterConfig}
            />
            <button
              onClick={handleDownloadCSV}
              className="bg-green-600 text-white rounded-lg px-3 py-2.5 hover:bg-green-700 transition duration-300 text-sm"
            >
              Export CSV
            </button>
          </div>

          {loading && <p>Loading station data...</p>}
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