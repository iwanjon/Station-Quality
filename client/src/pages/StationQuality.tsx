import { useEffect, useState, useMemo, useRef } from "react";
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

// Mapping dictionary for Site Quality from external API (English) to standardized Indonesian
const SITE_QUALITY_MAP: Record<string, string> = {
  "Very Good": "Sangat Baik",
  "Good": "Baik",
  "Fair": "Cukup Baik",
  "Poor": "Buruk",
  "-": "-",
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
    { label: "Baik", color: STATUS_CONFIG["Baik"].color },
    { label: "Cukup Baik", color: STATUS_CONFIG["Cukup Baik"].color },
    { label: "Buruk", color: STATUS_CONFIG["Buruk"].color },
    { label: "Mati", color: STATUS_CONFIG["Mati"].color },
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
    // Categories standardized to Indonesian
    const categories: { [key: string]: { count: number; color: string } } = {
      "BAIK": { count: 0, color: STATUS_CONFIG["Baik"].color },
      "CUKUP BAIK": { count: 0, color: STATUS_CONFIG["Cukup Baik"].color },
      "BURUK": { count: 0, color: STATUS_CONFIG["Buruk"].color },
      "MATI": { count: 0, color: STATUS_CONFIG["Mati"].color },
    };

    if (!data) return [];

    data.forEach(station => {
      const r = station.result;
      if (r === "Baik") categories["BAIK"].count++;
      else if (r === "Cukup Baik") categories["CUKUP BAIK"].count++;
      else if (r === "Buruk") categories["BURUK"].count++;
      else categories["MATI"].count++;
    });

    return Object.entries(categories).map(([label, { count, color }]) => ({
      label: `${label} (${count})`,
      count,
      color,
    }));
  }, [data]);

  const totalCount = useMemo(() => {
    if (!data) return 0;
    return data.length;
  }, [data]);

  const totalCountRef = useRef(totalCount);
  totalCountRef.current = totalCount;

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

  // Plugin to render center total station count and description label dynamically
  const centerTextPlugin = useMemo(() => ({
    id: 'centerText',
    afterDatasetsDraw: (chart: any) => {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);
      if (!meta || !meta.data || !meta.data.length || !meta.data[0]) return;

      const { x, y } = meta.data[0];
      if (typeof x !== 'number' || typeof y !== 'number') return;

      // Calculate total count directly from active chart dataset to avoid stale closure
      const dataset = chart.data?.datasets?.[0];
      const activeTotal: number =
        dataset && Array.isArray(dataset.data)
          ? dataset.data.reduce(
              (sum: number, val: any) => sum + (Number(val) || 0),
              0
            )
          : totalCountRef.current;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 1. Render active filtered total station count
      ctx.font = 'bold 28px Montserrat, sans-serif';
      ctx.fillStyle = '#1e293b'; // slate-800
      ctx.fillText(activeTotal.toLocaleString('id-ID'), x, y - 7);

      // 2. Render descriptive label
      ctx.font = '600 11px Montserrat, sans-serif';
      ctx.fillStyle = '#64748b'; // slate-500
      ctx.fillText('Total Stasiun', x, y + 14);

      ctx.restore();
    },
  }), []);

  // Fallback guard when no data matches active filter or data is empty
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs text-center p-4">
        <p className="font-semibold text-gray-500 mb-1">Tidak Ada Data</p>
        <p>Tidak ada stasiun yang sesuai dengan filter.</p>
      </div>
    );
  }

  return <Doughnut data={dataForChart} options={options} plugins={[centerTextPlugin]} />;
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
      const response = await axiosServer.get("/api/stasiun/public/active");
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

  // --- CORE DATA MERGING (Standardized to Indonesian, No Data -> Mati) ---
  const allMergedData = useMemo<StationDataComplete[]>(() => {
    if (stationData.length === 0) return [];
    
    const summaryMap = new Map(qcSummaryData.map(item => [item.code, item]));

    return stationData.map(station => {
      const summary = summaryMap.get(station.kode_stasiun);
      const rawSiteQ = siteQualityMap[station.kode_stasiun] ?? "-";
      // Map Site Quality values from English to standardized Indonesian
      const siteQ = SITE_QUALITY_MAP[rawSiteQ] || rawSiteQ || "-";
      
      const rawResult = summary ? summary.result : (station.result || "Mati");
      // Map empty or "No Data" status to "Mati"
      const mappedResult = (!rawResult || rawResult === "No Data") ? "Mati" : rawResult;

      return {
        ...station,
        quality_percentage: summary ? summary.quality_percentage : null,
        result: mappedResult, 
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

      // Order Site Quality logically from highest to lowest quality
      const getSiteQualityOptions = (): string[] => {
        const present = new Set(allMergedData.map(item => item.site_quality));
        const preferredOrder = ["Sangat Baik", "Baik", "Cukup Baik", "Buruk", "-"];
        const ordered = preferredOrder.filter(opt => present.has(opt));
        present.forEach(opt => {
          if (opt && !ordered.includes(opt)) ordered.push(opt);
        });
        return ordered;
      };

      const dynamicFilterConfig: Record<string, FilterConfig> = {
        prioritas: { label: "Prioritas", type: "multi", options: getUniqueOptions("prioritas") },
        upt_penanggung_jawab: { label: "UPT", type: "multi", options: getUniqueOptions("upt_penanggung_jawab") },
        jaringan: { label: "Jaringan", type: "multi", options: getUniqueOptions("jaringan") },
        provinsi: { label: "Provinsi", type: "multi", options: getUniqueOptions("provinsi") },
        result: { label: "Summary Kualitas", type: "multi", options: getUniqueOptions("result") }, 
        site_quality: { label: "Site Quality", type: "multi", options: getSiteQualityOptions() },
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
    { accessorKey: "provinsi", header: "Provinsi" },
    { accessorKey: "jaringan", header: "Jaringan" },
    { accessorKey: "prioritas", header: "Prioritas" },
    { accessorKey: "upt_penanggung_jawab", header: "UPT" },
    {
      accessorKey: "result", 
      id: "result", 
      header: "Summary Kualitas",
      cell: ({ row }) => {
        const result = row.original.result;
        let label = "Mati";
        if (result === "Baik") label = "Baik";
        else if (result === "Cukup Baik") label = "Cukup Baik";
        else if (result === "Buruk") label = "Buruk";
        else if (result === "Mati" || result === "No Data" || !result) label = "Mati";
        else label = result;

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
      cell: ({ getValue }) => {
        const val = getValue<string>();
        let colorClass = "bg-gray-100 text-gray-700";
        if (val === "Sangat Baik") colorClass = "bg-emerald-100 text-emerald-800";
        else if (val === "Baik") colorClass = "bg-green-100 text-green-800";
        else if (val === "Cukup Baik") colorClass = "bg-orange-100 text-orange-800";
        else if (val === "Buruk") colorClass = "bg-red-100 text-red-800";

        return (
          <span className={`block w-full py-1 rounded-sm text-[11px] font-bold text-center ${colorClass}`}>
            {val}
          </span>
        );
      },
    },
    {
      id: "detail",
      header: "Detail Stasiun",
      cell: ({ row }) => (
        <Link
          to={`/station-daily/${row.original.kode_stasiun}`}
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
                {/* Synchronized with active filters, table, and map data */}
                <QualityDonutChart data={filteredData} />
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
                      <br />
                      <Link
                        to={`/station-daily/${station.data.kode_stasiun}`}
                        className="text-blue-600 hover:underline text-xs block mt-1 font-medium"
                      >
                        Detail Stasiun &rarr;
                      </Link>
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
              Ekspor CSV
            </button>
          </div>

          {loading && <p className="text-sm text-gray-500">Memuat data stasiun...</p>}
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