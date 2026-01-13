import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import axiosServer from '../utilities/AxiosServer';
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import dayjs from "dayjs";

// Interface untuk data stasiun yang lebih lengkap
interface StationData {
  stasiun_id: number;
  kode_stasiun: string;
  lintang: number;
  bujur: number;
  lokasi: string;
  provinsi: string;
  upt_penanggung_jawab: string;
  jaringan: string;
  prioritas: string;
  // Tambahkan properti lain jika dibutuhkan
}

interface SiteQualityData {
  code: string;
  geology: string;
  vs30: string;
  photovoltaic: string;
  hvsr: number;
  psd: number;
  score: number;
  site_quality: string;
}

// [DIHAPUS] dummyStationInfo tidak diperlukan lagi
// const dummyStationInfo = { ... };

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

const ImageLoader = ({ srcUrl, alt }: { srcUrl: string; alt: string }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setObjectUrl(null);
    let isMounted = true;

    const fetchImage = async () => {
      try {
        const response = await axiosServer.get(srcUrl, {
          responseType: 'blob',
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

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcUrl]);

  if (error) return <div className="text-red-500 text-xs p-2">Gagal memuat gambar.</div>;
  if (loading) return <div className="text-gray-500 text-sm p-2">Memuat gambar...</div>;
  return objectUrl ? <img src={objectUrl} alt={alt} className="w-full h-full object-contain" /> : null;
};

const CHANNELS_FULL = ["SHE", "SHN", "SHZ"];
const CHANNELS_API = ["E", "N", "Z"];

const StationDaily = () => {
  const { stationCode } = useParams<{ stationCode: string }>();
  const navigate = useNavigate();
  const [stationList, setStationList] = useState<string[]>([]);
  const [selectedStation, setSelectedStation] = useState(stationCode || '');
  // [DIUBAH] Menggunakan interface StationData yang lebih lengkap
  const [stationMeta, setStationMeta] = useState<StationData | null>(null);
  const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
  const [selectedDate, setSelectedDate] = useState(yesterday);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [siteQualityData, setSiteQualityData] = useState<SiteQualityData | null>(null);
  const [loadingSiteQuality, setLoadingSiteQuality] = useState(true);

  useEffect(() => {
    axiosServer.get("/api/stasiun").then((res) => {
        const stations: StationData[] = res.data || [];
        const codes = stations.map((s) => s.kode_stasiun);
        setStationList(codes);

        if (!stationCode && codes.length > 0) {
          setSelectedStation(codes[0]);
          navigate(`/station-daily/${codes[0]}`);
        }

        const currentStationCode = stationCode || codes[0];
        const meta = stations.find((s) => s.kode_stasiun === currentStationCode);
        if (meta) setStationMeta(meta);

      }).catch(() => setStationList([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!stationCode) return;
    setSelectedStation(stationCode);

    axiosServer.get("/api/stasiun").then((res) => {
        const stations: StationData[] = res.data || [];
        const meta = stations.find((s) => s.kode_stasiun === stationCode);
        if (meta) setStationMeta(meta);
      });

  }, [stationCode]);
  
  useEffect(() => {
    if (!stationCode) return;
    setLoadingSiteQuality(true);
    axiosServer.get(`/api/qc/site/detail/${stationCode}`)
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setSiteQualityData(res.data[0]);
        } else {
          setSiteQualityData(null);
        }
      })
      .catch((err) => {
        console.error("Gagal mengambil data Site Quality:", err);
        setSiteQualityData(null);
      })
      .finally(() => {
        setLoadingSiteQuality(false);
      });
  }, [stationCode]);

  useEffect(() => {
    if (!selectedStation || !selectedDate) { setTableData([]); return; }
    setLoadingTable(true);
    axiosServer.get(`/api/qc/data/detail/${selectedStation}/${selectedDate}`).then((res) => {
        const rows = CHANNELS_FULL.map((ch) => {
          const rowData = (res.data || []).find((d: any) => d.channel === ch);
          return { channel: ch, ...rowData };
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

  const InfoItem = ({ label, value }: { label: string, value: string | number | null }) => (
    <div className="flex justify-between border-b border-gray-200 py-1 text-xs">
      <dt className="font-medium text-gray-600">{label}</dt>
      <dd className="text-gray-900 font-semibold text-right">{value ?? '-'}</dd>
    </div>
  );
  
  const columns = [
    { accessorKey: "channel", header: "Channel" }, { accessorKey: "rms", header: "RMS" },
    { accessorKey: "amplitude_ratio", header: "Amp. Ratio" }, { accessorKey: "num_gap", header: "Gaps" },
    { accessorKey: "num_overlap", header: "Overlaps" }, { accessorKey: "num_spikes", header: "Spikes" },
    { accessorKey: "linear_dead_channel", header: "Linear Dead" }, { accessorKey: "gsn_dead_channel", header: "GSN Dead" },
    { accessorKey: "sp_percentage", header: "% Short Period" }, { accessorKey: "bw_percentage", header: "% Body Wave" },
    { accessorKey: "lp_percentage", header: "% Long Period" }, { accessorKey: "perc_below_nlnm", header: "% Below NLNM" },
    { accessorKey: "perc_above_nhnm", header: "% Above NHNM" },
  ];
  
  const ChartGridSection = ({ title, children }: { title: string; children: React.ReactNode; }) => (
    <div className="mb-4 bg-white p-2 rounded-lg shadow">
      <h2 className="text-base font-bold mb-2 text-gray-800">{title}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">{children}</div>
    </div>
  );

  const ImagePanel = ({ children }: { children: React.ReactNode; }) => (
    <div className="flex flex-col items-center w-full h-full">
      <div className="w-full h-[180px] flex items-center justify-center bg-gray-50 rounded-md border border-gray-300 shadow">
        {children}
      </div>
    </div>
  );

  const chartsData = CHANNELS_API.flatMap(ch => [
    { type: 'signal', channel: ch },
    { type: 'psd', channel: ch },
  ]);

  const signalCharts = chartsData.filter(c => c.type === "signal");
  const psdCharts = chartsData.filter(c => c.type === "psd");

  const simpleTableColumns = [
    { accessorKey: "channel", header: "Channel" },
    { accessorKey: "rms", header: "RMS" },
    { accessorKey: "amplitude_ratio", header: "Amp. Ratio" },
    { accessorKey: "num_gap", header: "Gaps" },
    { accessorKey: "num_overlap", header: "Overlaps" },
    { accessorKey: "num_spikes", header: "Spikes" },
    { accessorKey: "linear_dead_channel", header: "Linear Dead" },
    { accessorKey: "gsn_dead_channel", header: "GSN Dead" },
    { accessorKey: "sp_percentage", header: "% Short Period" },
    { accessorKey: "bw_percentage", header: "% Body Wave" },
    { accessorKey: "lp_percentage", header: "% Long Period" },
    { accessorKey: "perc_below_nlnm", header: "% Below NLNM" },
    { accessorKey: "perc_above_nhnm", header: "% Above NHNM" },
  ];

  return (
    <MainLayout>
      <div className="p-2 sm:p-3 space-y-4 bg-gray-50 min-h-screen">
        <header className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2">
            <div
              aria-hidden
              className="min-w-[80px] bg-gray-200 text-gray-800 font-bold px-3 py-2 rounded-md text-sm flex items-center justify-center"
            >
              Station
            </div>

            <div className="relative">
              <select
                value={selectedStation}
                onChange={handleStationChange}
                className="appearance-none min-w-[120px] border border-gray-300 rounded px-3 pr-10 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {stationList.map((station) => (
                  <option key={station} value={station}>
                    {station}
                  </option>
                ))}
              </select>

              <div className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
                <span className="w-px h-6 bg-gray-200 mr-2" />
                <svg
                  className="w-4 h-4 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* {!loadingSiteQuality && siteQualityData && (
              <div className={
                `min-w-[90px] rounded px-3 py-2 text-sm font-semibold flex items-center justify-center ` +
                (siteQualityData.site_quality === 'Very Good' || siteQualityData.site_quality === 'Good'
                  ? 'bg-green-100 text-green-800'
                  : siteQualityData.site_quality === 'Fair'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800')
              }>
                {siteQualityData.site_quality}
              </div>
            )} */}

            {!loadingSiteQuality && siteQualityData && (
              <div className={
                `min-w-[90px] rounded px-3 py-2 text-sm font-semibold flex items-center justify-center ` +
                (siteQualityData.site_quality === 'Very Good' || siteQualityData.site_quality === 'Good'
                  ? 'bg-green-100 text-green-800'
                  : siteQualityData.site_quality === 'Fair'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800')
              }>
                {siteQualityData.site_quality}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end">
            <div className="flex space-x-1 rounded bg-gray-200 p-0.5">
              <button className="px-2 py-0.5 rounded text-xs font-medium bg-white shadow text-blue-600">Daily</button>
              <Link to={`/station/${selectedStation}`} className="px-2 py-0.5 rounded text-xs font-medium text-gray-700 hover:bg-gray-300">Time Series</Link>
            </div>
            <div className="mt-1">
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded border-none focus:ring-2 focus:ring-blue-500"/>
            </div>
          </div>
        </header>
        <main className="grid grid-cols-1 lg:grid-cols-7 gap-2">
          <div className="bg-white p-2 rounded-lg shadow-md space-y-4 lg:col-span-3 ml-2">
            {/* Station Information */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-sm font-bold text-gray-800">Station Information</h2>
              </div>
              <table className="w-full border border-gray-300 text-xs">
                <tbody>
                  <tr>
                    <td className="px-2 py-1 font-medium bg-gray-50 border-r border-gray-300 w-1/2">Station Code</td>
                    <td className="px-2 py-1">{stationMeta?.kode_stasiun ?? '-'}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1 font-medium bg-gray-50 border-r border-gray-300">Group</td>
                    <td className="px-2 py-1">{stationMeta?.jaringan ?? '-'}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1 font-medium bg-gray-50 border-r border-gray-300">Priority</td>
                    <td className="px-2 py-1">{stationMeta?.prioritas ?? '-'}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1 font-medium bg-gray-50 border-r border-gray-300">Location</td>
                    <td className="px-2 py-1">{stationMeta?.lokasi ?? '-'}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1 font-medium bg-gray-50 border-r border-gray-300">Province</td>
                    <td className="px-2 py-1">{stationMeta?.provinsi ?? '-'}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1 font-medium bg-gray-50 border-r border-gray-300">UPT</td>
                    <td className="px-2 py-1">{stationMeta?.upt_penanggung_jawab ?? '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Site Quality Analysis */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-sm font-bold text-gray-800">Site Quality Analysis</h2>
              </div>
              <table className="w-full border border-gray-300 text-xs">
                <tbody>
                  <tr>
                    <td className="px-2 py-1 font-medium bg-gray-50 border-r border-gray-300 w-1/2">Score</td>
                    <td className="px-2 py-1">{siteQualityData?.score ?? '-'}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1 font-medium bg-gray-50 border-r border-gray-300">Geology</td>
                    <td className="px-2 py-1">{siteQualityData?.geology ?? '-'}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1 font-medium bg-gray-50 border-r border-gray-300">VS30</td>
                    <td className="px-2 py-1">{siteQualityData?.vs30 ?? '-'}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1 font-medium bg-gray-50 border-r border-gray-300">Photovoltaic</td>
                    <td className="px-2 py-1">{siteQualityData?.photovoltaic ?? '-'}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1 font-medium bg-gray-50 border-r border-gray-300">HVSR</td>
                    <td className="px-2 py-1">{siteQualityData?.hvsr ?? '-'}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1 font-medium bg-gray-50 border-r border-gray-300">PSD</td>
                    <td className="px-2 py-1">{siteQualityData?.psd ?? '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {/* Map diperkecil */}
          <div className="bg-white p-2 rounded-lg shadow-md lg:col-span-4 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-bold text-gray-800">Station Location Map</h2>
            </div>
            <div className="w-full h-full rounded min-h-[180px] flex-1">
              {stationMeta && stationMeta.lintang && stationMeta.bujur ? (
                <MapContainer
                  center={[stationMeta.lintang, stationMeta.bujur]}
                  zoom={16}
                  className="w-full h-[180px] rounded"
                  style={{ minHeight: 180, height: "100%" }}
                >
                  <ResetMapView center={[stationMeta.lintang, stationMeta.bujur]} zoom={16} />
                  <TileLayer attribution='&copy; <a href="https://osm.org/copyright">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                  <Marker position={[stationMeta.lintang, stationMeta.bujur]} icon={triangleIcon(getColorByResult(null))}>
                    <Popup><b>Stasiun: {stationMeta.kode_stasiun}</b></Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div className="w-full h-[180px] bg-gray-200 flex items-center justify-center rounded">
                  <p className="text-gray-500 text-xs">[Peta tidak tersedia]</p>
                </div>
              )}
            </div>
          </div>
        </main>

        <ChartGridSection title="Signal images">
          {signalCharts.map((chart) => {
            const imageUrlPath = `/api/qc/data/signal/${selectedDate}/${selectedStation}/${chart.channel}`;
            return (
              <ImagePanel key={`${chart.type}-${chart.channel}`}>
                {selectedStation && selectedDate ? (
                  <ImageLoader srcUrl={imageUrlPath} alt={`Signal for ${selectedStation} on ${selectedDate} channel ${chart.channel}`} />
                ) : (<p className="text-gray-400 text-xs">Pilih stasiun dan tanggal.</p>)}
              </ImagePanel>
            );
          })}
        </ChartGridSection>

        <ChartGridSection title="PSD Images">
          {psdCharts.map((chart) => {
            const imageUrlPath = `/api/qc/data/psd/${selectedDate}/${selectedStation}/${chart.channel}`;
            return (
              <ImagePanel key={`${chart.type}-${chart.channel}`}>
                {selectedStation && selectedDate ? (
                  <ImageLoader srcUrl={imageUrlPath} alt={`PSD for ${selectedStation} on ${selectedDate} channel ${chart.channel}`} />
                ) : (<p className="text-gray-400 text-xs">Pilih stasiun dan tanggal.</p>)}
              </ImagePanel>
            );
          })}
        </ChartGridSection>

        <section className="bg-white p-2 rounded-lg shadow overflow-x-auto">
          <h2 className="text-base font-bold mb-2 text-gray-800">Channel Details</h2>
          {loadingTable ? (
            <div className="text-center text-gray-500 py-4 text-sm">Memuat data...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 text-center table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    {simpleTableColumns.map((col) => (
                      <th
                        key={col.accessorKey}
                        className="border border-gray-300 p-2 text-sm font-semibold"
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData && tableData.length > 0 ? (
                    tableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        {simpleTableColumns.map((col) => (
                          <td key={col.accessorKey} className="border border-gray-300 p-2 text-sm">
                            {row && row[col.accessorKey] !== undefined && row[col.accessorKey] !== null
                              ? row[col.accessorKey]
                              : "-"}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={simpleTableColumns.length} className="text-center p-4 text-gray-500 text-sm">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default StationDaily;