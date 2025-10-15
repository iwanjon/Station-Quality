import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import axiosServer from "../utilities/AxiosServer";

const PerformanceDetail: React.FC = () => {
  const { stationCode } = useParams<{ stationCode: string }>();
  const navigate = useNavigate();

  const [stationList, setStationList] = useState<string[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | undefined>(stationCode);
  
  // 1. TAMBAHKAN STATE UNTUK LOADING TRANSI ISI
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    axiosServer
      .get("/api/stasiun")
      .then((res) => {
        if (!mounted) return;
        const codes = (res.data || []).map((s: any) => s.kode_stasiun);
        setStationList(codes);
        
        if (!stationCode && codes.length > 0) {
          navigate(`/performance-detail/${codes[0]}`, { replace: true });
        }
      })
      .catch(() => {
        if (!mounted) setStationList([]);
      });
    return () => { mounted = false; };
  }, [navigate, stationCode]);

  useEffect(() => {
    if (stationCode) {
      setSelectedStation(stationCode);
      // 3. SET LOADING KE FALSE SETELAH stationCode BARU DITERIMA
      setIsTransitioning(false);
    }
  }, [stationCode]);

  const modules = useMemo(
    () =>
      (import.meta as any).glob('../assets/plot/*/*.png', { eager: true }) as Record<string, any>,
    []
  );

  const plotsIndex = useMemo(() => {
    const idx: Record<string, string> = {};
    Object.entries(modules).forEach(([path, mod]) => {
      const url = (mod && mod.default) || mod;
      const parts = path.split('/');
      const folder = parts[parts.length - 2];
      const filename = parts[parts.length - 1];
      const code = filename.split('_')[0].toUpperCase();
      idx[`${code}_${folder}`] = url;
    });
    console.debug('plotsIndex loaded', Object.keys(idx).length, 'images found.');
    return idx;
  }, [modules]);

  const plotSpecs = [
    { folder: 'mean_resP_map', title: 'Mean resP amp' },
    { folder: 'resP_azi', title: 'resP azimuth' },
    { folder: 'resP_date', title: 'resP date' },
    { folder: 'resP_distance', title: 'resP distance' },
    { folder: 'resS_azi', title: 'resS azimuth' },
    { folder: 'resS_date', title: 'resS date' },
    { folder: 'resS_distance', title: 'resS distance' },
    { folder: 'SP_dt', title: 'SP dt' },
  ];
  
  const getPlotUrl = (codeRaw: string | undefined, folder: string) => {
    if (!codeRaw) return null;
    const code = String(codeRaw).toUpperCase().trim();
    return plotsIndex[`${code}_${folder}`] ?? null;
  };

  return (
    <MainLayout>
      <div className="p-3 bg-gray-50 min-h-screen">
        <div className="flex items-start mb-3">
          <div className="flex items-center space-x-3">
            <div
              aria-hidden
              className="min-w-[90px] bg-gray-200 text-gray-800 font-bold px-3 py-2 rounded-md text-sm flex items-center justify-center"
            >
              Station
            </div>

            <div className="relative">
              <select
                value={selectedStation ?? ""}
                onChange={(e) => {
                  const newStationCode = e.target.value;
                  // 2. SET LOADING KE TRUE SAAT USER MEMILIH STASIUN BARU
                  setIsTransitioning(true);
                  if (newStationCode) navigate(`/performance-detail/${newStationCode}`);
                }}
                className="appearance-none min-w-[160px] border border-gray-300 rounded px-3 pr-10 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {stationList.length === 0 && <option value="">Loading...</option>}
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
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          {/* Arrange images in rows: 3 - 3 - 2 for slightly larger tiles */}
          {(() => {
            const row1 = plotSpecs.slice(0, 3);
            const row2 = plotSpecs.slice(3, 6);
            const row3 = plotSpecs.slice(6, 8);

            const renderTile = (spec: { folder: string; title: string }) => {
              const codeForLookup = selectedStation || stationCode;
              const src = getPlotUrl(codeForLookup, spec.folder);
              return (
                <div key={spec.folder} className="flex flex-col items-stretch gap-2">
                  <div className="text-sm font-semibold text-gray-700 text-center">{spec.title}</div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-200 flex items-center justify-center h-56">
                    {isTransitioning ? (
                      <div className="text-xs text-gray-500">Memuat Gambar...</div>
                    ) : src ? (
                      <img src={src} alt={`${codeForLookup} ${spec.title}`} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="text-xs text-gray-400">Gambar tidak ditemukan</div>
                    )}
                  </div>
                </div>
              );
            };

            return (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {row1.map(renderTile)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {row2.map(renderTile)}
                </div>

                {/* Last row: use same 3-column grid so tiles keep same size and align left.
                    Add empty filler cells so layout doesn't center the two items. */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {row3.map(renderTile)}
                  {Array.from({ length: 3 - row3.length }).map((_, i) => (
                    <div key={`filler-${i}`} className="h-56" />
                  ))}
                </div>
              </div>
            );
          })()}
         </div>
      </div>
    </MainLayout>
  );
};

export default PerformanceDetail;