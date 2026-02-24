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
import { Link } from "react-router-dom";
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

interface QCSummary {
  code: string;
  quality_percentage: number | null;
  result: string;
}

export interface StationDataComplete extends StationMetadata {
  quality_percentage: number | null;
  site_quality: string;
  result: string;
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

const triangleIcon = (color: string) =>
  L.divIcon({
    className: "",
    html: `
      <div style="
        width: 0; height: 0; 
        border-left: 6px solid transparent; 
        border-right: 6px solid transparent; 
        border-bottom: 12px solid ${color};
        position: relative;
      ">
        <div style="
          position: absolute; left: -7px; top: -1px;
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

const getColorByResult = (result: string | null): string => {
  return STATUS_CONFIG[result || "default"]?.color || STATUS_CONFIG.default.color;
};

const MapLegend = () => {
  const legendItems = [
    { label: "Good", color: STATUS_CONFIG["Baik"].color },
    { label: "Fair", color: STATUS_CONFIG["Cukup Baik"].color },
    { label: "Poor", color: STATUS_CONFIG["Buruk"].color },
    { label: "No Data", color: STATUS_CONFIG["Mati"].color },
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

// [FIXED COMPONENT] 
// 1. Added useMemo for 'dataForChart' to stabilize the object reference.
// 2. Added useMemo for 'options'.
// 3. Added a safety check for empty data to prevent initial render crashes.
const QualityDonutChart = ({ data }: { data: StationDataComplete[] }) => {
  const chartData = useMemo(() => {
    const categories: { [key: string]: { count: number; color: string } } = {
      "GOOD": { count: 0, color: STATUS_CONFIG["Baik"].color },
      "FAIR": { count: 0, color: STATUS_CONFIG["Cukup Baik"].color },
      "POOR": { count: 0, color: STATUS_CONFIG["Buruk"].color },
      "NO DATA": { count: 0, color: STATUS_CONFIG["No Data"].color },
    };

    if (!data) return [];

    data.forEach(station => {
      const r = station.result;
      if (r === "Baik") categories["GOOD"].count++;
      else if (r === "Cukup Baik") categories["FAIR"].count++;
      else if (r === "Buruk") categories["POOR"].count++;
      else if (r === "Mati" || r === "No Data") categories["NO DATA"].count++;
    });

    return Object.entries(categories).map(([label, { count, color }]) => ({
      label: `${label} (${count})`,
      count,
      color,
    }));
  }, [data]);

  const dataForChart = useMemo(() => ({
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
  }), [chartData]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { position: 'bottom' as const, labels: { boxWidth: 15, padding: 15 } },
    },
  }), []);

  // [Safety Guard] If data is loading or empty, prevent Chart.js from exploding
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading Chart...</div>;
  }

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

  const fetchAllSiteQuality = async (stationCodes: string[]) => {
    const map: Record<string, string> = {};
    if (stationCodes.length === 0) return;
    
    await Promise.all(
      stationCodes.map(async (code) => {
        try {
          const res = await axiosServer.get(`/api/qc/site/detail/${code}`);
          if (res.data && res.data[0] && res.data[0].site_quality) {
            map[code] = res.data[0].site_quality;
          } else {
             map[code] = "-";
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
    if (savedFilters) setFilters(JSON.parse(savedFilters));
    fetchStationMetadata();
    fetchQCSummary();
  }, []);

  useEffect(() => {
    if (stationData.length > 0) {
      const codes = stationData.map(s => s.kode_stasiun);
      fetchAllSiteQuality(codes);
    }
  }, [stationData]);

  // --- CORE DATA MERGING ---
  const allMergedData = useMemo<StationDataComplete[]>(() => {
    if (stationData.length === 0) return [];
    
    const summaryMap = new Map(qcSummaryData.map(item => [item.code, item]));

    return stationData.map(station => {
      const summary = summaryMap.get(station.kode_stasiun);
      const siteQ = siteQualityMap[station.kode_stasiun] ?? "-";
      
      return {
        ...station,
        quality_percentage: summary ? summary.quality_percentage : null,
        result: summary ? summary.result : (station.result || "No Data"), 
        site_quality: siteQ,
      };
    });
  }, [stationData, qcSummaryData, siteQualityMap]);

  // --- FILTER CONFIG ---
  useEffect(() => {
    if (allMergedData.length > 0) {
      const getUniqueOptions = (key: keyof StationDataComplete): string[] => {
        const allValues = allMergedData.map(item => String(item[key] || ""));
        return [...new Set(allValues)].filter(v => v !== "" && v !== "null").sort();
      };

      const dynamicFilterConfig: Record<string, FilterConfig> = {
        prioritas: { label: "Prioritas", type: "multi", options: getUniqueOptions("prioritas") },
        upt_penanggung_jawab: { label: "UPT", type: "multi", options: getUniqueOptions("upt_penanggung_jawab") },
        jaringan: { label: "Jaringan", type: "multi", options: getUniqueOptions("jaringan") },
        provinsi: { label: "Provinsi", type: "multi", options: getUniqueOptions("provinsi") },
        result: { label: "Summary", type: "multi", options: getUniqueOptions("result") }, 
        site_quality: { label: "Site Quality", type: "multi", options: getUniqueOptions("site_quality") },
      };
      
      setFilterConfig(dynamicFilterConfig);
    }
  }, [allMergedData]); 

  // --- FILTERING ---
  const filteredData = useMemo(() => {
    const activeFilterKeys = Object.keys(filters).filter(key => filters[key] && filters[key].length > 0);
    let dataSource = allMergedData;

    if (activeFilterKeys.length > 0) {
      dataSource = dataSource.filter(station =>
        activeFilterKeys.every(key => {
           const val = String(station[key as keyof StationDataComplete]); 
           return filters[key].includes(val);
        })
      );
    }

    if (globalFilter && globalFilter.trim() !== "") {
      const search = globalFilter.toLowerCase();
      dataSource = dataSource.filter(station =>
        Object.values(station).join(" ").toLowerCase().includes(search)
      );
    }
    return dataSource;
  }, [allMergedData, filters, globalFilter]);

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
    if (filteredData.length === 0) return;

    const dataToDownload = filteredData.map(item => ({
      ...item,
      summary_kualitas: item.result,
      persentase_kualitas: item.quality_percentage !== null ? `${item.quality_percentage.toFixed(1)}%` : 'N/A',
      site_quality: item.site_quality
    }));
    
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

  const columns: ColumnDef<StationDataComplete>[] = [
    { accessorKey: "stasiun_id", header: "No" },
    { accessorKey: "kode_stasiun", header: "Kode Stasiun" },
    { accessorKey: "lokasi", header: "Lokasi" },
    { accessorKey: "provinsi", header: "Province" },
    { accessorKey: "jaringan", header: "Group" },
    { accessorKey: "prioritas", header: "Prioritas" },
    { accessorKey: "upt_penanggung_jawab", header: "UPT" },
    {
      accessorKey: "result", 
      id: "result", 
      header: "Summary Kualitas",
      cell: ({ row }) => {
        const result = row.original.result;
        let label = "-";
        if (result === "Baik") label = "Good";
        else if (result === "Cukup Baik") label = "Fair";
        else if (result === "Buruk") label = "Poor";
        else if (result === "Mati" || result === "No Data") label = "No Data";
        return (
          <div className="flex flex-col justify-center">
            <StatusBadge value={label} />
          </div>
        );
      },
    },
    {
      accessorKey: "site_quality",
      header: "Site Quality",
      cell: ({ getValue }) => (
        <span className="block w-full py-1 rounded-sm text-[11px] font-bold text-center bg-blue-50 text-blue-800">
          {getValue<string>()}
        </span>
      ),
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
        <h1 className="text-left text-2xl font-bold mt-0 mb-2 ml-1">
          Stasiun Quality
        </h1>

        <CardContainer className="mb-4 p-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="lg:w-1/4 w-full h-[405px] flex flex-col items-center justify-center p-2">
              <h2 className="text-lg font-bold mb-2">Ringkasan Status Stasiun</h2>
              <div className="w-full h-full max-w-xs">
                {/* Passing 'allMergedData' allows the chart to show total statistics.
                  If you want the chart to respect filters, pass 'filteredData' instead.
                */}
                <QualityDonutChart data={allMergedData} />
              </div>
            </div>

            <div className="lg:w-3/4 w-full h-[405px] relative">
              <MapContainer center={[-2.2, 117]} zoom={5} className="w-full h-full rounded-lg">
                <TileLayer
                  attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {stationPositions.map((station, idx) => (
                  <Marker
                    key={idx}
                    position={station.coords}
                    icon={triangleIcon(getColorByResult(station.data.result))}
                  >
                    <Popup>
                      <b>Stasiun: {station.data.kode_stasiun}</b><br />
                      Status: {station.data.result}<br />
                      {station.data.quality_percentage !== null && `Kualitas: ${station.data.quality_percentage.toFixed(1)}%`}
                    </Popup>
                  </Marker>
                ))}
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