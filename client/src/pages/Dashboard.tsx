import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axiosServer from "../utilities/AxiosServer";
import dayjs from "dayjs";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer as RechartsResponsiveContainer } from "recharts";

// --- INTERFACES ---

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

interface QCSummary {
  date: string;
  code: string;
  quality_percentage: number | null;
  result: string;
  site_quality: string | null;
  details: string;
  network: string;
  geometry: {
    type: string;
    coordinates: [number, number, number];
  };
  latencyStrings: string[];
  primaryLatency: number | null;
  primaryColor: string;
}

interface StackedBarData {
  date: string;
  ON: number;
  OFF: number;
}

// --- FUNGSI HELPER (TIDAK BERUBAH) ---
const triangleIcon = (color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 12px solid ${color}; position: relative;"><div style="position: absolute; left: -7px; top: -1px; width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-bottom: 14px solid #222; z-index: -1;"></div></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 14],
  });

const getStatusTextEn = (result: string): string => {
  switch (result) {
    case "Baik": return "Good";
    case "Cukup Baik": return "Fair";
    case "Buruk": return "Bad";
    case "No Data": return "No Data";
    case "Mati": return "Mati";
    default: return result;
  }
};

const parseLatencyToSeconds = (latencyString?: string | null): number | null => {
  if (!latencyString || latencyString.toUpperCase() === "NA") return null;
  const value = parseFloat(latencyString);
  if (isNaN(value)) return null;
  if (latencyString.endsWith("d")) return value * 86400;
  if (latencyString.endsWith("m")) return value * 60;
  return value;
};

// Fungsi penentuan kategori warna segitiga (sinkron dengan map)
const getTriangleColorCategory = (station: QCSummary): string => {
  // Semua latency NA atau status Mati = hitam
  const allNA = station.latencyStrings.length === 6 && station.latencyStrings.every(l => l && l.toUpperCase() === "NA");
  if (allNA || station.result === "Mati") return "black";

  // Semua latency >= 1 hari = hitam
  const validLatencies = station.latencyStrings
    .map(parseLatencyToSeconds)
    .filter((v) => v !== null) as number[];
  if (
    validLatencies.length === 6 &&
    validLatencies.every((v) => v >= 86400)
  ) {
    return "black";
  }

  // Kategori warna dari primaryColor
  if (station.primaryColor === "green") return "teal";
  if (station.primaryColor === "yellow") return "yellow";
  if (station.primaryColor === "orange") return "orange";
  if (station.primaryColor === "red") return "red";

  // Abu-abu jika latency terkecil < 1 hari
  if (validLatencies.length > 0 && Math.min(...validLatencies) < 86400) return "gray";

  // Default abu-abu
  return "gray";
};

// Fungsi penentuan warna segitiga (hex)
const getTriangleColor = (station: QCSummary) => {
  const cat = getTriangleColorCategory(station);
  switch (cat) {
    case "black": return "#222";
    case "teal": return "#16a34a";
    case "yellow": return "#facc15";
    case "orange": return "#fb923c";
    case "red": return "#ef4444";
    case "gray": return "#979797";
    default: return "#979797";
  }
};

// Sinkronisasi legend dengan warna segitiga di map
const MapLegend = ({ stationData, totalStationCount }: { stationData: QCSummary[]; totalStationCount: number }) => {
  const countByCategory = {
    "<10s": 0, // teal
    "<1m": 0,  // yellow
    "<3m": 0,  // orange
    "<30m": 0, // red
    "<1d": 0,  // gray
    ">1d/Off": 0, // black
  };

  stationData.forEach((s) => {
    const cat = getTriangleColorCategory(s);
    if (cat === "black") countByCategory[">1d/Off"]++;
    else if (cat === "teal") countByCategory["<10s"]++;
    else if (cat === "yellow") countByCategory["<1m"]++;
    else if (cat === "orange") countByCategory["<3m"]++;
    else if (cat === "red") countByCategory["<30m"]++;
    else if (cat === "gray") countByCategory["<1d"]++;
  });

  const summary = [
    { label: "<10s", color: "bg-teal-500", textColor: "text-teal-600", count: countByCategory["<10s"] },
    { label: "<1m", color: "bg-yellow-400", textColor: "text-yellow-500", count: countByCategory["<1m"] },
    { label: "<3m", color: "bg-orange-400", textColor: "text-orange-500", count: countByCategory["<3m"] },
    { label: "<30m", color: "bg-red-500", textColor: "text-red-600", count: countByCategory["<30m"] },
    { label: "<1d", color: "bg-gray-400", textColor: "text-gray-500", count: countByCategory["<1d"] },
    { label: ">1d/Off", color: "bg-black", textColor: "text-black", count: countByCategory[">1d/Off"] },
  ];

  const maxCount = Math.max(...summary.map((s) => s.count), 1);

  return (
    <div className="absolute bottom-3 left-3 bg-white/70 p-2 rounded-lg shadow w-44" style={{ fontSize: "11px" }}>
      <div className="font-semibold text-gray-800 mb-0.5" style={{ fontSize: "12px" }}>Latency Summary</div>
      <div className="mb-1 text-[10px]">
        <span className="font-bold">Total:</span> {totalStationCount}
      </div>
      <div className="flex flex-col gap-1">
        {summary.map((item) => (
          <div key={item.label} className="grid grid-cols-[2.2rem_1fr_1.5rem] items-center gap-x-1">
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
  <div className="bg-white rounded-xl shadow p-4 min-h-[300px] flex flex-col">
    <h2 className="text-lg font-bold border-b pb-2 mb-4">{title}</h2>
    {/* <div className="flex-grow flex items-center justify-center text-gray-400"> */}
        <div className="flex-grow flex flex-col items-center justify-center w-full">
      {children ? children : <p>Konten untuk {title} akan ditampilkan di sini.</p>}
    </div>
  </div>
);

const AVAILABILITY_COLORS = ["#16a34a", "#facc15", "#fb923c", "#ef4444", "#a3a3a3"];

const getAvailabilityCategory = (value: number | null) => {
  if (value === null) return "No Data";
  if (value >= 97) return ">97%";
  if (value >= 90) return "90-97%";
  if (value > 0) return "1-89%";
  if (value === 0) return "0%";
  return "No Data";
};

const QUALITY_COLORS = ["#16a34a", "#fb923c", "#ef4444", "#a3a3a3"];
const QUALITY_LABELS = [
  { label: "GOOD", color: "#16a34a" },
  { label: "FAIR", color: "#fb923c" },
  { label: "POOR", color: "#ef4444" },
  { label: "NO DATA", color: "#a3a3a3" },
];

const Dashboard = () => {
  const [combinedData, setCombinedData] = useState<QCSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalStationCount, setTotalStationCount] = useState<number>(0);
  const [registeredCount, setRegisteredCount] = useState<number>(0);
  const [inactiveCount, setInactiveCount] = useState<number>(0);
  const [stackedBarData, setStackedBarData] = useState<StackedBarData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
        const [qcResponse, slmonResponse, stasiunResponse] = await Promise.all([
          axiosServer.get<Omit<QCSummary, "latencyStrings" | "primaryLatency" | "primaryColor">[]>(`/api/qc/summary/${yesterday}`),
          axiosServer.get<SlmonFeatureCollection>("/api/dashboard/slmon/laststatus"),
          axiosServer.get<any[]>("/api/stasiun"),
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
          let primaryLatencyValue: number | null = null;
          let primaryColorValue: string = "#979797";

          if (slmonStation) {
            for (let i = 1; i <= 6; i++) {
              const latencyKey = `latency${i}` as keyof typeof slmonStation.properties;
              const latencyValue = slmonStation.properties[latencyKey] || "N/A";
              allLatencyStrings.push(latencyValue);
            }
            const latencyCandidates = [
              { seconds: parseLatencyToSeconds(slmonStation.properties.latency1), color: slmonStation.properties.color1 },
              { seconds: parseLatencyToSeconds(slmonStation.properties.latency2), color: slmonStation.properties.color2 },
              { seconds: parseLatencyToSeconds(slmonStation.properties.latency3), color: slmonStation.properties.color3 },
            ];
            const validLatencies = latencyCandidates.filter((lat) => lat.seconds !== null);
            if (validLatencies.length > 0) {
              const minLatency = validLatencies.reduce((min, current) =>
                current.seconds! < min.seconds! ? current : min
              );
              primaryLatencyValue = minLatency.seconds;
              if (typeof minLatency.color === 'string') {
                primaryColorValue = minLatency.color;
              }
            }
          }

          return {
            ...station,
            latencyStrings: allLatencyStrings,
            primaryLatency: primaryLatencyValue,
            primaryColor: primaryColorValue,
          };
        });

        setCombinedData(finalData);
      } catch (err) {
        console.error("Gagal memuat atau menggabungkan data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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

  const totalOn = combinedData.filter((s) => s.primaryLatency !== null && s.primaryLatency < 86400 && s.result !== "Mati").length;
  const totalOff = combinedData.filter((s) => s.primaryLatency === null || s.primaryLatency >= 86400 || s.result === "Mati").length;
  const goodCount = combinedData.filter((s) => s.result === "Baik").length;
  const fairCount = combinedData.filter((s) => s.result === "Cukup Baik").length;
  const poorCount = combinedData.filter((s) => s.result === "Buruk").length;
  const noDataCount = combinedData.filter((s) => s.result === "No Data" || s.result === "Mati").length;

  const [availabilityPieData, setAvailabilityPieData] = useState<{ name: string; value: number }[]>([]);
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
        const res = await axiosServer.get(`/api/availability`, {
          params: { start_date: yesterday, end_date: yesterday },
        });
        const apiData = res.data?.data || {};
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
        const totalStations = Object.keys(apiData).length;
        const counted = categories[">97%"] + categories["90-97%"] + categories["1-89%"] + categories["0%"];
        categories["No Data"] = totalStations - counted;
        setAvailabilityPieData(
          Object.entries(categories)
            .filter(([_, v]) => v > 0)
            .map(([name, value]) => ({ name, value }))
        );
      } catch (err) {
        setAvailabilityPieData([]);
      }
    };
    fetchAvailability();
  }, []);

  const [qualityPieData, setQualityPieData] = useState<{ name: string; value: number }[]>([]);
  useEffect(() => {
    const fetchQuality = async () => {
      try {
        const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
        const res = await axiosServer.get(`/api/qc/summary/${yesterday}`);
        let good = 0, fair = 0, poor = 0, nodata = 0;
        (res.data || []).forEach((item: any) => {
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
      } catch {
        setQualityPieData([]);
      }
    };
    fetchQuality();
  }, []);

  return (
    <MainLayout>
      <h1 className="text-left text-2xl font-bold mt-0 mb-2 ml-1">Dashboard</h1>
      <div className="flex flex-col lg:flex-row gap-3">
        {/* BAGIAN KIRI: PETA */}
        <div className="lg:w-2/3 w-full">
          <div className="bg-white rounded-lg shadow p-1 h-[395px]">
            <div className="relative w-full h-full px-2 pb-2 pt-1">
              <MapContainer
                center={[-2.5, 118]}
                zoom={5}
                className="w-full h-full rounded-md"
                style={{ minHeight: 375, maxHeight: 393, margin: "0.06rem" }}
              >
                <TileLayer attribution='&copy; <a href="https://osm.org/copyright">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {combinedData.map((s, idx) => (
                  <Marker
                    key={idx}
                    position={[s.geometry.coordinates[1], s.geometry.coordinates[0]]}
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
              <MapLegend stationData={combinedData} totalStationCount={totalStationCount} />
            </div>
          </div>
        </div>

        {/* BAGIAN KANAN: STATUS & STACKED BAR */}
        <div className="lg:w-1/3 w-full flex flex-col gap-2">
          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-200 rounded p-2 text-center">
              <p className="text-xs font-semibold text-gray-600">REGISTERED</p>
              <p className="text-2xl font-bold">{isLoading ? "..." : registeredCount}</p>
            </div>
            <div className="bg-gray-200 rounded p-2 text-center">
              <p className="text-xs font-semibold text-gray-600">INACTIVE</p>
              <p className="text-2xl font-bold">{isLoading ? "..." : inactiveCount}</p>
            </div>
          </div>
          <div className="bg-white rounded p-2 text-center border border-gray-300 shadow">
            <p className="text-xs font-semibold">OPERATIONAL</p>
            <p className="text-3xl font-bold mb-1">{isLoading ? "..." : combinedData.length}</p>
            <div className="grid grid-cols-2 gap-1">
              <div className="bg-green-600 text-white rounded p-1">
                <p className="text-[10px] font-bold">ON</p>
                <p className="text-lg font-bold">{isLoading ? "..." : totalOn}</p>
              </div>
              <div className="bg-black text-white rounded p-1">
                <p className="text-[10px] font-bold">OFF</p>
                <p className="text-lg font-bold">{isLoading ? "..." : totalOff}</p>
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
                <Bar dataKey="ON" stackId="a" fill="#16a34a" name="ON" />
                <Bar dataKey="OFF" stackId="a" fill="#ef4444" name="OFF" />
              </BarChart>
            </RechartsResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- AVAILABILITY & QUALITY CARD & PIECHART --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        {/* Availability Card */}
        <InfoCard title="Availability">
          <div className="w-full flex flex-col items-center justify-center">
            <div className="w-full h-32 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={availabilityPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={40}
                    label
                  >
                    {availabilityPieData.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={AVAILABILITY_COLORS[idx % AVAILABILITY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-x-3 gap-y-1">
              {[
                { label: ">97%", color: "#16a34a" }, { label: "90-97%", color: "#facc15" },
                { label: "1-89%", color: "#fb923c" }, { label: "0%", color: "#ef4444" },
                { label: "No Data", color: "#a3a3a3" },
              ].map((item) => (
                <div key={item.label} className="flex items-center space-x-1 text-[11px]">
                  <span
                    className="inline-block rounded-full"
                    style={{
                      width: "0.65em",
                      height: "0.65em",
                      backgroundColor: item.color,
                      marginRight: "0.25em",
                    }}
                  />
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-[10px] text-gray-500">Data for yesterday's availability</span>
              <Link to="/station-availability" className="text-[10px] text-blue-600 hover:underline">
                Details...
              </Link>
            </div>
          </div>
        </InfoCard>
        {/* Quality Card */}
        <InfoCard title="Quality">
          <div className="w-full flex flex-col items-center justify-center">
            <div className="w-full h-32 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={qualityPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={40}
                    label
                  >
                    {qualityPieData.map((_, idx) => (
                      <Cell key={`cell-q-${idx}`} fill={QUALITY_COLORS[idx % QUALITY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-x-3 gap-y-1">
              {QUALITY_LABELS.map((item) => (
                <div key={item.label} className="flex items-center space-x-1 text-[11px]">
                  <span
                    className="inline-block rounded-full"
                    style={{
                      width: "0.65em",
                      height: "0.65em",
                      backgroundColor: item.color,
                      marginRight: "0.25em",
                    }}
                  />
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-[10px] text-gray-500">Data for yesterday's quality</span>
              <Link to="/station-quality" className="text-[10px] text-blue-600 hover:underline">
                Details...
              </Link>
            </div>
          </div>
        </InfoCard>
        {/* Performance & Metadata Cards */}
        <InfoCard title="Performance" />
        <InfoCard title="Metadata">
          <div className="text-left text-gray-800 w-full text-xs">
            <p className="font-semibold mb-1">Recent updates:</p>
            <ul className="list-disc list-inside">
              <li>MMPI</li>
              <li>MTKI</li>
              <li>SPSI</li>
              <li>JMBI</li>
            </ul>
          </div>
        </InfoCard>
      </div>
    </MainLayout>
  );
};

export default Dashboard;

