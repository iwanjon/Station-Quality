import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import dayjs from "dayjs";
import {
  Calendar,
  Maximize2,
  Download,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Activity,
  Info,
  CheckCircle2,
  AlertCircle,
  ImageOff,
  RefreshCcw
} from "lucide-react";
import axiosServer from "../utilities/AxiosServer";

interface WebicorderSectionProps {
  stationCode?: string;
}

type ChannelType = "Z" | "N" | "E";

interface ChannelOption {
  code: ChannelType;
  label: string;
  description: string;
}

const CHANNELS: ChannelOption[] = [
  { code: "Z", label: "Z (Vertikal)", description: "Komponen Gerak Vertikal" },
  { code: "N", label: "N (Utara - Selatan)", description: "Komponen Gerak Horizontal Utara-Selatan" },
  { code: "E", label: "E (Timur - Barat)", description: "Komponen Gerak Horizontal Timur-Barat" },
];

export const WebicorderSection: React.FC<WebicorderSectionProps> = ({ stationCode }) => {
  // Default to yesterday consistent with station quality summary
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(Date.now() - 86400000)
  );
  const [selectedChannel, setSelectedChannel] = useState<ChannelType>("Z");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalZoom, setModalZoom] = useState<number>(100);

  const formattedDate = dayjs(selectedDate).format("YYYY-MM-DD");
  const fallbackUrl = `/images/webicorder-sample-${selectedChannel}.png`;

  // Attempt to load live backend endpoint if available; gracefully fallback to simulation
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

    if (!stationCode) {
      setIsLoading(false);
      return;
    }

    // Future BMKG Webicorder endpoint path
    const liveApiEndpoint = `/api/qc/data/webicorder/${formattedDate}/${stationCode}/${selectedChannel}`;

    // Example: /api/qc/data/webicorder/2026-09-28/AAFM/SHZ.  

    axiosServer
      .get(liveApiEndpoint, { responseType: "blob" })
      .then((res) => {
        if (isMounted) {
          const blobUrl = URL.createObjectURL(res.data);
          setImageUrl(blobUrl);
          setIsSimulationMode(false);
          setIsLoading(false);
          setHasError(false);
        }
      })
      .catch(() => {
        // Backend endpoint not ready yet: try using simulated sample
        if (isMounted) {
          setImageUrl(fallbackUrl);
          setIsSimulationMode(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [formattedDate, stationCode, selectedChannel, fallbackUrl]);

  // Handle direct image download
  const handleDownload = () => {
    if (hasError || !imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `Webicorder_${stationCode}_${selectedChannel}_${formattedDate}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
      {/* --- Section Header & Title --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Visualisasi Waveform 24 Jam (Webicorder)
              </h2>
              <p className="text-xs text-gray-500">
                Rekaman sinyal seismik per jam (00:00 - 24:00 UTC) untuk stasiun{" "}
                <span className="font-semibold text-gray-700">{stationCode || "-"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* --- Simulation / Live / Error Badge --- */}
        <div className="flex items-center gap-2">
          {hasError ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-800 border border-red-200 shadow-xs">
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
              Data Waveform Tidak Ditemukan
            </span>
          ) : isSimulationMode ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Mode Simulasi (Menunggu Rilis API BMKG)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Data Langsung BMKG
            </span>
          )}
        </div>
      </div>

      {/* --- Filter & Control Toolbar --- */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 my-4 p-3 bg-gray-50 rounded-lg border border-gray-100 items-center">
        {/* Date Filter */}
        <div className="md:col-span-4 flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">
            Pilih Tanggal:
          </label>
          <div className="relative flex-1">
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => {
                if (date) setSelectedDate(date);
              }}
              dateFormat="yyyy-MM-dd"
              maxDate={new Date()}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-2xs hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <Calendar className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Channel Selector Tabs */}
        <div className="md:col-span-5 flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">
            Komponen:
          </label>
          <div className="inline-flex p-0.5 rounded-lg bg-gray-200/80 border border-gray-300">
            {CHANNELS.map((ch) => (
              <button
                key={ch.code}
                onClick={() => setSelectedChannel(ch.code)}
                title={ch.description}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${selectedChannel === ch.code
                    ? "bg-white text-blue-600 shadow-xs font-bold"
                    : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                {ch.code}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-gray-500 hidden lg:inline">
            ({CHANNELS.find((c) => c.code === selectedChannel)?.label})
          </span>
        </div>

        {/* Action Buttons */}
        <div className="md:col-span-3 flex items-center justify-start md:justify-end gap-2">
          <button
            onClick={() => {
              if (hasError || isLoading) return;
              setModalZoom(100);
              setIsModalOpen(true);
            }}
            disabled={hasError || isLoading}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md shadow-2xs transition-all ${hasError || isLoading
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 active:scale-95"
              }`}
            title={hasError ? "Gambar tidak tersedia" : "Buka gambar layar penuh"}
          >
            <Maximize2 className="w-3.5 h-3.5 text-gray-500" />
            <span>Perbesar</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={hasError || isLoading}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md shadow-2xs transition-all ${hasError || isLoading
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 active:scale-95"
              }`}
            title={hasError ? "Gambar tidak tersedia" : "Unduh file gambar Webicorder"}
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Unduh</span>
          </button>
        </div>
      </div>

      {/* --- Image Display Area --- */}
      <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-white">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center z-10 p-6 min-h-[350px]">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs font-medium text-gray-600">Memuat visualisasi Webicorder...</p>
          </div>
        )}

        {/* Error / Empty State */}
        {hasError ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 min-h-[350px]">
            <div className="p-3 bg-red-50 text-red-500 rounded-full mb-3 shadow-xs border border-red-100">
              <ImageOff className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">
              Visualisasi Waveform Tidak Tersedia
            </h3>
            <p className="text-xs text-gray-500 max-w-md mb-4 leading-relaxed">
              Rekaman sinyal Webicorder 24 jam untuk stasiun{" "}
              <span className="font-semibold text-gray-700">{stationCode}</span> komponen{" "}
              <span className="font-semibold text-gray-700">{selectedChannel}</span> pada tanggal{" "}
              <span className="font-semibold text-gray-700">{formattedDate}</span> belum tersedia di server BMKG atau berkas gambar tidak ditemukan.
            </p>
            <button
              onClick={() => {
                setIsLoading(true);
                setHasError(false);
                setImageUrl("");
                setTimeout(() => setImageUrl(fallbackUrl), 50);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCcw className="w-3.5 h-3.5 text-gray-500" />
              <span>Coba Muat Ulang</span>
            </button>
          </div>
        ) : (
          /* Main Webicorder Image Container */
          <div
            className="group relative cursor-pointer overflow-auto max-h-[720px] bg-slate-50 flex justify-center p-2"
            onClick={() => {
              setModalZoom(100);
              setIsModalOpen(true);
            }}
            title="Klik untuk memperbesar tampilan grafik"
          >
            <img
              src={imageUrl}
              alt={`Webicorder ${stationCode} ${selectedChannel} ${formattedDate}`}
              className="w-full max-w-4xl h-auto object-contain border border-gray-200 rounded shadow-xs transition-transform duration-200 group-hover:brightness-95"
              onLoad={() => {
                setIsLoading(false);
                setHasError(false);
              }}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />

            {/* Hover Overlay Hint */}
            <div className="absolute bottom-4 right-4 bg-gray-900/75 backdrop-blur-xs text-white text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 pointer-events-none shadow-md">
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Klik untuk perbesar</span>
            </div>
          </div>
        )}

        {/* Explanatory Footer Guide */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>
              <strong>Panduan Membaca:</strong> Setiap baris mewakili 1 jam (00:00 - 24:00 UTC). Sumbu bawah menunjukkan menit ke 0 s.d 60.
            </span>
          </div>
          <span className="text-[11px] text-gray-400">
            Resolusi Tinggi (24-Hour Drum Helicorder)
          </span>
        </div>
      </div>

      {/* --- Fullscreen Lightbox Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col animate-fade-in">
          {/* Modal Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white border-b border-gray-800">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm">
                Webicorder: {stationCode} | Komponen {selectedChannel} | {formattedDate}
              </span>
              <span className="text-xs text-gray-400 hidden sm:inline">
                (Zoom: {modalZoom}%)
              </span>
            </div>

            {/* Modal Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModalZoom((z) => Math.max(50, z - 25))}
                className="p-1.5 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
                title="Perkecil"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setModalZoom(100)}
                className="p-1.5 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
                title="Reset Ukuran"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setModalZoom((z) => Math.min(250, z + 25))}
                className="p-1.5 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
                title="Perbesar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-gray-700 mx-1" />
              <button
                onClick={handleDownload}
                className="p-1.5 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
                title="Unduh Gambar"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded hover:bg-red-600 text-gray-300 hover:text-white transition-colors ml-2"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Scrollable Image Viewport */}
          <div className="flex-1 overflow-auto p-4 flex justify-center items-start bg-neutral-950">
            <img
              src={imageUrl}
              alt={`Webicorder Fullscreen ${stationCode} ${selectedChannel}`}
              style={{ width: `${modalZoom}%`, maxWidth: "none" }}
              className="transition-all duration-150 rounded shadow-2xl bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WebicorderSection;
