import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import TableFilters from "../components/TableFilters";
import type { FilterConfig } from "../components/TableFilters";
import DataTable from "../components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import axiosServer from "../utilities/AxiosServer";
import AvailabilityChartSection from "../components/station-availability/AvailabilityChartSection";
import { ChevronLeft, ChevronRight, ChevronDown, Download, Calendar, CalendarDays } from "lucide-react";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Configuration for availability ranges, colors, and labels per BMKG mentor guidelines:
// - >= 97%: Sangat Baik (Hijau)
// - 90 - 97%: Baik (Kuning)
// - 50 - 89%: Kurang Baik (Oren)
// - < 50%: Buruk (Merah)
const AVAILABILITY_CONFIG = {
  ranges: [
    {
      key: "≥ 97% (Sangat Baik)",
      label: "≥ 97% (Sangat Baik)",
      min: 97,
      max: 100,
      chartColor: "#16a34a",
      legendColor: "bg-green-600",
      tableColor: "text-green-600"
    },
    {
      key: "90 - 97% (Baik)",
      label: "90 - 97% (Baik)",
      min: 90,
      max: 96.9999,
      chartColor: "#eab308",
      legendColor: "bg-yellow-500",
      tableColor: "text-yellow-600"
    },
    {
      key: "50 - 89% (Kurang Baik)",
      label: "50 - 89% (Kurang Baik)",
      min: 50,
      max: 89.9999,
      chartColor: "#f97316",
      legendColor: "bg-orange-500",
      tableColor: "text-orange-500"
    },
    {
      key: "< 50% (Buruk)",
      label: "< 50% (Buruk)",
      min: 0,
      max: 49.9999,
      chartColor: "#ef4444",
      legendColor: "bg-red-500",
      tableColor: "text-red-500"
    }
  ]
};

// Helper function to get availability category for a single value
function getAvailabilityCategoryForValue(value: number | null): string {
  const fallbackKey = AVAILABILITY_CONFIG.ranges[AVAILABILITY_CONFIG.ranges.length - 1].key;
  if (value === null || value === undefined || isNaN(value)) {
    return fallbackKey; // < 50% (Buruk)
  }

  for (const range of AVAILABILITY_CONFIG.ranges) {
    if (value >= range.min && value <= range.max) {
      return range.key;
    }
  }

  return fallbackKey; // fallback
}

// Helper function for full-cell heatmap background and high-contrast typography
interface HeatmapCellProps {
  bgClass: string;
  textClass: string;
  label: string;
  tooltipText: string;
}

function getHeatmapCellProps(value: number | null | undefined): HeatmapCellProps {
  if (value === null || value === undefined || isNaN(value)) {
    return {
      bgClass: "bg-gray-100",
      textClass: "text-gray-400 font-normal",
      label: "-",
      tooltipText: "Tidak ada data",
    };
  }

  const roundedValue = Math.round(value);

  if (value >= 97) {
    return {
      bgClass: "bg-green-600",
      textClass: "text-white font-semibold",
      label: `${roundedValue}%`,
      tooltipText: `${value.toFixed(2)}% (Sangat Baik)`,
    };
  } else if (value >= 90) {
    return {
      bgClass: "bg-yellow-400",
      textClass: "text-gray-900 font-bold", // High-contrast dark text on yellow
      label: `${roundedValue}%`,
      tooltipText: `${value.toFixed(2)}% (Baik)`,
    };
  } else if (value >= 50) {
    return {
      bgClass: "bg-orange-500",
      textClass: "text-white font-semibold",
      label: `${roundedValue}%`,
      tooltipText: `${value.toFixed(2)}% (Kurang Baik)`,
    };
  } else {
    return {
      bgClass: "bg-red-500",
      textClass: "text-white font-semibold",
      label: `${roundedValue}%`,
      tooltipText: `${value.toFixed(2)}% (Buruk)`,
    };
  }
}

interface StationData {
  timestamp: string;
  availability: number | null;
  note?: string;
}

interface APIResponse {
  success: boolean;
  message: string;
  cached: boolean;
  cache_key: string;
  meta: {
    stationCount: number;
    dateRange: {
      start_date: string;
      end_date: string;
    };
  };
  data: Record<string, StationData[]>;
}

interface StationMetadata {
  kode_stasiun: string;
  prioritas: string;
  upt_penanggung_jawab: string;
  provinsi: string;
  jaringan: string;
}

interface Station {
  id: number;
  kode: string;
  prioritas?: string;
  upt_penanggung_jawab?: string;
  provinsi?: string;
  jaringan?: string;
  monthlyData: Record<string, number | null>;
  dailyData: Record<string, number | null>;
  totalDays: number;
  availableDays: number;
  missingDays: number;
}

interface DateRange {
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
}

interface ChartDataPoint {
  month: string;
  counts: Record<string, number>;
  [key: string]: string | number | Record<string, number>;
}

interface ApiInfo {
  cached: boolean;
  totalStations: number;
  dateRange: string;
}

type ViewMode = "monthly" | "daily";

// Function to process API response, calculate monthly averages, and preserve daily records
function processStationData(
  apiResponse: APIResponse,
  selectedRange: DateRange,
  stationMetaMap: Map<string, StationMetadata>
): Station[] {
  const stations: Station[] = [];
  let id = 1;

  if (!apiResponse || !apiResponse.data) return stations;

  Object.entries(apiResponse.data).forEach(([stationCode, stationData]) => {
    if (!Array.isArray(stationData)) return;

    const validData = stationData.filter(record => record && record.availability !== null);
    const totalDays = stationData.length;
    const availableDays = validData.length;
    const missingDays = totalDays - availableDays;

    const monthlyData: Record<string, number | null> = {};
    const dailyData: Record<string, number | null> = {};

    // Build dictionary of daily records: "YYYY-MM-DD" -> percentage
    stationData.forEach(record => {
      if (!record || !record.timestamp) return;
      const dateKey = record.timestamp.split("T")[0];
      dailyData[dateKey] = record.availability !== null && record.availability !== undefined 
        ? Math.round(Number(record.availability) * 100) / 100 
        : null;
    });

    const currentDate = new Date(selectedRange.startYear, selectedRange.startMonth, 1);
    const endDate = new Date(selectedRange.endYear, selectedRange.endMonth, 1);

    while (currentDate <= endDate) {
      const targetYear = currentDate.getFullYear();
      const targetMonth = currentDate.getMonth();
      const monthKey = `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}`;

      const monthData = stationData.filter(record => {
        if (!record || !record.timestamp) return false;
        // Parse date from "YYYY-MM-DD" safely without timezone issues
        const parts = record.timestamp.split("T")[0].split("-");
        if (parts.length >= 2) {
          const recYear = parseInt(parts[0], 10);
          const recMonth = parseInt(parts[1], 10) - 1;
          return recYear === targetYear && recMonth === targetMonth;
        }
        return false;
      });

      const validMonthData = monthData.filter(record => record.availability !== null && record.availability !== undefined);
      if (validMonthData.length > 0) {
        const sum = validMonthData.reduce((acc, record) => acc + (Number(record.availability) || 0), 0);
        monthlyData[monthKey] = Math.round((sum / validMonthData.length) * 100) / 100;
      } else {
        monthlyData[monthKey] = null;
      }

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    const meta = stationMetaMap.get(stationCode);

    stations.push({
      id: id++,
      kode: stationCode,
      prioritas: meta?.prioritas || "-",
      upt_penanggung_jawab: meta?.upt_penanggung_jawab || "-",
      provinsi: meta?.provinsi || "-",
      jaringan: meta?.jaringan || "-",
      monthlyData,
      dailyData,
      totalDays,
      availableDays,
      missingDays
    });
  });

  return stations;
}

// Function to determine overall availability category based on average across all months
function getAvailabilityCategory(station: Station): string {
  const monthlyValues = Object.values(station.monthlyData).filter(val => val !== null && val !== undefined) as number[];

  if (monthlyValues.length === 0) {
    return AVAILABILITY_CONFIG.ranges[AVAILABILITY_CONFIG.ranges.length - 1].key; // Fallback to lowest range (< 50% Buruk)
  }

  const overallAverage = monthlyValues.reduce((sum, val) => sum + val, 0) / monthlyValues.length;
  return getAvailabilityCategoryForValue(overallAverage);
}

interface AvailabilityCacheEntry {
  apiResponse: APIResponse;
  apiInfo: ApiInfo;
  processedStations: Station[];
}

// Module-level RAM in-memory cache to ensure instant back-and-forth page transitions
// Persists in browser memory across React component mount / unmount lifecycles
const memoryAvailabilityCache = new Map<string, AvailabilityCacheEntry>();
let memoryStationMetaMap: Map<string, StationMetadata> | null = null;
let savedViewMode: ViewMode = "monthly";
let savedDailyMonth: { year: number; month: number } | null = null;

function getInitialDateRange(): DateRange {
  const saved = sessionStorage.getItem("stationAvailabilityDate");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved date, falling back to default");
    }
  }

  const today = new Date();
  let endYear = today.getFullYear();
  let endMonth = today.getMonth() - 1;
  if (endMonth < 0) {
    endMonth = 11;
    endYear -= 1;
  }

  let startMonth = endMonth - 11;
  let startYear = endYear;
  if (startMonth < 0) {
    startMonth += 12;
    startYear -= 1;
  }

  return {
    startYear,
    startMonth,
    endYear,
    endMonth,
  };
}

function getAvailabilityCacheKey(range: DateRange): string {
  const firstDay = new Date(range.startYear, range.startMonth, 1);
  const lastDay = new Date(range.endYear, range.endMonth + 1, 0);

  const start_date = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, "0")}-${String(firstDay.getDate()).padStart(2, "0")}`;
  const end_date = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;

  return `station_avail_v2_${start_date}_${end_date}`;
}

const StationAvailability = () => {
  const [selectedMonth, setSelectedMonth] = useState<DateRange>(() => getInitialDateRange());
  const initialCacheKey = useMemo(() => getAvailabilityCacheKey(selectedMonth), [selectedMonth]);
  const initialCache = memoryAvailabilityCache.get(initialCacheKey);

  const [data, setData] = useState<Station[]>(() => initialCache?.processedStations || []);
  const [rawApiResponse, setRawApiResponse] = useState<APIResponse | null>(() => initialCache?.apiResponse || null);
  const [stationMetaMap, setStationMetaMap] = useState<Map<string, StationMetadata>>(() => memoryStationMetaMap || new Map());
  const [loading, setLoading] = useState<boolean>(() => !initialCache);
  const [apiInfo, setApiInfo] = useState<ApiInfo | null>(() => initialCache?.apiInfo || null);

  // View Mode: "monthly" (default) or "daily" - preserves user selection across navigation
  const [viewMode, setViewMode] = useState<ViewMode>(savedViewMode);

  // Selected month for daily view mode - preserves user selection across navigation
  const [dailyMonth, setDailyMonth] = useState<{ year: number; month: number }>(() => {
    if (savedDailyMonth) return savedDailyMonth;
    return {
      year: selectedMonth.endYear,
      month: selectedMonth.endMonth,
    };
  });

  const handleViewModeChange = (mode: ViewMode) => {
    savedViewMode = mode;
    setViewMode(mode);
  };

  const handleDailyMonthSelect = (dm: { year: number; month: number }) => {
    savedDailyMonth = dm;
    setDailyMonth(dm);
  };

  // State and ref for Daily Month selector dropdown with click-outside listener
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState<boolean>(false);
  const monthDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMonthDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        monthDropdownRef.current &&
        !monthDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMonthDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMonthDropdownOpen]);

  // Keep dailyMonth in bounds whenever selectedMonth changes
  useEffect(() => {
    const currentDailyTime = dailyMonth.year * 12 + dailyMonth.month;
    const startTime = selectedMonth.startYear * 12 + selectedMonth.startMonth;
    const endTime = selectedMonth.endYear * 12 + selectedMonth.endMonth;

    if (currentDailyTime < startTime || currentDailyTime > endTime) {
      const fallback = {
        year: selectedMonth.endYear,
        month: selectedMonth.endMonth,
      };
      savedDailyMonth = fallback;
      setDailyMonth(fallback);
    }
  }, [selectedMonth, dailyMonth]);

  useEffect(() => {
    sessionStorage.setItem("stationAvailabilityDate", JSON.stringify(selectedMonth));
  }, [selectedMonth]);

  // Fetch station metadata (Prioritas, UPT, Provinsi, Jaringan) for enriched filtering
  useEffect(() => {
    if (memoryStationMetaMap && memoryStationMetaMap.size > 0) {
      setStationMetaMap(memoryStationMetaMap);
      return;
    }

    axiosServer
      .get("/api/stasiun/public/active")
      .then((res) => {
        if (Array.isArray(res.data)) {
          const map = new Map<string, StationMetadata>();
          res.data.forEach((s: any) => {
            map.set(s.kode_stasiun, {
              kode_stasiun: s.kode_stasiun,
              prioritas: s.prioritas || "-",
              upt_penanggung_jawab: s.upt_penanggung_jawab || "-",
              provinsi: s.provinsi || "-",
              jaringan: s.jaringan || "-",
            });
          });
          memoryStationMetaMap = map;
          setStationMetaMap(map);

          // Immediately enrich active stations in state with fetched metadata
          setData((prev) => {
            if (!prev.length) return prev;
            return prev.map((station) => {
              const meta = map.get(station.kode);
              if (!meta) return station;
              return {
                ...station,
                prioritas: meta.prioritas || station.prioritas || "-",
                upt_penanggung_jawab: meta.upt_penanggung_jawab || station.upt_penanggung_jawab || "-",
                provinsi: meta.provinsi || station.provinsi || "-",
                jaringan: meta.jaringan || station.jaringan || "-",
              };
            });
          });

          // Also enrich all existing entries in RAM cache to avoid stale metadata on cache hits
          memoryAvailabilityCache.forEach((entry) => {
            entry.processedStations = entry.processedStations.map((station) => {
              const meta = map.get(station.kode);
              if (!meta) return station;
              return {
                ...station,
                prioritas: meta.prioritas || station.prioritas || "-",
                upt_penanggung_jawab: meta.upt_penanggung_jawab || station.upt_penanggung_jawab || "-",
                provinsi: meta.provinsi || station.provinsi || "-",
                jaringan: meta.jaringan || station.jaringan || "-",
              };
            });
          });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch station metadata:", err);
      });
  }, []);

  // Re-process stations whenever raw API data or station metadata updates
  useEffect(() => {
    if (rawApiResponse && rawApiResponse.data) {
      const currentMeta = stationMetaMap.size > 0 ? stationMetaMap : (memoryStationMetaMap || new Map());
      const processed = processStationData(rawApiResponse, selectedMonth, currentMeta);
      setData(processed);
    } else if (data.length > 0 && stationMetaMap.size > 0) {
      // If data is already populated, enrich with updated metadata
      setData((prev) =>
        prev.map((station) => {
          const meta = stationMetaMap.get(station.kode);
          if (!meta) return station;
          return {
            ...station,
            prioritas: meta.prioritas || station.prioritas || "-",
            upt_penanggung_jawab: meta.upt_penanggung_jawab || station.upt_penanggung_jawab || "-",
            provinsi: meta.provinsi || station.provinsi || "-",
            jaringan: meta.jaringan || station.jaringan || "-",
          };
        })
      );
    }
  }, [stationMetaMap, rawApiResponse, selectedMonth]);

  // Active filters: Availability Category, Prioritas, UPT, Provinsi, Jaringan (persisted in sessionStorage)
  const [filters, setFilters] = useState<Record<string, string[]>>(() => {
    try {
      const saved = sessionStorage.getItem("stationAvailabilityFilters");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved availability filters:", e);
    }
    return {};
  });

  useEffect(() => {
    sessionStorage.setItem("stationAvailabilityFilters", JSON.stringify(filters));
  }, [filters]);

  const [chartType, setChartType] = useState<"stacked" | "line" | "grouped">("stacked");
  const [metric, setMetric] = useState<"count" | "percentage">("percentage");

  // Filtered stations based on active filter criteria (applies specifically to table)
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Availability Category filter
      if (filters.availabilityCategory && filters.availabilityCategory.length > 0) {
        const category = getAvailabilityCategory(item);
        if (!filters.availabilityCategory.includes(category)) return false;
      }

      // 2. Prioritas filter
      if (filters.prioritas && filters.prioritas.length > 0) {
        if (!filters.prioritas.includes(item.prioritas || "")) return false;
      }

      // 3. UPT filter
      if (filters.upt_penanggung_jawab && filters.upt_penanggung_jawab.length > 0) {
        if (!filters.upt_penanggung_jawab.includes(item.upt_penanggung_jawab || "")) return false;
      }

      // 4. Provinsi filter
      if (filters.provinsi && filters.provinsi.length > 0) {
        if (!filters.provinsi.includes(item.provinsi || "")) return false;
      }

      // 5. Jaringan filter
      if (filters.jaringan && filters.jaringan.length > 0) {
        if (!filters.jaringan.includes(item.jaringan || "")) return false;
      }

      return true;
    });
  }, [filters, data]);

  // Chart data reactive to filteredData (synced with active filter selection)
  const chartData = useMemo(() => {
    if (!filteredData.length) return [];

    const chartDataTemp: ChartDataPoint[] = [];

    const currentDate = new Date(selectedMonth.startYear, selectedMonth.startMonth, 1);
    const endDate = new Date(selectedMonth.endYear, selectedMonth.endMonth, 1);

    while (currentDate <= endDate) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

      const distribution: Record<string, number> = {};
      AVAILABILITY_CONFIG.ranges.forEach(range => {
        distribution[range.key] = 0;
      });

      filteredData.forEach(station => {
        const value = station.monthlyData[monthKey];
        const category = getAvailabilityCategoryForValue(value);
        distribution[category]++;
      });

      const totalStations = Object.values(distribution).reduce((sum, count) => sum + count, 0);

      const chartDataPoint: ChartDataPoint = {
        month: monthLabel,
        counts: { ...distribution }
      };

      AVAILABILITY_CONFIG.ranges.forEach(range => {
        chartDataPoint[range.key] = totalStations > 0
          ? Math.round((distribution[range.key] / totalStations) * 100 * 10) / 10
          : 0;
      });

      chartDataTemp.push(chartDataPoint);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return chartDataTemp;
  }, [filteredData, selectedMonth]);

  // Filter config for TableFilters component
  const filterConfig = useMemo((): Record<string, FilterConfig> => {
    if (!data.length) return {};

    const getUniqueOptions = (key: keyof Station): string[] => {
      const allValues = data.map(item => String(item[key] || ""));
      return [...new Set(allValues)].filter(v => v !== "" && v !== "null" && v !== "-").sort();
    };

    const availabilityCategories = AVAILABILITY_CONFIG.ranges.map(range => range.key);

    return {
      availabilityCategory: { label: "Kategori Availability", type: "multi" as const, options: availabilityCategories },
      prioritas: { label: "Prioritas", type: "multi" as const, options: getUniqueOptions("prioritas") },
      upt_penanggung_jawab: { label: "UPT", type: "multi" as const, options: getUniqueOptions("upt_penanggung_jawab") },
      provinsi: { label: "Provinsi", type: "multi" as const, options: getUniqueOptions("provinsi") },
      jaringan: { label: "Jaringan", type: "multi" as const, options: getUniqueOptions("jaringan") },
    };
  }, [data]);

  // Fetch availability data from API (RAM memory cache provides instant 0ms reload upon navigation back)
  useEffect(() => {
    const cacheKey = getAvailabilityCacheKey(selectedMonth);

    // 1. Check in-memory RAM cache first (instant 0ms response, no spinner)
    if (memoryAvailabilityCache.has(cacheKey)) {
      const cached = memoryAvailabilityCache.get(cacheKey)!;
      setRawApiResponse(cached.apiResponse);
      setApiInfo(cached.apiInfo);
      setData(cached.processedStations);
      setLoading(false);
      return;
    }

    setLoading(true);

    const firstDayOfRange = new Date(selectedMonth.startYear, selectedMonth.startMonth, 1);
    const lastDayOfRange = new Date(selectedMonth.endYear, selectedMonth.endMonth + 1, 0);

    const start_date = `${firstDayOfRange.getFullYear()}-${String(firstDayOfRange.getMonth() + 1).padStart(2, "0")}-${String(firstDayOfRange.getDate()).padStart(2, "0")}`;
    const end_date = `${lastDayOfRange.getFullYear()}-${String(lastDayOfRange.getMonth() + 1).padStart(2, "0")}-${String(lastDayOfRange.getDate()).padStart(2, "0")}`;

    axiosServer
      .get("/api/availability", {
        params: {
          start_date,
          end_date
        },
      })
      .then((res) => {
        const apiResponse: APIResponse = res.data;

        if (apiResponse && apiResponse.success && apiResponse.data) {
          const totalCount = apiResponse.meta?.stationCount || Object.keys(apiResponse.data).length;
          const newApiInfo = {
            cached: apiResponse.cached || false,
            totalStations: totalCount,
            dateRange: `${apiResponse.meta?.dateRange?.start_date || start_date} to ${apiResponse.meta?.dateRange?.end_date || end_date}`
          };

          setRawApiResponse(apiResponse);
          setApiInfo(newApiInfo);

          // Process and set stations immediately using freshest metadata available
          const currentMeta = stationMetaMap.size > 0 ? stationMetaMap : (memoryStationMetaMap || new Map());
          const processed = processStationData(apiResponse, selectedMonth, currentMeta);
          setData(processed);

          // Store in in-memory RAM cache (persists throughout browser session with no 5MB limit)
          memoryAvailabilityCache.set(cacheKey, {
            apiResponse,
            apiInfo: newApiInfo,
            processedStations: processed,
          });
        } else {
          setRawApiResponse(null);
          setData([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching availability data:", err);
        setRawApiResponse(null);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [selectedMonth]);

  // List of available months for daily view navigation
  const availableMonths = useMemo(() => {
    const months: { year: number; month: number; label: string }[] = [];
    const cur = new Date(selectedMonth.startYear, selectedMonth.startMonth, 1);
    const end = new Date(selectedMonth.endYear, selectedMonth.endMonth, 1);

    while (cur <= end) {
      months.push({
        year: cur.getFullYear(),
        month: cur.getMonth(),
        label: `${MONTH_NAMES[cur.getMonth()]} ${cur.getFullYear()}`,
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return months;
  }, [selectedMonth]);

  const canGoPrevMonth = useMemo(() => {
    const curTime = dailyMonth.year * 12 + dailyMonth.month;
    const startTime = selectedMonth.startYear * 12 + selectedMonth.startMonth;
    return curTime > startTime;
  }, [dailyMonth, selectedMonth]);

  const canGoNextMonth = useMemo(() => {
    const curTime = dailyMonth.year * 12 + dailyMonth.month;
    const endTime = selectedMonth.endYear * 12 + selectedMonth.endMonth;
    return curTime < endTime;
  }, [dailyMonth, selectedMonth]);

  const handlePrevDailyMonth = () => {
    if (!canGoPrevMonth) return;
    setDailyMonth((prev) => {
      const next = prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 };
      savedDailyMonth = next;
      return next;
    });
  };

  const handleNextDailyMonth = () => {
    if (!canGoNextMonth) return;
    setDailyMonth((prev) => {
      const next = prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 };
      savedDailyMonth = next;
      return next;
    });
  };

  // Table Columns Definition based on viewMode (Monthly vs Daily)
  const columns = useMemo((): (ColumnDef<Station> & { size?: number })[] => {
    if (viewMode === "monthly") {
      const cols: (ColumnDef<Station> & { size?: number })[] = [
        {
          id: "kode",
          header: "Kode Stasiun",
          accessorKey: "kode",
          enableSorting: true,
          size: 110,
          meta: { sticky: true },
          cell: ({ row }) => (
            <span className="font-semibold text-gray-900 tracking-wide">
              {row.original.kode}
            </span>
          ),
        },
      ];

      const currentDate = new Date(selectedMonth.startYear, selectedMonth.startMonth, 1);
      const endDate = new Date(selectedMonth.endYear, selectedMonth.endMonth, 1);

      while (currentDate <= endDate) {
        const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
        const monthLabel = `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

        cols.push({
          id: monthKey,
          header: monthLabel,
          accessorKey: `monthlyData.${monthKey}`,
          enableSorting: true,
          size: 110,
          meta: { noPadding: true },
          cell: ({ row }) => {
            const value = row.original.monthlyData[monthKey];
            const { bgClass, textClass, label, tooltipText } = getHeatmapCellProps(value);

            return (
              <div
                className={`w-full h-full min-h-[38px] flex items-center justify-center text-center p-2 ${bgClass} ${textClass} transition-colors select-none`}
                title={`${row.original.kode} (${monthLabel}): ${tooltipText}`}
              >
                <span className="w-full text-center">{label}</span>
              </div>
            );
          },
        });

        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      cols.push({
        id: "actions",
        header: "Detail",
        accessorKey: "actions",
        enableSorting: false,
        size: 80,
        cell: ({ row }) => (
          <Link
            to={`/station-availability/${row.original.kode}?year=${selectedMonth.endYear}&month=${selectedMonth.endMonth + 1}`}
            className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors shadow-2xs"
          >
            Detail
          </Link>
        ),
      });

      return cols;
    } else {
      // Daily Mode Columns
      const daysInSelectedMonth = new Date(dailyMonth.year, dailyMonth.month + 1, 0).getDate();
      const monthStr = String(dailyMonth.month + 1).padStart(2, "0");
      const monthName = MONTH_NAMES[dailyMonth.month];

      const cols: (ColumnDef<Station> & { size?: number })[] = [
        {
          id: "kode",
          header: "Kode Stasiun",
          accessorKey: "kode",
          enableSorting: true,
          size: 110,
          meta: { sticky: true },
          cell: ({ row }) => (
            <span className="font-semibold text-gray-900 tracking-wide">
              {row.original.kode}
            </span>
          ),
        },
      ];

      for (let day = 1; day <= daysInSelectedMonth; day++) {
        const dayStr = String(day).padStart(2, "0");
        const dateKey = `${dailyMonth.year}-${monthStr}-${dayStr}`;

        cols.push({
          id: dateKey,
          header: dayStr,
          accessorKey: `dailyData.${dateKey}`,
          enableSorting: true,
          size: 72,
          meta: { noPadding: true },
          cell: ({ row }) => {
            const value = row.original.dailyData[dateKey];
            const { bgClass, textClass, label, tooltipText } = getHeatmapCellProps(value);

            return (
              <div
                className={`w-full h-full min-h-[38px] flex items-center justify-center text-center px-1.5 py-2 ${bgClass} ${textClass} transition-colors select-none text-[11px] tabular-nums font-semibold`}
                title={`${row.original.kode} (${dayStr} ${monthName} ${dailyMonth.year}): ${tooltipText}`}
              >
                <span className="w-full text-center">{label}</span>
              </div>
            );
          },
        });
      }

      cols.push({
        id: "actions",
        header: "Detail",
        accessorKey: "actions",
        enableSorting: false,
        size: 80,
        cell: ({ row }) => (
          <Link
            to={`/station-availability/${row.original.kode}?year=${dailyMonth.year}&month=${dailyMonth.month + 1}`}
            className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors shadow-2xs"
          >
            Detail
          </Link>
        ),
      });

      return cols;
    }
  }, [viewMode, selectedMonth, dailyMonth]);

  // Dynamic CSV Export adapted to Monthly or Daily mode
  const handleDownloadCSV = () => {
    if (filteredData.length === 0) return;

    if (viewMode === "monthly") {
      const allMonths = new Set<string>();
      filteredData.forEach((item) => {
        Object.keys(item.monthlyData).forEach((month) => {
          allMonths.add(month);
        });
      });

      const months = Array.from(allMonths).sort();
      const formatMonth = (month: string) => {
        const date = new Date(month);
        const options = { year: "numeric", month: "long" } as const;
        return date.toLocaleDateString("id-ID", options);
      };

      let csvContent = "Kode Stasiun," + months.map(formatMonth).join(",") + "\n";

      filteredData.forEach((item) => {
        const values = months.map((month) => {
          const val = item.monthlyData[month];
          return val !== null && val !== undefined ? val.toFixed(2) : "";
        });

        csvContent += `${item.kode},${values.join(",")}\n`;
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `station_availability_monthly_${selectedMonth.startYear}-${selectedMonth.startMonth + 1}_to_${selectedMonth.endYear}-${selectedMonth.endMonth + 1}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Daily mode CSV export
      const daysInSelectedMonth = new Date(dailyMonth.year, dailyMonth.month + 1, 0).getDate();
      const monthStr = String(dailyMonth.month + 1).padStart(2, "0");
      const dayKeys: string[] = [];

      for (let day = 1; day <= daysInSelectedMonth; day++) {
        const dayStr = String(day).padStart(2, "0");
        dayKeys.push(`${dailyMonth.year}-${monthStr}-${dayStr}`);
      }

      let csvContent = "Kode Stasiun," + dayKeys.join(",") + "\n";

      filteredData.forEach((item) => {
        const values = dayKeys.map((dateKey) => {
          const val = item.dailyData[dateKey];
          return val !== null && val !== undefined ? val.toFixed(2) : "";
        });

        csvContent += `${item.kode},${values.join(",")}\n`;
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `station_availability_daily_${MONTH_NAMES[dailyMonth.month]}_${dailyMonth.year}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainLayout>
        <h1 className="text-left text-2xl font-bold mt-0 mb-2 ml-1">
          Data Availability
        </h1>

        {/* --- Top Section: Date Range, Filters & Macro Stacked Bar Chart --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="lg:w-1/5 w-full bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-700">Dari:</label>
                    <input
                      type="month"
                      value={`${selectedMonth.startYear}-${String(selectedMonth.startMonth + 1).padStart(2, "0")}`}
                      max={`${selectedMonth.endYear}-${String(selectedMonth.endMonth + 1).padStart(2, "0")}`}
                      onChange={(e) => {
                        if (!e.target.value) return;

                        const [year, month] = e.target.value.split("-").map(Number);
                        const nextStartMonth = month - 1;

                        if (
                          year > selectedMonth.endYear ||
                          (year === selectedMonth.endYear &&
                            nextStartMonth > selectedMonth.endMonth)
                        ) {
                          return;
                        }

                        setSelectedMonth({
                          ...selectedMonth,
                          startYear: year,
                          startMonth: nextStartMonth,
                        });
                      }}
                      className="border border-gray-300 bg-white px-2 py-1.5 rounded text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-700">Sampai:</label>
                    <input
                      type="month"
                      value={`${selectedMonth.endYear}-${String(selectedMonth.endMonth + 1).padStart(2, "0")}`}
                      min={`${selectedMonth.startYear}-${String(selectedMonth.startMonth + 1).padStart(2, "0")}`}
                      onChange={(e) => {
                        if (!e.target.value) return;

                        const [year, month] = e.target.value.split("-").map(Number);
                        const nextEndMonth = month - 1;

                        if (
                          year < selectedMonth.startYear ||
                          (year === selectedMonth.startYear &&
                            nextEndMonth < selectedMonth.startMonth)
                        ) {
                          return;
                        }

                        setSelectedMonth({
                          ...selectedMonth,
                          endYear: year,
                          endMonth: nextEndMonth,
                        });
                      }}
                      className="border border-gray-300 bg-white px-2 py-1.5 rounded text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {apiInfo && (
                  <div className="space-y-1.5 text-xs pt-1">
                    <div className={`px-2 py-1 rounded text-center font-medium ${apiInfo.cached ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                      {apiInfo.cached ? "📋 Cache" : "🌐 Fresh"}
                    </div>
                    <div className="text-gray-600 text-center font-medium">
                      📊 {filteredData.length !== data.length ? `${filteredData.length} / ${data.length}` : apiInfo.totalStations} Stasiun
                    </div>
                    <div className="text-gray-500 text-center text-[11px]">📅 {apiInfo.dateRange}</div>
                  </div>
                )}

                {/* Inline Accordion Filter: Kategori Availability, Prioritas, UPT, Provinsi, Jaringan */}
                {Object.keys(filterConfig).length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <TableFilters
                      filters={filters}
                      setFilters={setFilters}
                      filterConfig={filterConfig}
                      variant="inline"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="lg:w-4/5 w-full">
              <AvailabilityChartSection
                chartData={chartData}
                availabilityRanges={AVAILABILITY_CONFIG.ranges}
                chartType={chartType}
                onChartTypeChange={setChartType}
                metric={metric}
                onMetricChange={setMetric}
                minHeightClassName="min-h-[420px]"
              />
            </div>
          </div>
        </div>

        {/* --- Bottom Section: Heatmap Table, View Mode Toggle & Legend --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-sm">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <span>Memuat data ketersediaan stasiun...</span>
            </div>
          ) : (
            <div className="text-xs">
              {/* --- Toolbar: Export CSV, View Mode Toggle, Month Stepper --- */}
              <div className="flex flex-wrap items-center gap-2.5 mb-4 pb-3 border-b border-gray-100">
                <button
                  onClick={handleDownloadCSV}
                  className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-2 text-xs font-semibold shadow-2xs transition duration-200 active:scale-95"
                  title="Unduh data tabel dalam format CSV"
                >
                  <Download size={14} />
                  <span>Ekspor CSV</span>
                </button>

                {/* Mode Toggle: Bulanan vs Harian */}
                <div className="inline-flex p-0.5 bg-gray-100 rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={() => handleViewModeChange("monthly")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      viewMode === "monthly"
                        ? "bg-white text-blue-600 shadow-2xs font-bold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Calendar size={14} className={viewMode === "monthly" ? "text-blue-600" : "text-gray-500"} />
                    <span>Bulanan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewModeChange("daily")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      viewMode === "daily"
                        ? "bg-white text-blue-600 shadow-2xs font-bold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <CalendarDays size={14} className={viewMode === "daily" ? "text-blue-600" : "text-gray-500"} />
                    <span>Harian</span>
                  </button>
                </div>

                {/* Daily Month Stepper & Navigator with Scrollable Fixed Popover */}
                {viewMode === "daily" && (
                  <div
                    ref={monthDropdownRef}
                    className="relative inline-flex items-center gap-1 bg-white border border-gray-300 rounded-lg px-1.5 py-1 shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={handlePrevDailyMonth}
                      disabled={!canGoPrevMonth}
                      className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="Bulan sebelumnya"
                    >
                      <ChevronLeft size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsMonthDropdownOpen((prev) => !prev)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-gray-800 hover:text-blue-600 px-1.5 py-0.5 rounded transition"
                      title="Pilih bulan"
                    >
                      <span>{`${MONTH_NAMES[dailyMonth.month]} ${dailyMonth.year}`}</span>
                      <ChevronDown size={14} className="text-gray-500" />
                    </button>

                    <button
                      type="button"
                      onClick={handleNextDailyMonth}
                      disabled={!canGoNextMonth}
                      className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="Bulan berikutnya"
                    >
                      <ChevronRight size={15} />
                    </button>

                    {/* Fixed Height Popover Card (~5 rows height: max-h-[160px] with smooth scrollbar) */}
                    {isMonthDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1.5 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 max-h-[160px] overflow-y-auto scrollbar-thin">
                        {availableMonths.map((m) => {
                          const isSelected = m.year === dailyMonth.year && m.month === dailyMonth.month;
                          return (
                            <button
                              key={`${m.year}-${m.month}`}
                              type="button"
                              onClick={() => {
                                handleDailyMonthSelect({ year: m.year, month: m.month });
                                setIsMonthDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs transition flex items-center justify-between ${
                                isSelected
                                  ? "bg-blue-50 text-blue-600 font-bold"
                                  : "text-gray-700 hover:bg-gray-100 font-medium"
                              }`}
                            >
                              <span>{m.label}</span>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* DataTable with Heatmap Cells and Sticky First Column */}
              <div className="min-w-full">
                <DataTable
                  columns={columns}
                  data={filteredData}
                  searchPlaceholder="Cari Stasiun"
                />
              </div>
            </div>
          )}
        </div>
      </MainLayout>
    </div>
  );
};

export default StationAvailability;
