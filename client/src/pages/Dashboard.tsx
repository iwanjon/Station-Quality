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
    case "Baik":
      return "Good";
    case "Cukup Baik":
      return "Fair";
    case "Buruk":
      return "Bad";
    case "No Data":
      return "No Data";
    case "Mati":
      return "Mati";
    default:
      return result;
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

const MapLegend = ({ stationData, totalStationCount }: { stationData: QCSummary[]; totalStationCount: number }) => {
  const summary = [
    { label: "<10s", color: "bg-teal-500", textColor: "text-teal-600", count: stationData.filter((s) => s.result !== "Mati" && s.primaryLatency !== null && s.primaryLatency < 10).length },
    { label: "<1m", color: "bg-yellow-400", textColor: "text-yellow-500", count: stationData.filter((s) => s.result !== "Mati" && s.primaryLatency !== null && s.primaryLatency >= 10 && s.primaryLatency < 60).length },
    { label: "<3m", color: "bg-orange-400", textColor: "text-orange-500", count: stationData.filter((s) => s.result !== "Mati" && s.primaryLatency !== null && s.primaryLatency >= 60 && s.primaryLatency < 180).length },
    { label: "<30m", color: "bg-red-500", textColor: "text-red-600", count: stationData.filter((s) => s.result !== "Mati" && s.primaryLatency !== null && s.primaryLatency >= 180 && s.primaryLatency < 1800).length },
    { label: "<1d", color: "bg-gray-400", textColor: "text-gray-500", count: stationData.filter((s) => s.result !== "Mati" && s.primaryLatency !== null && s.primaryLatency >= 1800 && s.primaryLatency < 86400).length },
    { label: ">1d/Off", color: "bg-gray-700", textColor: "text-gray-800", count: stationData.filter((s) => s.result === "Mati" || s.primaryLatency === null || s.primaryLatency >= 86400).length },
  ];

  const maxCount = Math.max(...summary.map((s) => s.count), 1);

  return (
    <div className="absolute bottom-5 left-5 bg-white/50 p-4 rounded-xl shadow-lg w-64 ">
      <div className="font-semibold text-gray-800 text-base mb-1">Latency Summary</div>
      <div className="mb-3 text-sm">
        <span className="font-bold">Total:</span> {totalStationCount}
      </div>
      <div className="flex flex-col gap-2.5">
        {summary.map((item) => (
          <div key={item.label} className="grid grid-cols-[3rem_1fr_2rem] items-center gap-x-2">
            <span className="text-xs text-gray-600 font-medium">{item.label}</span>
            <div className={`${item.color} h-3.5 rounded-sm`} style={{ width: `${(item.count / maxCount) * 100}%`, minWidth: item.count > 0 ? "4px" : "0", transition: "width 0.3s ease-in-out" }}></div>
            <span className={`text-sm font-bold justify-self-start ${item.textColor}`}>{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const InfoCard = ({ title, children }: { title: string; children?: React.ReactNode }) => (
  <div className="bg-white rounded-xl shadow p-4 min-h-[300px] flex flex-col">
    <h2 className="text-lg font-bold border-b pb-2 mb-4">{title}</h2>
    <div className="flex-grow flex items-center justify-center text-gray-400">
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

// Dummy data untuk 7 hari terakhir (mulai dari kemarin, urut mundur)
const getLast7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    days.push(dayjs().subtract(i + 1, "day").format("YYYY-MM-DD"));
  }
  return days;
};

const dummyStackedBarData = getLast7Days().map((date, idx) => ({
  date,
  ON: Math.floor(400 + Math.random() * 100),   // Dummy: 400-500 ON
  OFF: Math.floor(50 + Math.random() * 50),    // Dummy: 50-100 OFF
}));

const Dashboard = () => {
  const [combinedData, setCombinedData] = useState<QCSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalStationCount, setTotalStationCount] = useState<number>(0);
  const [registeredCount, setRegisteredCount] = useState<number>(0);
  const [inactiveCount, setInactiveCount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
        // Fetch QC summary & slmon & stasiun metadata
        const [qcResponse, slmonResponse, stasiunResponse] = await Promise.all([
          axiosServer.get<Omit<QCSummary, "latencyStrings" | "primaryLatency" | "primaryColor">[]>(`/api/qc/summary/${yesterday}`),
          axiosServer.get<SlmonFeatureCollection>("/api/dashboard/slmon/laststatus"),
          axiosServer.get<any[]>("/api/stasiun"),
        ]);

        // Hitung total stasiun dari slmon (jumlah features)
        setTotalStationCount(slmonResponse.data.features.length);

        // Hitung registered & inactive dari /api/stasiun
        const stasiunData = stasiunResponse.data || [];
        setRegisteredCount(stasiunData.filter((s) => s.status === "aktif").length);
        setInactiveCount(stasiunData.filter((s) => s.status === "nonaktif").length);

        // ...existing logic for combinedData...
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
              {
                seconds: parseLatencyToSeconds(slmonStation.properties.latency1),
                color: slmonStation.properties.color1,
              },
              {
                seconds: parseLatencyToSeconds(slmonStation.properties.latency2),
                color: slmonStation.properties.color2,
              },
              {
                seconds: parseLatencyToSeconds(slmonStation.properties.latency3),
                color: slmonStation.properties.color3,
              },
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

  // Hitung ON/OFF berdasarkan latensi
  const totalOn = combinedData.filter(
    (s) => s.primaryLatency !== null && s.primaryLatency < 86400 && s.result !== "Mati"
  ).length;
  const totalOff = combinedData.filter(
    (s) => s.primaryLatency === null || s.primaryLatency >= 86400 || s.result === "Mati"
  ).length;

  // Kalkulasi panel status tidak diubah
  const goodCount = combinedData.filter((s) => s.result === "Baik").length;
  const fairCount = combinedData.filter((s) => s.result === "Cukup Baik").length;
  const poorCount = combinedData.filter((s) => s.result === "Buruk").length;
  const noDataCount = combinedData.filter(
    (s) => s.result === "No Data" || s.result === "Mati"
  ).length;

  // --- AVAILABILITY PIECHART LOGIC ---
  const [availabilityPieData, setAvailabilityPieData] = useState<
    { name: string; value: number }[]
  >([]);

  useEffect(() => {
    // Fetch availability data for yesterday
    const fetchAvailability = async () => {
      try {
        const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
        const res = await axiosServer.get(`/api/availability`, {
          params: { start_date: yesterday, end_date: yesterday },
        });
        // Data shape: { data: { [stationCode]: [{ timestamp, availability }] }, ... }
        const apiData = res.data?.data || {};
        const allAvail: number[] = [];
        Object.values(apiData).forEach((arr: any) => {
          if (Array.isArray(arr) && arr.length > 0) {
            // Ambil data availability hari kemarin (ambil satu saja)
            const avail = arr[0]?.availability;
            if (typeof avail === "number") allAvail.push(avail);
          }
        });
        // Kategorikan
        const categories = {
          ">97%": 0,
          "90-97%": 0,
          "1-89%": 0,
          "0%": 0,
          "No Data": 0,
        };
        allAvail.forEach((val) => {
          const cat = getAvailabilityCategory(val);
          categories[cat] = (categories[cat] || 0) + 1;
        });
        // Hitung yang tidak ada datanya
        const totalStations = Object.keys(apiData).length;
        const counted = categories[">97%"] + categories["90-97%"] + categories["1-89%"] + categories["0%"];
        categories["No Data"] = totalStations - counted;
        // Siapkan data untuk PieChart
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

  // --- QUALITY PIECHART LOGIC ---
  const [qualityPieData, setQualityPieData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    // Fetch QC summary for yesterday
    const fetchQuality = async () => {
      try {
        const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
        const res = await axiosServer.get(`/api/qc/summary/${yesterday}`);
        // Kategorikan
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
      <h1 className="text-left text-3xl font-bold mt-0 mb-4 ml-2">Dashboard</h1>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* BAGIAN KIRI: PETA */}
        <div className="lg:w-2/3 w-full">
          <div className="bg-white rounded-xl shadow p-2 h-[600px]">
            <div className="relative w-full h-full">
              <MapContainer center={[-2.5, 118]} zoom={5} className="w-full h-full rounded-lg">
                <TileLayer attribution='&copy; <a href="https://osm.org/copyright">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {combinedData.map((s, idx) => (
                  <Marker key={idx} position={[s.geometry.coordinates[1], s.geometry.coordinates[0]]} icon={triangleIcon(s.primaryColor)}>
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
        <div className="lg:w-1/3 w-full flex flex-col gap-4">
          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm font-semibold text-gray-600">REGISTERED</p>
              <p className="text-4xl font-bold">{isLoading ? "..." : registeredCount}</p>
            </div>
            <div className="bg-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm font-semibold text-gray-600">INACTIVE</p>
              <p className="text-4xl font-bold">{isLoading ? "..." : inactiveCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border-2 border-gray-300 shadow-lg">
            <p className="text-sm font-semibold">OPERATIONAL</p>
            <p className="text-5xl font-bold mb-2"> {isLoading ? "..." : combinedData.length} </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-600 text-white rounded p-2">
                <p className="text-xs font-bold">ON</p>
                <p className="text-2xl font-bold"> {isLoading ? "..." : totalOn} </p>
              </div>
              <div className="bg-black text-white rounded p-2">
                <p className="text-xs font-bold">OFF</p>
                <p className="text-2xl font-bold"> {isLoading ? "..." : totalOff} </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-white text-xs font-bold">
            <div className="bg-green-500 rounded p-2">
              <p>GOOD</p>
              <p className="text-xl">{goodCount}</p>
            </div>
            <div className="bg-orange-400 rounded p-2">
              <p>FAIR</p>
              <p className="text-xl">{fairCount}</p>
            </div>
            <div className="bg-red-600 rounded p-2">
              <p>POOR</p>
              <p className="text-xl">{poorCount}</p>
            </div>
            <div className="bg-gray-400 rounded p-2">
              <p>NO DATA</p>
              <p className="text-xl">{noDataCount}</p>
            </div>
          </div>
            {/* STACKED BAR CHART: ON/OFF 7 HARI */}
            <div
              className="bg-white rounded-xl p-4 mt-2 flex flex-col items-center border border-gray-300 shadow-md"
              style={{
                minHeight: 180,
                maxHeight: 220,
                height: 215, // Lebih kecil dari tinggi map (600px)
              }}
            >
              <h2 className="text-base font-bold mb-2 text-gray-700">
                Stasiun ON/OFF 7 Hari Terakhir
              </h2>
              <RechartsResponsiveContainer width="100%" height={120}>
                <BarChart
                  data={dummyStackedBarData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Legend verticalAlign="top" height={30} />
                  <Bar dataKey="ON" stackId="a" fill="#16a34a" name="ON" />
                  <Bar dataKey="OFF" stackId="a" fill="#ef4444" name="OFF" />
                </BarChart>
              </RechartsResponsiveContainer>
            </div>
        </div>
      </div>

      {/* --- AVAILABILITY & QUALITY CARD & PIECHART --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {/* Availability Card */}
        <InfoCard title="Availability">
          <div className="w-full flex flex-col items-center">
            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={availabilityPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
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
                {
                  label: ">97%",
                  color: "#16a34a",
                },
                {
                  label: "90-97%",
                  color: "#facc15",
                },
                {
                  label: "1-89%",
                  color: "#fb923c",
                },
                {
                  label: "0%",
                  color: "#ef4444",
                },
                {
                  label: "No Data",
                  color: "#a3a3a3",
                },
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
            <div className="mt-2 text-[10px] text-gray-500">
              Data for yesterday's availability
            </div>
          </div>
          <Link to="/station-availability" className="text-sm text-blue-600 hover:underline mt-auto text-right block">
            Details...
          </Link> 
        </InfoCard>

        {/* Quality Card */}
        <InfoCard title="Quality">
          <div className="w-full flex flex-col items-center">
            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={qualityPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
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
            <div className="mt-2 text-[10px] text-gray-500">
              Data for yesterday's quality
            </div>
          </div>
          <Link to="/station-quality" className="text-sm text-blue-600 hover:underline mt-auto text-right block">
            Details...
          </Link>
        </InfoCard>

        {/* Performance & Metadata Cards */}
        <InfoCard title="Performance" />
        <InfoCard title="Metadata">
          <div className="text-left text-gray-800 w-full text-sm">
            <p className="font-semibold mb-2">Recent updates:</p>
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