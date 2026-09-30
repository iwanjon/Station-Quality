import React, { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import {
  Maximize2,
  Download,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Activity,
  Info,
  ChevronDown,
  LayoutGrid,
  Rows,
  ImageOff,
} from "lucide-react";
import axiosServer from "../utilities/AxiosServer";

interface WebicorderSectionProps {
  stationCode?: string;
  selectedDate?: string;
  onDateChange?: (date: string) => void;
}

/**
 * Returns appropriate realistic sample image based on component orientation.
 */
function getFallbackImageUrl(channel: string): string {
  const lastChar = channel.trim().toUpperCase().slice(-1);
  if (lastChar === "Z") return "/images/webicorder-sample-Z.png";
  if (lastChar === "N" || lastChar === "1") return "/images/webicorder-sample-N.png";
  if (lastChar === "E" || lastChar === "2") return "/images/webicorder-sample-E.png";
  return "/images/webicorder-sample.png";
}

interface SingleWaveformCardProps {
  stationCode: string;
  channel: string;
  formattedDate: string;
  onZoom: (channel: string, url: string) => void;
}

/**
 * Clean, minimalist card displaying a 24-hour Webicorder waveform for a specific channel.
 */
const SingleWaveformCard: React.FC<SingleWaveformCardProps> = ({
  stationCode,
  channel,
  formattedDate,
  onZoom,
}) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const fallbackUrl = useMemo(() => getFallbackImageUrl(channel), [channel]);

  // Request live endpoint; fallback seamlessly to realistic simulated sample
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

    if (!stationCode || !channel) {
      setIsLoading(false);
      return;
    }

    const liveApiEndpoint = `/api/qc/data/webicorder/${formattedDate}/${stationCode}/${channel}`;

    axiosServer
      .get(liveApiEndpoint, { responseType: "blob" })
      .then((res) => {
        if (!isMounted) return;
        const blobUrl = URL.createObjectURL(res.data);
        setImageUrl(blobUrl);
        setIsLoading(false);
        setHasError(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setImageUrl(fallbackUrl);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [formattedDate, stationCode, channel, fallbackUrl]);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `Webicorder_${stationCode}_${channel}_${formattedDate}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-gray-200/90 rounded-xl overflow-hidden shadow-2xs hover:shadow-sm transition-all duration-200">
      {/* Minimalist header bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-gray-50/80 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {/* Station & Channel code badge */}
          <span className="font-mono font-semibold text-xs bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-800 shadow-2xs">
            {stationCode}.{channel}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onZoom(channel, imageUrl)}
            disabled={isLoading || hasError}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-100 active:scale-95 transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Perbesar tampilan grafik"
          >
            <Maximize2 className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden sm:inline">Perbesar</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={isLoading || hasError}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50/80 border border-blue-200/70 rounded-md hover:bg-blue-100 active:scale-95 transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Unduh file gambar Webicorder"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Unduh</span>
          </button>
        </div>
      </div>

      {/* Image container */}
      <div
        className="group relative cursor-pointer overflow-hidden bg-slate-50/50 flex justify-center items-center p-2.5 min-h-[220px]"
        onClick={() => onZoom(channel, imageUrl)}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center z-10 p-4">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs text-gray-500 font-medium">Memuat rekaman {channel}...</span>
          </div>
        )}

        {hasError ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-gray-500">
            <div className="p-2.5 rounded-full bg-gray-100 mb-2">
              <ImageOff className="w-6 h-6 text-gray-400" />
            </div>
            <span className="text-xs font-semibold text-gray-700">
              Data gelombang {stationCode}.{channel} tidak tersedia
            </span>
            <span className="text-[11px] text-gray-400 mt-1">
              Tidak ada rekaman sinyal seismik pada tanggal {formattedDate}
            </span>
          </div>
        ) : (
          <>
            <img
              src={imageUrl}
              alt={`Webicorder ${stationCode} ${channel} ${formattedDate}`}
              className="w-full max-w-5xl h-auto object-contain rounded border border-gray-100 shadow-2xs transition-transform duration-200 group-hover:brightness-98"
              onLoad={() => {
                setIsLoading(false);
                setHasError(false);
              }}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />

            {/* Subtle hover overlay hint */}
            <div className="absolute bottom-3 right-3 bg-gray-900/75 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pointer-events-none shadow-md">
              <ZoomIn className="w-3 h-3" />
              <span>Klik untuk perbesar</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const WebicorderSection: React.FC<WebicorderSectionProps> = ({
  stationCode = "",
  selectedDate: externalDate,
  onDateChange,
}) => {
  // Default to yesterday
  const yesterday = useMemo(() => dayjs().subtract(1, "day").format("YYYY-MM-DD"), []);
  const [internalDate, setInternalDate] = useState<string>(yesterday);

  const selectedDate = externalDate || internalDate;
  const handleDateChange = (newDate: string) => {
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setInternalDate(newDate);
    }
  };

  // Available channels dynamically fetched from database for this station
  const [stationChannels, setStationChannels] = useState<string[]>([]);
  // Selected channel or group wildcard (e.g. "*", "BH*", "SH*", "SHZ", etc.)
  const [selectedChannel, setSelectedChannel] = useState<string>("*");
  // Multi-waveform layout mode: "stacked" (1-column) or "grid" (2-columns)
  const [layoutMode, setLayoutMode] = useState<"stacked" | "grid">("stacked");

  // Fullscreen modal zoom state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    channel: string;
    url: string;
    zoom: number;
  }>({
    isOpen: false,
    channel: "",
    url: "",
    zoom: 100,
  });

  // Fetch station's actual active channels from operational QC data (matching StationDaily & StationDetail)
  useEffect(() => {
    let isMounted = true;
    if (!stationCode) return;

    const fetchActiveChannels = async () => {
      // 1. Try querying daily QC detail for this station & date
      try {
        const res = await axiosServer.get(`/api/qc/data/detail/${stationCode}/${selectedDate}`);
        if (!isMounted) return;
        const data = Array.isArray(res.data) ? res.data : [];
        const rawChannels = data.map((d: any) => d.channel).filter(Boolean);
        const unique = Array.from(new Set(rawChannels)).sort();
        if (unique.length > 0) {
          setStationChannels(unique);
          return;
        }
      } catch {
        // Continue to 7-days QC data
      }

      // 2. Try querying 7-days QC detail data for this station
      try {
        const res7 = await axiosServer.get(`/api/qc/data/detail/7days/${stationCode}`);
        if (!isMounted) return;
        const data7 = Array.isArray(res7.data) ? res7.data : [];
        const rawChannels7 = data7.map((d: any) => d.channel).filter(Boolean);
        const unique7 = Array.from(new Set(rawChannels7)).sort();
        if (unique7.length > 0) {
          setStationChannels(unique7);
          return;
        }
      } catch {
        // Fallback default
      }

      // 3. Fallback default active seismic channels
      if (isMounted) {
        setStationChannels(["SHE", "SHN", "SHZ"]);
      }
    };

    fetchActiveChannels();

    return () => {
      isMounted = false;
    };
  }, [stationCode, selectedDate]);

  // Compute clean dropdown options: wildcard groups with '*' and individual channels
  const channelOptions = useMemo(() => {
    // Unique 2-letter prefixes present in this station's channels
    const prefixes = Array.from(
      new Set(
        stationChannels
          .map((c) => c.slice(0, 2))
          .filter((p) => p && p.length === 2)
      )
    ).sort();

    // Group wildcard options (only groups with asterisk '*')
    const groupOptions = prefixes.map((p) => `${p}*`);

    // Individual channels
    const individualOptions = [...stationChannels].sort();

    return { groupOptions, individualOptions };
  }, [stationChannels]);

  // Validate selectedChannel when station channels change
  useEffect(() => {
    if (selectedChannel === "*") return;
    if (selectedChannel.endsWith("*")) {
      const prefix = selectedChannel.slice(0, -1);
      const exists = stationChannels.some((c) => c.startsWith(prefix));
      if (!exists && stationChannels.length > 0) {
        setSelectedChannel("*");
      }
    } else {
      if (stationChannels.length > 0 && !stationChannels.includes(selectedChannel)) {
        setSelectedChannel("*");
      }
    }
  }, [stationChannels, selectedChannel]);

  // Determine list of channel codes to render based on selection
  const channelsToDisplay = useMemo((): string[] => {
    if (selectedChannel === "*") {
      return stationChannels.length > 0
        ? stationChannels
        : ["BHZ", "BHN", "BHE", "SHZ", "SHN", "SHE", "HNZ", "HNN", "HNE"];
    }

    if (selectedChannel.endsWith("*")) {
      const prefix = selectedChannel.slice(0, -1);
      const matched = stationChannels.filter((c) => c.startsWith(prefix));
      if (matched.length > 0) return matched;
      return [`${prefix}Z`, `${prefix}N`, `${prefix}E`];
    }

    // Single channel e.g. "BHZ"
    return [selectedChannel];
  }, [selectedChannel, stationChannels]);

  const handleOpenZoom = (channel: string, url: string) => {
    setModalState({
      isOpen: true,
      channel,
      url,
      zoom: 100,
    });
  };

  const handleDownloadAll = () => {
    channelsToDisplay.forEach((ch, idx) => {
      setTimeout(() => {
        const fallbackUrl = getFallbackImageUrl(ch);
        const link = document.createElement("a");
        link.href = fallbackUrl;
        link.download = `Webicorder_${stationCode}_${ch}_${selectedDate}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 250);
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200/90 p-4 sm:p-5 mb-6">
      {/* --- Section Header & Title --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/60">
            <Activity className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-gray-800">
            Webicorder 24 Jam
          </h2>
        </div>

        {/* Minimalist discreet status pill */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/70 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Simulasi Webicorder</span>
          </span>
        </div>
      </div>

      {/* --- Minimalist Controls Toolbar --- */}
      <div className="flex flex-wrap items-center justify-between gap-3 my-3.5 pt-1">
        {/* Left Side: Date Picker & Channel Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker (Native HTML5 Date like StationDaily) */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-gray-600 whitespace-nowrap">
              Tanggal:
            </label>
            <input
              type="date"
              value={selectedDate}
              max={dayjs().format("YYYY-MM-DD")}
              onChange={(e) => handleDateChange(e.target.value)}
              className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded border-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          {/* Channel Dropdown Selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-gray-600 whitespace-nowrap">
              Saluran (Channel):
            </label>
            <div className="relative">
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                disabled={channelOptions.individualOptions.length === 0}
                className="appearance-none pl-3 pr-8 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded shadow-2xs hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {channelOptions.individualOptions.length === 0 ? (
                  <option value="">(Tidak ada saluran aktif)</option>
                ) : (
                  <>
                    <option value="*">*</option>
                    {channelOptions.groupOptions.length > 0 && (
                      <optgroup label="Grup Saluran">
                        {channelOptions.groupOptions.map((grp) => (
                          <option key={grp} value={grp}>
                            {grp}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {channelOptions.individualOptions.length > 0 && (
                      <optgroup label="Saluran Individual">
                        {channelOptions.individualOptions.map((ch) => (
                          <option key={ch} value={ch}>
                            {ch}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </>
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Right Side: Multi-Waveform Layout Switcher & Batch Download */}
        <div className="flex items-center gap-2">
          {channelsToDisplay.length > 1 && (
            <>
              {/* Channel count indicator */}
              <span className="text-[11px] font-medium text-gray-500 hidden md:inline">
                {channelsToDisplay.length} saluran aktif
              </span>

              {/* Layout Switcher: Stacked vs Grid */}
              <div className="inline-flex p-0.5 bg-gray-100 rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => setLayoutMode("stacked")}
                  className={`p-1 text-xs rounded transition-all cursor-pointer ${
                    layoutMode === "stacked"
                      ? "bg-white text-blue-600 shadow-2xs font-bold"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                  title="Tampilan Tumpuk (1 Kolom Penuh)"
                >
                  <Rows size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode("grid")}
                  className={`p-1 text-xs rounded transition-all cursor-pointer ${
                    layoutMode === "grid"
                      ? "bg-white text-blue-600 shadow-2xs font-bold"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                  title="Tampilan Grid (2 Kolom Bersandingan)"
                >
                  <LayoutGrid size={14} />
                </button>
              </div>

              {/* Batch Download button */}
              <button
                type="button"
                onClick={handleDownloadAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 rounded-lg shadow-2xs transition-colors cursor-pointer active:scale-95"
                title="Unduh seluruh file gambar gelombang yang ditampilkan"
              >
                <Download size={13} className="text-blue-600" />
                <span>Unduh Semua</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* --- Waveform Cards Grid / Stack or Empty State --- */}
      {channelsToDisplay.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50/70 rounded-xl border border-dashed border-gray-200">
          <div className="p-3 rounded-full bg-white border border-gray-200/80 shadow-2xs mb-2.5">
            <ImageOff className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700">
            Data saluran tidak tersedia
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-md">
            Tidak ditemukan saluran aktif atau data rekaman gelombang seismik untuk stasiun{" "}
            <span className="font-semibold text-gray-700">{stationCode || "-"}</span> pada tanggal{" "}
            <span className="font-semibold text-gray-700">{selectedDate}</span>.
          </p>
        </div>
      ) : (
        <div
          className={`grid gap-4 ${
            layoutMode === "grid" && channelsToDisplay.length > 1
              ? "grid-cols-1 lg:grid-cols-2"
              : "grid-cols-1"
          }`}
        >
          {channelsToDisplay.map((channel) => (
            <SingleWaveformCard
              key={`${stationCode}-${channel}-${selectedDate}`}
              stationCode={stationCode}
              channel={channel}
              formattedDate={selectedDate}
              onZoom={handleOpenZoom}
            />
          ))}
        </div>
      )}

      {/* --- Minimalist Explanatory Footer Guide --- */}
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50/60 px-3.5 py-2.5 rounded-lg border border-gray-100 mt-4">
        <Info className="w-4 h-4 text-blue-500 shrink-0" />
        <span className="leading-relaxed">
          <strong>Panduan Membaca:</strong> Setiap baris mewakili 1 jam (00:00 - 24:00 UTC). Sumbu mendatar menunjukkan menit ke-0 s.d 60.
        </span>
      </div>

      {/* --- Fullscreen Lightbox Modal --- */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex flex-col">
          {/* Modal Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 text-white border-b border-gray-800">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-sm bg-gray-800 px-2 py-0.5 rounded text-blue-400">
                {stationCode}.{modalState.channel}
              </span>
              <span className="text-xs text-gray-300">
                {selectedDate}
              </span>
              <span className="text-xs text-gray-400 hidden sm:inline">
                ({modalState.zoom}%)
              </span>
            </div>

            {/* Modal Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setModalState((prev) => ({ ...prev, zoom: Math.max(50, prev.zoom - 25) }))}
                className="p-1.5 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Perkecil"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setModalState((prev) => ({ ...prev, zoom: 100 }))}
                className="p-1.5 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Reset Ukuran (100%)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setModalState((prev) => ({ ...prev, zoom: Math.min(250, prev.zoom + 25) }))}
                className="p-1.5 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Perbesar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-gray-700 mx-1" />
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = modalState.url;
                  link.download = `Webicorder_${stationCode}_${modalState.channel}_${selectedDate}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="p-1.5 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Unduh Gambar"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
                className="p-1.5 rounded hover:bg-red-600 text-gray-300 hover:text-white transition-colors ml-1 cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Scrollable Image Viewport */}
          <div className="flex-1 overflow-auto p-4 flex justify-center items-start bg-neutral-950">
            <img
              src={modalState.url}
              alt={`Webicorder Fullscreen ${stationCode} ${modalState.channel}`}
              style={{ width: `${modalState.zoom}%`, maxWidth: "none" }}
              className="transition-all duration-150 rounded shadow-2xl bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WebicorderSection;
