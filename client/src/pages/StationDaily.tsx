import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import axiosServer from '../utilities/AxiosServer';
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import DataTable from "../components/DataTable";
import dayjs from "dayjs";
import { Fragment } from "react";

// --- [DUMMY DATA & ICONS TIDAK BERUBAH] ---
const dummyStationInfo = {
  'Station Code': 'AAFM', 'Group': 'MR2020', 'Priority': 'P2', 'Location': 'Alor Selatan, Alor',
  'Province': 'Nusa Tenggara Timur', 'UPT': 'Stageof-Alor',
};
const dummySiteQualityInfo = {
  'Score': '90', 'Geology': 'Batuan/Sedimen Tua', 'VS30': 'Periode Tersier',
  'Photovoltaic': 'Keras', 'HVSR': '0.52', 'PSD': '96.35',
};
const triangleIcon = (color: string) => L.divIcon({
    className: "", html: `<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:12px solid ${color};position:relative;"><div style="position:absolute;left:-7px;top:-1px;width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:14px solid #222;z-index:-1;"></div></div>`,
    iconSize: [14, 14], iconAnchor: [7, 14],
});
const getColorByResult = (result: string | null) => "#14b8a6";

function ResetMapView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom]);
  return null;
}

// ==============================================================================
// [DIUBAH] Komponen ImageLoader sekarang menggunakan Axios untuk mengambil gambar
// ==============================================================================
const ImageLoader = ({ srcUrl, alt }: { srcUrl: string; alt: string }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    // Reset state saat URL berubah
    setLoading(true);
    setError(false);
    setObjectUrl(null);

    let isMounted = true;

    const fetchImage = async () => {
      try {
        const response = await axiosServer.get(srcUrl, {
          responseType: 'blob', // Minta data sebagai blob
        });
        
        if (isMounted) {
          const url = URL.createObjectURL(response.data);
          setObjectUrl(url);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Gagal fetch gambar:", err);
          setError(true);
          setLoading(false);
        }
      }
    };

    if (srcUrl) {
      fetchImage();
    }

    // Fungsi cleanup untuk mencegah memory leak
    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcUrl]);

  if (error) {
    return <div className="text-red-500 text-xs p-2">Gagal memuat gambar.</div>;
  }

  if (loading) {
    return <div className="text-gray-500 text-sm p-2">Memuat gambar...</div>;
  }

  return objectUrl ? <img src={objectUrl} alt={alt} className="w-full h-full object-contain" /> : null;
};
// ==============================================================================


const CHANNELS_FULL = ["SHE", "SHN", "SHZ"];
const CHANNELS_API = ["E", "N", "Z"];

const StationDaily = () => {
  // --- [BAGIAN LOGIKA & STATE TIDAK BERUBAH] ---
  const { stationCode } = useParams<{ stationCode: string }>();
  const navigate = useNavigate();
  const [stationList, setStationList] = useState<string[]>([]);
  const [selectedStation, setSelectedStation] = useState(stationCode || '');
  const [stationMeta, setStationMeta] = useState<{ lintang: number, bujur: number, kode_stasiun: string } | null>(null);
  const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
  const [selectedDate, setSelectedDate] = useState(yesterday);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);

  useEffect(() => {
    axiosServer.get("/api/stasiun").then((res) => {
        const codes = (res.data || []).map((s: any) => s.kode_stasiun);
        setStationList(codes);
        if (!stationCode && codes.length > 0) {
          setSelectedStation(codes[0]);
          navigate(`/station-daily/${codes[0]}`);
        }
        const meta = (res.data || []).find((s: any) => s.kode_stasiun === (stationCode || codes[0]));
        if (meta) setStationMeta(meta);
      }).catch(() => setStationList([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!stationCode) return;
    setSelectedStation(stationCode);
    axiosServer.get("/api/stasiun").then((res) => {
        const meta = (res.data || []).find((s: any) => s.kode_stasiun === stationCode);
        if (meta) setStationMeta(meta);
      });
  }, [stationCode]);
  
  useEffect(() => {
    if (!selectedStation || !selectedDate) { setTableData([]); return; }
    setLoadingTable(true);
    axiosServer.get(`/api/qc/data/detail/${selectedStation}/${selectedDate}`).then((res) => {
        const rows = CHANNELS_FULL.map((ch) => {
          const row = (res.data || []).find((d: any) => d.channel === ch);
          return { channel: ch, rms: row?.rms ?? "", ampRatio: row?.amplitude_ratio ?? "", gaps: row?.num_gap ?? "",
            overlaps: row?.num_overlap ?? "", spikes: row?.num_spikes ?? "", linearDead: row?.linear_dead_channel ?? "",
            gsnDead: row?.gsn_dead_channel ?? "", shortPeriod: row?.sp_percentage ?? "", bodyWave: row?.bw_percentage ?? "",
            longPeriod: row?.lp_percentage ?? "", belowNlnm: row?.perc_below_nlnm ?? "", aboveNhnm: row?.perc_above_nhnm ?? "",
          };
        });
        setTableData(rows);
      }).catch(() => setTableData([])).finally(() => setLoadingTable(false));
  }, [selectedStation, selectedDate]);
  
  useEffect(() => { setSelectedDate(yesterday); }, [selectedStation]);

  const handleStationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newStationCode = event.target.value;
    if (newStationCode !== stationCode) {
      navigate(`/station-daily/${newStationCode}`);
    }
  };

  const InfoItem = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex justify-between border-b border-gray-200 py-2 text-sm">
      <dt className="font-medium text-gray-600">{label}</dt>
      <dd className="text-gray-900 font-semibold text-right">{value}</dd>
    </div>
  );
  
  const columns = [
    { accessorKey: "channel", header: "Channel" }, { accessorKey: "rms", header: "RMS" },
    { accessorKey: "ampRatio", header: "Amp. Ratio" }, { accessorKey: "gaps", header: "Gaps" },
    { accessorKey: "overlaps", header: "Overlaps" }, { accessorKey: "spikes", header: "Spikes" },
    { accessorKey: "linearDead", header: "Linear Dead" }, { accessorKey: "gsnDead", header: "GSN Dead" },
    { accessorKey: "shortPeriod", header: "% Short Period" }, { accessorKey: "bodyWave", header: "% Body Wave" },
    { accessorKey: "longPeriod", header: "% Long Period" }, { accessorKey: "belowNlnm", header: "% Below NLNM" },
    { accessorKey: "aboveNhnm", header: "% Above NHNM" },
  ];
  
  // Komponen grid section tanpa card luar, agar gambar lebih besar dan sejajar
  const ChartGridSection = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{children}</div>
    </div>
  );

  // Komponen gambar dengan border abutipis transparan dan efek bayangan
  const ImagePanel = ({
    children,
  }: {
    children: React.ReactNode;
  }) => (
    <div className="flex flex-col items-center w-full h-full">
      <div className="w-full h-[320px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-400/30 shadow-lg shadow-gray-400/20" style={{ borderWidth: 1, borderStyle: "solid" }}>
        {children}
      </div>
    </div>
  );

  // Data untuk chart image (signal & psd per channel)
  const chartsData = [
    ...CHANNELS_API.map(ch => ({ type: 'signal', channel: ch, title: 'Signal' })),
    ...CHANNELS_API.map(ch => ({ type: 'psd', channel: ch, title: 'PSD' })),
  ];

  // Bagi menjadi 2 grid: Signal dan PSD
  const signalCharts = chartsData.filter(c => c.type === "signal");
  const psdCharts = chartsData.filter(c => c.type === "psd");

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-8 bg-gray-50 min-h-screen">
        {/* --- [HEADER & KONTEN UTAMA TIDAK BERUBAH] --- */}
        <header className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <a href="#" className="bg-gray-200 text-gray-800 font-bold px-4 py-2 rounded-lg hover:bg-gray-300">Station</a>
            <select value={selectedStation} onChange={handleStationChange} className="p-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-lg font-bold">
              {stationList.map((station) => (<option key={station} value={station}>{station}</option>))}
            </select>
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-md font-semibold">Good</div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex space-x-1 rounded-lg bg-gray-200 p-1">
              <button className="px-4 py-1 rounded-md text-sm font-medium bg-white shadow text-blue-600">Daily</button>
              <Link to={`/station/${selectedStation}`} className="px-4 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-300">Time Series</Link>
            </div>
            <div className="mt-2">
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-lg border-none focus:ring-2 focus:ring-blue-500"/>
            </div>
          </div>
        </header>
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
            <div><dl>{Object.entries(dummyStationInfo).map(([key, value]) => (<InfoItem key={key} label={key} value={value} />))}</dl></div>
            <hr className="my-4"/>
            <div><h2 className="text-lg font-bold mb-2 text-gray-800">Site Quality Analysis</h2><dl>{Object.entries(dummySiteQualityInfo).map(([key, value]) => (<InfoItem key={key} label={key} value={value} />))}</dl></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-md lg:col-span-2">
            <div className="w-full h-full rounded-lg min-h-[500px]">
              {stationMeta && stationMeta.lintang && stationMeta.bujur ? (
                <MapContainer center={[stationMeta.lintang, stationMeta.bujur]} zoom={16} className="w-full h-[500px] rounded-lg" scrollWheelZoom={true} dragging={true} doubleClickZoom={true} zoomControl={true} style={{ minHeight: 500, height: 500 }}>
                  <ResetMapView center={[stationMeta.lintang, stationMeta.bujur]} zoom={16} />
                  <TileLayer attribution='&copy; <a href="https://osm.org/copyright">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                  <Marker position={[stationMeta.lintang, stationMeta.bujur]} icon={triangleIcon(getColorByResult(null))}><Popup><b>Stasiun: {stationMeta.kode_stasiun}</b></Popup></Marker>
                </MapContainer>
              ) : (<div className="w-full h-[500px] bg-gray-200 flex items-center justify-center rounded-lg"><p className="text-gray-500">[Peta tidak tersedia]</p></div>)}
            </div>
          </div>
        </main>

        {/* --- [GAMBAR GRAFIK] --- */}
        <ChartGridSection title="Signal images">
          {signalCharts.map((chart) => {
            const imageUrlPath = `/api/qc/data/${chart.type}/${selectedDate}/${selectedStation}/${chart.channel}`;
            return (
              <ImagePanel key={chart.channel}>
                {selectedStation && selectedDate ? (
                  <ImageLoader
                    srcUrl={imageUrlPath}
                    alt={`Signal for ${selectedStation} on ${selectedDate} channel ${chart.channel}`}
                  />
                ) : (
                  <p className="text-gray-400">Pilih stasiun dan tanggal.</p>
                )}
              </ImagePanel>
            );
          })}
        </ChartGridSection>

        <ChartGridSection title="PSD Images">
          {psdCharts.map((chart) => {
            const imageUrlPath = `/api/qc/data/${chart.type}/${selectedDate}/${selectedStation}/${chart.channel}`;
            return (
              <ImagePanel key={chart.channel}>
                {selectedStation && selectedDate ? (
                  <ImageLoader
                    srcUrl={imageUrlPath}
                    alt={`PSD for ${selectedStation} on ${selectedDate} channel ${chart.channel}`}
                  />
                ) : (
                  <p className="text-gray-400">Pilih stasiun dan tanggal.</p>
                )}
              </ImagePanel>
            );
          })}
        </ChartGridSection>

        {/* --- [TABEL DATA CHANNEL] --- */}
        <section className="bg-white p-6 rounded-2xl shadow-md overflow-x-auto">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Channel Details</h2>
          {loadingTable ? (
            <div className="text-center text-gray-500 py-8">Memuat data...</div>
          ) : (
            <DataTable columns={columns} data={tableData} />
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default StationDaily;