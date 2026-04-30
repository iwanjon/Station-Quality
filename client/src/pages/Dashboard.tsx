import { useEffect, useState, useMemo, memo } from "react";
import MainLayout from "../layouts/MainLayout";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axiosServer from "../utilities/AxiosServer";
import dayjs from "dayjs";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer as RechartsResponsiveContainer } from "recharts";
import DataTable from "../components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";

// --- INTERFACES ---

interface Stasiun {
  stasiun_id: number;
  net: string;
  kode_stasiun: string;
  lintang: number;
  bujur: number;
  elevasi: number;
  lokasi: string;
  provinsi: string;
  upt_penanggung_jawab: string;
  status: string;
  tahun_instalasi: number;
  jaringan: string;
  prioritas: string;
  keterangan: string | null;
  accelerometer: string;
  digitizer_komunikasi: string;
  tipe_shelter: string | null;
  lokasi_shelter: string;
  penjaga_shelter: string;
  kondisi_shelter: string;
  assets_shelter: string;
  access_shelter: string;
  photo_shelter: string;
  penggantian_terakhir_alat: string | null;
  updated_at: string;
}

// Extended interface specifically for rendering the merged Table
interface TableStasiun extends Stasiun {
  qc_result?: string | null;
  quality_percentage?: number | null;
}

interface SlmonMap extends SlmonStatus, QCSummaryBase {
  type: "Feature";
}

interface SlmonStatus {
  type: "Feature";
  properties: {
    sta: string;
    latency1?: string;
    latency2?: string;
    latency3?: string;
    latency4?: string;
    latency5?: string;
    latency6?: string;
    color1?: string;
    color2?: string;
    color3?: string;
    color4?: string;
    color5?: string;
    color6?: string;
  };
  geometry: {
    type: "Point";
    coordinates: [string, string, number];
  };
}

interface SlmonFeatureCollection {
  type: "FeatureCollection";
  features: SlmonStatus[];
}

interface QCSummaryBase {
  code: string;
  quality_percentage: number | null;
  result: string |null;
  site_quality: string | null;
  latencyStrings: string[];
}

interface QCSummary extends QCSummaryBase{
  date: string;
  details: string;
  network: string;
  geometry: {
    type: string;
    coordinates: [number, number, number];
  };
  primaryLatency: number | null;
  primaryColor: string;
}

interface StackedBarData {
  date: string;
  ON: number;
  OFF: number;
}

const triangleIcon = (color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 12px solid ${color}; position: relative;"><div style="position: absolute; left: -7px; top: -1px; width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-bottom: 14px solid #222; z-index: -1;"></div></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 14],
  });

const getStatusTextEn = (result: string|null): string => {
  switch (result) {
    case "Baik": return "Good";
    case "Cukup Baik": return "Fair";
    case "Buruk": return "Poor"; 
    case "No Data": return "No Data";
    case "Mati": return "Mati";
    case null : return "Mati";
    default: return result;
  }
};

const parseLatencyToSeconds = (latencyString?: string | null): number | null => {
  if (!latencyString || latencyString.toUpperCase() === "NA") return null;
  const value = parseFloat(latencyString);
  if (isNaN(value)) return null;

  if (latencyString.endsWith("h")) return value * 3600; 
  if (latencyString.endsWith("d")) return value * 86400;
  if (latencyString.endsWith("m")) return value * 60;
  
  return value; 
};

const getTriangleColor = <T extends { latencyStrings: string[] }>(input: T): string => {
  const latenciesInSeconds = [
    parseLatencyToSeconds(input.latencyStrings[0]),
    parseLatencyToSeconds(input.latencyStrings[1]),
    parseLatencyToSeconds(input.latencyStrings[2]),
  ];

  const validLatencies = latenciesInSeconds.filter(
    (sec): sec is number => sec !== null
  );

  if (input.latencyStrings[0]?.toUpperCase() === "NA" || validLatencies.length === 0) {
    return "#222222"; // Black
  }

  const minLatencySec = Math.min(...validLatencies);

  if (minLatencySec < 10) return "#16a34a"; // Green
  if (minLatencySec < 60) return "#facc15"; // Yellow
  if (minLatencySec < 180) return "#fb923c"; // Orange
  if (minLatencySec < 1800) return "#ef4444"; // Red
  
  return "#222222"; // Black
};

const MapLegend = ({ stationData, totalStationCount }: { stationData: QCSummaryBase[]; totalStationCount: number }) => {
  const countByCategory = {
    "<10s": 0,    // Green
    "<1m": 0,     // Yellow
    "<3m": 0,     // Orange
    "<30m": 0,    // Red
    ">30m": 0,     // Black
  };

  stationData.forEach((s) => {
    const latenciesInSeconds = [
      parseLatencyToSeconds(s.latencyStrings[0]),
      parseLatencyToSeconds(s.latencyStrings[1]),
      parseLatencyToSeconds(s.latencyStrings[2]),
    ];
    const validLatencies = latenciesInSeconds.filter((sec): sec is number => sec !== null);

    if (s.latencyStrings[0]?.toUpperCase() === "NA" || validLatencies.length === 0) {
      countByCategory[">30m"]++;
      return;
    }

    const minLatencySec = Math.min(...validLatencies);

    if (minLatencySec < 10) {
      countByCategory["<10s"]++;
    } else if (minLatencySec < 60) {
      countByCategory["<1m"]++;
    } else if (minLatencySec < 180) {
      countByCategory["<3m"]++;
    } else if (minLatencySec < 1800) {
      countByCategory["<30m"]++;
    } else {
      countByCategory[">30m"]++;
    }
  });

  const summary = [
    { label: "<10s", color: "bg-green-500", textColor: "text-green-600", count: countByCategory["<10s"] },
    { label: "<1m", color: "bg-yellow-400", textColor: "text-yellow-500", count: countByCategory["<1m"] },
    { label: "<3m", color: "bg-orange-400", textColor: "text-orange-500", count: countByCategory["<3m"] },
    { label: "<30m", color: "bg-red-500", textColor: "text-red-600", count: countByCategory["<30m"] },
    { label: ">30m", color: "bg-black", textColor: "text-black", count: countByCategory[">30m"] },
  ];

  const maxCount = Math.max(...summary.map((s) => s.count), 1);

  return (
    <div className="absolute bottom-3 left-3 bg-white/70 p-2 rounded-lg shadow w-44 z-[400]" style={{ fontSize: "11px" }}>
      <div className="font-semibold text-gray-800 mb-0.5" style={{ fontSize: "12px" }}>Latency Summary</div>
      <div className="mb-1 text-[10px]">
        <span className="font-bold">Total:</span> {totalStationCount}
      </div>
      <div className="flex flex-col gap-1">
        {summary.map((item) => (
          <div key={item.label} className="grid grid-cols-[2.5rem_1fr_1.5rem] items-center gap-x-1">
            <span className="text-[10px] text-gray-600 font-medium">{item.label}</span>
            <div
              className={`${item.color} h-2 rounded-sm`}
              style={{
                width: `${(item.count / maxCount) * 100}%`,
                minWidth: item.count > 0 ? "3px" : "0",
                transition: "width 0.3s ease-in-out",
              }}
            ></div>
            <span className={`text-[11px] font-bold justify-self-start ${item.textColor}`}>{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const InfoCard = ({ title, children }: { title: string; children?: React.ReactNode }) => (
  <div className="bg-white rounded-xl shadow p-3 min-h-[240px] flex flex-col border border-transparent">
    <h2 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-0 mb-2">
      {title}
    </h2>
    <div className="flex-grow flex flex-col items-center justify-center w-full">
      {children ? children : <p>Konten untuk {title} akan ditampilkan di sini.</p>}
    </div>
  </div>
);

// --- MEMOIZED CARDS ---

const MetadataCard = memo(() => {
  const [recentUpdates, setRecentUpdates] = useState<{ kode_stasiun: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentUpdates = async () => {
      try {
        setIsLoading(true);
        const response = await axiosServer.get('/api/stasiun/public/recent-updates');
        
        if (response.data.success && Array.isArray(response.data.data)) {
          setRecentUpdates(response.data.data);
        } else {
          setRecentUpdates([]);
        }
      } catch (error) {
        setRecentUpdates([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentUpdates();
  }, []);

  return (
    <InfoCard title="Metadata">
      <div className="text-left text-gray-800 w-full text-xs">
        <p className="font-semibold mb-1">Recent updates:</p>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-16">
            <p>Loading...</p> 
          </div>
        ) : (
          <ul className="list-disc list-inside">
            {recentUpdates.length > 0 ? (
              recentUpdates.map((station) => (
                <li key={station.kode_stasiun}>{station.kode_stasiun}</li>
              ))
            ) : (
              <li className="list-none italic text-gray-500">No recent updates.</li>
            )}
          </ul>
        )}
      </div>
    </InfoCard>
  );
});

const AVAILABILITY_COLORS = ["#16a34a", "#facc15", "#fb923c", "#ef4444", "#a3a3a3"];

const getAvailabilityCategory = (value: number | null) => {
  if (value === null) return "No Data";
  if (value >= 97) return ">97%";
  if (value >= 90) return "90-97%";
  if (value > 0) return "1-89%";
  if (value === 0) return "0%";
  return "No Data";
};

const AvailabilityCard = memo(({ availabilityPieData }: { availabilityPieData: { name: string; value: number }[] }) => {
  return (
    <InfoCard title="Availability">
      <div className="w-full flex flex-col items-center justify-center">
        <div className="w-full h-32 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={availabilityPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={40} label isAnimationActive={false}>
                {availabilityPieData.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={AVAILABILITY_COLORS[idx % AVAILABILITY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
          {[ 
            { label: ">97%", color: "#16a34a" }, { label: "90-97%", color: "#facc15" },
            { label: "1-89%", color: "#fb923c" }, { label: "0%", color: "#ef4444" },
            { label: "No Data", color: "#a3a3a3" },
          ].map((item) => (
            <div key={item.label} className="flex items-center space-x-1 text-[11px]">
              <span className="inline-block rounded-full" style={{ width: "0.45em", height: "0.45em", backgroundColor: item.color, marginRight: "0.2em" }} />
              <span className="font-medium">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-[10px] text-gray-500">Data for yesterday's availability</span>
          <Link to="/station-availability" className="text-[10px] text-blue-600 hover:underline">Details...</Link>
        </div>
      </div>
    </InfoCard>
  );
});

const QUALITY_COLORS = ["#16a34a", "#fb923c", "#ef4444", "#a3a3a3"];
const QUALITY_LABELS = [
  { label: "GOOD", color: "#16a34a" },
  { label: "FAIR", color: "#fb923c" },
  { label: "POOR", color: "#ef4444" },
  { label: "NO DATA", color: "#a3a3a3" },
];

const QualityCard = memo(({ qualityPieData }: { qualityPieData: { name: string; value: number }[] }) => {
  return (
    <InfoCard title="Quality">
      <div className="w-full flex flex-col items-center justify-center">
        <div className="w-full h-35 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={qualityPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={40} label isAnimationActive={false}>
                {qualityPieData.map((_, idx) => (
                  <Cell key={`cell-q-${idx}`} fill={QUALITY_COLORS[idx % QUALITY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
          {QUALITY_LABELS.map((item) => (
            <div key={item.label} className="flex items-center space-x-1 text-[11px]">
              <span className="inline-block rounded-full" style={{ width: "0.45em", height: "0.45em", backgroundColor: item.color, marginRight: "0.2em" }} />
              <span className="font-medium">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-[10px] text-gray-500">Data for yesterday's quality</span>
          <Link to="/station-quality" className="text-[10px] text-blue-600 hover:underline">Details...</Link>
        </div>
      </div>
    </InfoCard>
  );
});

// --- DASHBOARD ---

const Dashboard = () => {
  const [slmondatamap, setslmondatamap] = useState<SlmonMap[]>([]);
  const [combinedData, setCombinedData] = useState<QCSummary[]>([]);
  const [stationTableData, setStationTableData] = useState<Stasiun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalStationCount, setTotalStationCount] = useState<number>(0);
  const [registeredCount, setRegisteredCount] = useState<number>(0);
  const [inactiveCount, setInactiveCount] = useState<number>(0);
  const [stackedBarData, setStackedBarData] = useState<StackedBarData[]>([]);

  // Extracted back to Parent to fetch alongside main data
  const [availabilityPieData, setAvailabilityPieData] = useState<{ name: string; value: number }[]>([]);
  const [qualityPieData, setQualityPieData] = useState<{ name: string; value: number }[]>([]);

  // Shared Search State
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Columns Visibility State
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    jaringan: true,             
    kode_stasiun: true,
    qc_result: true,            
    quality_percentage: true,   
    lokasi: true,
    provinsi: true,
    upt_penanggung_jawab: true,
    status: false,              
    tahun_instalasi: true,
    lintang: false,
    bujur: false,
    prioritas: false,
    digitizer_komunikasi: false,
    accelerometer: false,
  });

  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const columns: ColumnDef<TableStasiun>[] = [
    { header: "Network", accessorKey: "jaringan", enableSorting: true, cell: (info) => info.getValue() },
    { header: "Station Code", accessorKey: "kode_stasiun", enableSorting: true, cell: (info) => info.getValue() },
    { 
      header: "Summary Quality", 
      accessorKey: "qc_result", 
      enableSorting: true, 
      cell: (info) => {
        const val = info.getValue() as string | null;
        return getStatusTextEn(val);
      }
    },
    { 
      header: "Quality", 
      accessorKey: "quality_percentage", 
      enableSorting: true, 
      cell: (info) => {
        const val = info.getValue() as number | null;
        return val !== null && val !== undefined ? `${val.toFixed(1)}%` : "N/A";
      }
    },
    { header: "Accelerometer", accessorKey: "accelerometer", enableSorting: true, cell: (info) => info.getValue() },
    { header: "Location", accessorKey: "lokasi", enableSorting: true, cell: (info) => info.getValue() },
    { header: "Province", accessorKey: "provinsi", enableSorting: true, cell: (info) => info.getValue() },
    { header: "UPT", accessorKey: "upt_penanggung_jawab", enableSorting: true, cell: (info) => info.getValue() },
    { header: "Install Status", accessorKey: "status", enableSorting: true, cell: (info) => info.getValue() },
    { header: "Priority", accessorKey: "prioritas", enableSorting: true, cell: (info) => info.getValue() },
    { header: "Digi/Comm", accessorKey: "digitizer_komunikasi", enableSorting: true, cell: (info) => info.getValue() },
    { header: "Installation Year", accessorKey: "tahun_instalasi", enableSorting: true, cell: (info) => info.getValue() },
    { header: "Latitude", accessorKey: "lintang", enableSorting: true, cell: (info) => info.getValue() },
    { header: "Longitude", accessorKey: "bujur", enableSorting: true, cell: (info) => info.getValue() },
  ];

  const visibleColumnsArray = columns.filter(column => {
    const key = (column as any).accessorKey;
    return key ? visibleColumns[key] : true;
  });

  const fetchData = async () => {
    try {
      const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
      const [qcResponse, slmonResponse, stasiunResponse, availabilityResponse] = await Promise.all([
        axiosServer.get<Omit<QCSummary, "latencyStrings" | "primaryLatency" | "primaryColor">[]>(`/api/qc/public/summary/${yesterday}`),
        axiosServer.get<SlmonFeatureCollection>("/api/dashboard/slmon/laststatus"),
        axiosServer.get<any[]>("/api/stasiun/public"),
        axiosServer.get(`/api/availability/public`, { params: { start_date: yesterday, end_date: yesterday } })
      ]);

      setTotalStationCount(slmonResponse.data.features.length);
      const stasiunData = stasiunResponse.data || [];
      setRegisteredCount(stasiunData.filter((s) => s.status === "aktif").length);
      setInactiveCount(stasiunData.filter((s) => s.status === "nonaktif").length);

      const qcData = qcResponse.data;
      const slmonData = slmonResponse.data.features;
      const slmonMap = new Map(slmonData.map((item) => [item.properties.sta, item]));

      const finalData = qcData.map((station) => {
        const slmonStation = slmonMap.get(station.code);
        const allLatencyStrings: string[] = [];
        
        if (slmonStation) {
          for (let i = 1; i <= 6; i++) {
            const latencyKey = `latency${i}` as keyof typeof slmonStation.properties;
            const latencyValue = slmonStation.properties[latencyKey] || "N/A";
            allLatencyStrings.push(latencyValue);
          }
        }

        return {
          ...station,
          latencyStrings: allLatencyStrings,
          primaryLatency: null,
          primaryColor: '',
        };
      });

      const slmonDataMap = slmonData.map((station) => {
        const abc = [
          station.properties.latency1 || "N/A",
          station.properties.latency2  || "N/A",
          station.properties.latency3  || "N/A",
          station.properties.latency4  || "N/A",
          station.properties.latency5  || "N/A",
          station.properties.latency6  || "N/A"
        ];
        
        const slmonmap:SlmonMap ={
          ...station,
          code:station.properties.sta,
          latencyStrings:abc, 
          quality_percentage:null,
          result: null,
          site_quality:null
        }
        const qcsummary = qcData.find((sta) => sta.code === slmonmap.code) || null;

        slmonmap.quality_percentage = qcsummary ? qcsummary.quality_percentage:null;
        slmonmap.result = qcsummary ? qcsummary.result : null;
        slmonmap.site_quality = qcsummary ? qcsummary.site_quality : null;

        return slmonmap;
      });

      setslmondatamap(slmonDataMap);
      setCombinedData(finalData);

      // --- Setting Quality Pie Data directly from QC API response ---
      let good = 0, fair = 0, poor = 0, nodata = 0;
      qcData.forEach((item: any) => {
        if (item.result === "Baik") good++;
        else if (item.result === "Cukup Baik") fair++;
        else if (item.result === "Buruk") poor++;
        else nodata++;
      });
      setQualityPieData([
        { name: "GOOD", value: good },
        { name: "FAIR", value: fair },
        { name: "POOR", value: poor },
        { name: "NO DATA", value: nodata },
      ]);

      // --- Setting Availability Pie Data directly from Availability API response ---
      const apiData = availabilityResponse.data?.data || {};
      const allAvail: number[] = [];
      Object.values(apiData).forEach((arr: any) => {
        if (Array.isArray(arr) && arr.length > 0) {
          const avail = arr[0]?.availability;
          if (typeof avail === "number") allAvail.push(avail);
        }
      });
      const categories = { ">97%": 0, "90-97%": 0, "1-89%": 0, "0%": 0, "No Data": 0 };
      allAvail.forEach((val) => {
        const cat = getAvailabilityCategory(val);
        categories[cat] = (categories[cat] || 0) + 1;
      });
      const totalAvailStations = Object.keys(apiData).length;
      const counted = categories[">97%"] + categories["90-97%"] + categories["1-89%"] + categories["0%"];
      categories["No Data"] = totalAvailStations - counted;
      setAvailabilityPieData(
        Object.entries(categories)
          .filter(([_, v]) => v > 0)
          .map(([name, value]) => ({ name, value }))
      );

    } catch (err) {
      console.error("Gagal memuat atau menggabungkan data:", err);
    } finally {
      if (isLoading) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    axiosServer
      .get("/api/stasiun/public")
      .then((res) => {
        setStationTableData(res.data);
      })
      .catch((err) => {
        console.error("Error fetching station data for table:", err);
      });
  }, []);

  useEffect(() => {
    fetchData(); 
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchStackedBarData = async () => {
      try {
        const res = await axiosServer.get<StackedBarData[]>('/api/latency/history/7days');
        const formattedData = res.data.map(item => ({
          ...item,
          date: dayjs(item.date).format('DD MMM')
        }));
        setStackedBarData(formattedData);
      } catch (error) {
        console.error('Gagal mengambil data untuk stacked bar chart:', error);
      }
    };
    
    fetchStackedBarData();
  }, []);

  // --- RESTRUCTURED HIGH-PERFORMANCE FILTERING LOGIC ---
  
  // 1. Create a fast Dictionary/Hash Map for map data
  const slmonDict = useMemo(() => {
    const map = new Map<string, SlmonMap>();
    slmondatamap.forEach(s => map.set(s.code, s));
    return map;
  }, [slmondatamap]);

  // 2. Map table data and use the high-speed Dictionary to merge QC data instantly
  const augmentedTableData = useMemo<TableStasiun[]>(() => {
    return stationTableData.map(stasiun => {
      const qcDataMatch = slmonDict.get(stasiun.kode_stasiun);
      return {
        ...stasiun,
        qc_result: qcDataMatch ? qcDataMatch.result : null,
        quality_percentage: qcDataMatch ? qcDataMatch.quality_percentage : null,
      };
    });
  }, [stationTableData, slmonDict]);

  // 3. Filter using the instant merged data
  const filteredTableData = useMemo(() => {
    if (!searchTerm) return augmentedTableData;
    const searchLower = searchTerm.toLowerCase();
    
    return augmentedTableData.filter((station) => {
      const qcStatusText = getStatusTextEn(station.qc_result || null).toLowerCase();

      return (
        station.kode_stasiun?.toLowerCase().includes(searchLower) ||
        station.lokasi?.toLowerCase().includes(searchLower) ||
        station.provinsi?.toLowerCase().includes(searchLower) ||
        station.upt_penanggung_jawab?.toLowerCase().includes(searchLower) ||
        station.jaringan?.toLowerCase().includes(searchLower) ||
        station.prioritas?.toLowerCase().includes(searchLower) ||
        qcStatusText.includes(searchLower)
      );
    });
  }, [augmentedTableData, searchTerm]);

  // 4. Create a fast Set of filtered Table codes
  const filteredMapData = useMemo(() => {
    if (!searchTerm) return slmondatamap;
    
    const validCodesSet = new Set(filteredTableData.map(t => t.kode_stasiun));
    const searchLower = searchTerm.toLowerCase();

    return slmondatamap.filter((s) => {
      return validCodesSet.has(s.code) || s.code.toLowerCase().includes(searchLower);
    });
  }, [slmondatamap, filteredTableData, searchTerm]);

  // --- EXPORT CSV LOGIC ---
  const handleExportCSV = () => {
    if (filteredTableData.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }

    const headers = [
      "Network", "Station Code", "Summary Quality", "Quality", "Accelerometer",
      "Location", "Province", "UPT", "Install Status", "Priority",
      "Digi/Comm", "Installation Year", "Latitude", "Longitude"
    ];

    const csvRows = filteredTableData.map(station => [
      station.jaringan || "",
      station.kode_stasiun || "",
      getStatusTextEn(station.qc_result || null),
      station.quality_percentage !== null && station.quality_percentage !== undefined ? `${station.quality_percentage.toFixed(1)}%` : "N/A",
      station.accelerometer || "",
      station.lokasi || "",
      station.provinsi || "",
      station.upt_penanggung_jawab || "",
      station.status || "",
      station.prioritas || "",
      station.digitizer_komunikasi || "",
      station.tahun_instalasi || "",
      station.lintang || "",
      station.bujur || ""
    ]);

    const csvContent = [headers, ...csvRows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `dashboard_stasiun_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  // -------------------------

  const totalOffSlmon = slmondatamap.filter(s => getTriangleColor(s) === "#222222").length;
  const totalOnSlmon = slmondatamap.length - totalOffSlmon;

  const goodCount = combinedData.filter((s) => s.result === "Baik").length;
  const fairCount = combinedData.filter((s) => s.result === "Cukup Baik").length;
  const poorCount = combinedData.filter((s) => s.result === "Buruk").length;
  const noDataCount = combinedData.filter((s) => s.result === "No Data" || s.result === "Mati").length;

  return (
    <MainLayout>
      <h1 className="text-left text-2xl font-bold mt-0 mb-2 ml-1">Dashboard</h1>
      <div className="flex flex-col lg:flex-row gap-3">
        {/* BAGIAN KIRI: PETA */}
        <div className="lg:w-3/4 w-full">
          <div className="bg-white rounded-lg shadow p-2 h-[50vh] min-h-[400px] lg:h-[450px] relative">
            <MapContainer
              center={[-2.5, 117]}
              zoom={5}
              className="w-full h-full rounded-md z-0"
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer attribution='&copy; <a href="https://osm.org/copyright">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {filteredMapData.map((s, idx) => (
                <Marker
                  key={idx}
                  position={[Number(s.geometry.coordinates[1]), Number(s.geometry.coordinates[0])]}
                  icon={triangleIcon(getTriangleColor(s))}
                >
                  <Popup>
                    <b>Stasiun: {s.code}</b>
                    <br />
                    Status: {getStatusTextEn(s.result)}
                    <br />
                    {s.quality_percentage !== null && `Kualitas: ${s.quality_percentage.toFixed(1)}%`}
                    <br />
                    {s.latencyStrings && s.latencyStrings.length > 0 ? (
                      <span>Latencies: {s.latencyStrings.join(", ")}</span>
                    ) : (
                      <span>Latency: No data</span>
                    )}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            <MapLegend stationData={filteredMapData} totalStationCount={filteredMapData.length} />
          </div>
        </div>

        {/* BAGIAN KANAN: STATUS & STACKED BAR */}
        <div className="lg:w-1/4 w-full flex flex-col gap-2">
          <div className="bg-white rounded p-2 text-center border border-gray-300 shadow">
            <p className="text-xs font-semibold">OPERATIONAL</p>
            <p className="text-3xl font-bold mb-1">{isLoading ? "..." : registeredCount}</p>
            <div className="grid grid-cols-2 gap-1">
              <div className="bg-green-600 text-white rounded p-1">
                <p className="text-[10px] font-bold">ON</p>
                <p className="text-lg font-bold">{isLoading ? "..." : totalOnSlmon}</p>
              </div>
              <div className="bg-black text-white rounded p-1">
                <p className="text-[10px] font-bold">OFF</p>
                <p className="text-lg font-bold">{isLoading ? "..." : totalOffSlmon}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 text-center text-white text-[10px] font-bold">
            <div className="bg-green-500 rounded p-1">
              <p>GOOD</p>
              <p className="text-base">{goodCount}</p>
            </div>
            <div className="bg-orange-400 rounded p-1">
              <p>FAIR</p>
              <p className="text-base">{fairCount}</p>
            </div>
            <div className="bg-red-600 rounded p-1">
              <p>POOR</p>
              <p className="text-base">{poorCount}</p>
            </div>
            <div className="bg-gray-400 rounded p-1">
              <p>NO DATA</p>
              <p className="text-base">{noDataCount}</p>
            </div>
          </div>
          {/* STACKED BAR CHART: ON/OFF 7 HARI */}
          <div className="bg-white rounded p-2 mt-2 flex flex-col items-center border border-gray-300 shadow" style={{ minHeight: 120 }}>
            <h2 className="text-xs font-bold mb-1 text-gray-700">Stasiun ON/OFF 7 Hari Terakhir</h2>
            <RechartsResponsiveContainer width="100%" height={90}>
              <BarChart data={stackedBarData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <RechartsTooltip />
                <Legend verticalAlign="top" height={20} />
                <Bar dataKey="ON" stackId="a" fill="#16a34a" name="ON" isAnimationActive={false} />
                <Bar dataKey="OFF" stackId="a" fill="#ef4444" name="OFF" isAnimationActive={false} />
              </BarChart>
            </RechartsResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- AVAILABILITY & QUALITY CARD & PIECHART --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        {/* Fast Loading but doesn't re-render on typing! */}
        <AvailabilityCard availabilityPieData={availabilityPieData} />
        <QualityCard qualityPieData={qualityPieData} />
        <MetadataCard />
      </div>

      {/* --- DASHBOARD DATA TABLE SECTION --- */}
      <div className="bg-white p-4 rounded-xl shadow mt-6 mb-4">
        
        {/* CSS Block to cleanly hide the internal DataTable search box to avoid duplication */}
        <style>{`
          .datatable-wrapper input[placeholder="Search..."] {
            display: none !important;
          }
        `}</style>

        {/* HEADER: Search Bar, Export Button & Column Visibility Toggles */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">            
          
          {/* Input Group: Search + Export Button */}
          <div className="flex gap-2 w-full md:w-auto">
            <div className="w-full md:w-64">
              <input
                type="text"
                className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-sm"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 transition-colors shadow-sm whitespace-nowrap"
              title="Export current filtered data to CSV"
            >
              <Download size={14} />
              Export
            </button>
          </div>

          {/* Column Visibility Controls */}
          <div className="flex flex-wrap gap-2 text-sm md:justify-end flex-1">
            <span className="font-medium text-gray-700 flex items-center mr-2 w-full md:w-auto">Show/Hide Column(s):</span>
            {columns.map((column: any) => {
              const colKey = column.accessorKey;
              return (
                <button
                  key={colKey}
                  onClick={() => toggleColumnVisibility(colKey)}
                  className={`px-2 py-1 rounded border text-xs transition-colors ${
                    visibleColumns[colKey]
                      ? 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200'
                      : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={`${visibleColumns[colKey] ? 'Hide' : 'Show'} ${column.header}`}
                >
                  {column.header as React.ReactNode}
                </button>
              );
            })}
          </div>

        </div>
        
        {/* Table wrapper ensuring horizontal scroll on mobile sizes without collapsing layout */}
        <div className="overflow-x-auto w-full pb-2 datatable-wrapper">
          <DataTable columns={visibleColumnsArray} data={filteredTableData} />
        </div>
      </div>

    </MainLayout>
  );
};

export default Dashboard;