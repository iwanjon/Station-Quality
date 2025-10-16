import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import axiosServer from "../utilities/AxiosServer";

const PerformanceDetail: React.FC = () => {
  const { stationCode } = useParams<{ stationCode: string }>();
  const navigate = useNavigate();

  const [stationList, setStationList] = useState<string[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | undefined>(stationCode);
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
      setIsTransitioning(false);
    }
  }, [stationCode]);

  // DIHAPUS: Blok ini tidak diperlukan lagi karena gambar ada di /public
  /*
  const modules = useMemo( ... );
  const plotsIndex = useMemo( ... );
  */

  // DIPERBARUI: Tambahkan properti `fileName` untuk membuat nama file dinamis
  const plotSpecs = [
    { folder: 'mean_resP_map', title: 'Mean resP amp', fileName: (code: string) => `${code}_mean_resP_amp.png` },
    { folder: 'resP_azi', title: 'resP azimuth', fileName: (code: string) => `${code}_resP_azi.png` },
    { folder: 'resP_date', title: 'resP date', fileName: (code: string) => `${code}_resP_date.png` },
    { folder: 'resP_distance', title: 'resP distance', fileName: (code: string) => `${code}_resP_distance.png` },
    { folder: 'resS_azi', title: 'resS azimuth', fileName: (code: string) => `${code}_resS_azi.png` },
    { folder: 'resS_date', title: 'resS date', fileName: (code: string) => `${code}_resS_date.png` },
    { folder: 'resS_distance', title: 'resS distance', fileName: (code: string) => `${code}_resS_distance.png` },
    { folder: 'SP_dt', title: 'SP dt', fileName: (code: string) => `${code}_SP_dt.png` },
  ];
  
  // DIPERBARUI: Fungsi ini sekarang hanya membuat URL string sederhana
  const getPlotUrl = (code: string | undefined, folder: string, fileNamePattern: (code: string) => string): string | null => {
    if (!code) return null;
    const fileName = fileNamePattern(code.toUpperCase());
    // URL langsung mengarah ke path di dalam folder public
    return `/plot/${folder}/${fileName}`;
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
                  setIsTransitioning(true);
                  if (e.target.value) navigate(`/performance-detail/${e.target.value}`);
                }}
                className="appearance-none min-w-[160px] border border-gray-300 rounded px-3 pr-10 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {stationList.length === 0 && <option value="">Loading...</option>}
                {stationList.map((station) => (
                  <option key={station} value={station}>{station}</option>
                ))}
              </select>

              <div className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
                <span className="w-px h-6 bg-gray-200 mr-2" />
                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          {/* Tata letak 3-3-2 Anda tetap dipertahankan */}
          {(() => {
            const row1 = plotSpecs.slice(0, 3);
            const row2 = plotSpecs.slice(3, 6);
            const row3 = plotSpecs.slice(6, 8);

            // Tipe 'spec' diperbarui untuk menyertakan `fileName`
            const renderTile = (spec: { folder: string; title: string; fileName: (code: string) => string }) => {
              const codeForLookup = selectedStation || stationCode;
              
              // DIPERBARUI: Panggilan fungsi disesuaikan dengan parameter baru
              const src = getPlotUrl(codeForLookup, spec.folder, spec.fileName);

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
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {row3.map(renderTile)}
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