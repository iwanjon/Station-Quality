// src/pages/StationPerformance.tsx

import { useEffect, useState, useMemo } from "react";
import MainLayout from "../layouts/MainLayout.tsx";
import DataTable from "../components/DataTable.tsx";
import TableFilters from "../components/TableFilters";
import type { FilterConfig } from "../components/TableFilters";
import type { ColumnDef } from "@tanstack/react-table";
import { useNavigate, Link } from "react-router-dom";
import axiosServer from "../utilities/AxiosServer.tsx";
import dayjs from "dayjs";
import CardContainer from "../components/Card.tsx";
import StatusBadge from "../components/StatusBadge";

// --- tipe & interface (sinkron dengan StationQuality) ---
interface QCSummary {
  code: string;
  quality_percentage: number | null;
  result: string | null;
}

interface StationMetadata {
  stasiun_id: number;
  net: string;
  id: number;
  kode_stasiun: string;
  lintang: number;
  bujur: number;
  elevasi: number;
  lokasi: string;
  provinsi: string;
  upt_penanggung_jawab: string;
  status: string;
  tahun_instalasi_site: number;
  jaringan: string;
  prioritas: string;
  keterangan: string | null;
  accelerometer: string;
  digitizer_komunikasi: string;
  tipe_shelter: string | null;
  lokasi_shelter: string;
  penjaga_shelter: string;
  result: string | null;
}

interface StasiunDenganSummary extends StationMetadata {
  quality_percentage: number | null;
}

// Komponen halaman StationPerformance (meniru desain & filter tabel StationQuality)
const StationPerformance = () => {
  const [stationData, setStationData] = useState<StationMetadata[]>([]);
  const [qcSummaryData, setQcSummaryData] = useState<QCSummary[]>([]);
  const [siteQualityMap, setSiteQualityMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [filterConfig, setFilterConfig] = useState<Record<string, FilterConfig>>({});
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const navigate = useNavigate();

  const fetchStationMetadata = async () => {
    try {
      setLoading(true);
      const res = await axiosServer.get("/api/stasiun");
      setStationData(res.data || []);
    } catch (err) {
      console.error("Error fetching stations:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQCSummary = async () => {
    try {
      const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
      const res = await axiosServer.get(`/api/qc/summary/${yesterday}`);
      setQcSummaryData(res.data || []);
    } catch (err) {
      console.error("Error fetching QC summary:", err);
    }
  };

  const fetchAllSiteQuality = async (codes: string[]) => {
    const map: Record<string, string> = {};
    await Promise.all(
      codes.map(async (code) => {
        try {
          const res = await axiosServer.get(`/api/qc/site/detail/${code}`);
          if (res.data && res.data[0] && res.data[0].site_quality) {
            map[code] = res.data[0].site_quality;
          } else map[code] = "-";
        } catch {
          map[code] = "-";
        }
      })
    );
    setSiteQualityMap(map);
  };

  useEffect(() => {
    const saved = localStorage.getItem("stationPerformanceFilters");
    if (saved) setFilters(JSON.parse(saved));
    fetchStationMetadata();
    fetchQCSummary();
  }, []);

  useEffect(() => {
    if (stationData.length > 0) {
      const codes = stationData.map((s) => s.kode_stasiun);
      fetchAllSiteQuality(codes);

      const getUniqueOptions = (key: keyof StationMetadata): string[] => {
        const allValues = stationData.map((item) => item[key]);
        return [...new Set(allValues)].filter(Boolean).sort() as string[];
      };

      const dynamicFilterConfig: Record<string, FilterConfig> = {
        prioritas: { label: "Prioritas", type: "multi", options: getUniqueOptions("prioritas") },
        upt_penanggung_jawab: { label: "UPT", type: "multi", options: getUniqueOptions("upt_penanggung_jawab") },
        jaringan: { label: "Jaringan", type: "multi", options: getUniqueOptions("jaringan") },
        provinsi: { label: "Provinsi", type: "multi", options: getUniqueOptions("provinsi") },
      };
      setFilterConfig(dynamicFilterConfig);
    }
  }, [stationData]);

  const dataStasiunLengkap = useMemo<StasiunDenganSummary[]>(() => {
    if (stationData.length === 0) return [];
    const summaryMap = new Map(qcSummaryData.map((item) => [item.code, item]));
    return stationData.map((station) => {
      const summary = summaryMap.get(station.kode_stasiun);
      return {
        ...station,
        quality_percentage: summary ? summary.quality_percentage : null,
        result: summary ? summary.result : station.result,
      };
    });
  }, [stationData, qcSummaryData]);

  const filteredData = useMemo(() => {
    const activeKeys = Object.keys(filters).filter((k) => filters[k] && filters[k].length > 0);
    let ds = dataStasiunLengkap;
    if (activeKeys.length > 0) {
      ds = ds.filter((station) => activeKeys.every((key) => filters[key].includes(station[key as keyof StationMetadata])));
    }
    if (globalFilter && globalFilter.trim() !== "") {
      const s = globalFilter.toLowerCase();
      ds = ds.filter((station) => Object.values(station).join(" ").toLowerCase().includes(s));
    }
    return ds;
  }, [dataStasiunLengkap, filters, globalFilter]);

  const columns: ColumnDef<StasiunDenganSummary>[] = [
    { accessorKey: "stasiun_id", header: "No" },
    { accessorKey: "kode_stasiun", header: "Kode Stasiun" },
    { accessorKey: "lokasi", header: "Lokasi" },
    { accessorKey: "provinsi", header: "Province" },
    { accessorKey: "jaringan", header: "Group" },
    { accessorKey: "prioritas", header: "Prioritas" },
    { accessorKey: "upt_penanggung_jawab", header: "UPT" },
    {
      id: "detail",
      header: "Detail Stasiun",
      // arahkan ke halaman PerformanceDetail
      cell: ({ row }) => (
        <Link to={`/performance-detail/${row.original.kode_stasiun}`} className="text-blue-600 hover:underline text-sm font-medium">
          Detail
        </Link>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainLayout>
        <h1 className="text-left text-2xl font-bold mt-0 mb-2 ml-1">Station Performance</h1>

        <CardContainer className="mb-4 p-3">
          <div className="flex justify-between items-center mb-4">
            <TableFilters filters={filters} setFilters={setFilters} filterConfig={filterConfig} />
            <div className="flex items-center gap-2">
            </div>
          </div>

          {loading && <p>Loading station data...</p>}
          {!loading && (
            <DataTable
              columns={columns}
              data={filteredData}
              globalFilter={globalFilter}
              setGlobalFilter={setGlobalFilter}
            />
          )}
        </CardContainer>
      </MainLayout>
    </div>
  );
};

export default StationPerformance;