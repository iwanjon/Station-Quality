import { useState, useMemo, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import TableFilters from "../components/TableFilters";
import type { FilterConfig } from "../components/TableFilters";
import DataTable from "../components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import axiosInstance from "../utilities/Axios";

// Konfigurasi filter
const filterConfig: Record<string, FilterConfig> = {
  station: {
    label: "Station",
    type: "multi",
    options: ["Station A", "Station B", "Station C"],
  },
  date: {
    label: "Date",
    type: "date",
  },
  status: {
    label: "Status",
    type: "multi",
    options: ["Active", "Inactive"],
  },
  location: {
    label: "Location",
    type: "multi",
    options: ["Location A", "Location B", "Location C"],
  },
};

// Tipe data station
interface Station {
  id: number;
  net: string;
  kode: string;
  lokasi: string;
  upt: string;
  jaringan: string;
  availability: number[];
}

const StationAvailability = () => {
  const [data, setData] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data dari JSON
  useEffect(() => {
    axiosInstance
      .get("/data/stationData.json")
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error("Error fetching station data:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filterConfig: Record<string, FilterConfig> = {
    net: {
      label: "Net",
      type: "multi",
      options: ["Net A", "Net B", "Net C"], // sesuaikan dengan data asli
    },
    lokasi: {
      label: "Lokasi",
      type: "multi",
      options: ["Lokasi A", "Lokasi B", "Lokasi C"], // sesuaikan dengan data asli
    },
    // Hapus 'date' dan 'status' jika tidak ada
  };

  const [filters, setFilters] = useState<Record<string, any>>({
    net: [],
    lokasi: [],
  });

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Filter net
      if (filters.net.length > 0 && !filters.net.includes(item.net)) {
        return false;
      }
      // Filter lokasi
      if (filters.lokasi.length > 0 && !filters.lokasi.includes(item.lokasi)) {
        return false;
      }
      return true;
    });
  }, [filters, data]);


  // Kolom untuk TanStack Table
  const columns: ColumnDef<Station>[] = [
    { header: "Id", accessorKey: "id", enableSorting: false},
    { header: "Net", accessorKey: "net", enableSorting: false },
    { header: "Kode", accessorKey: "kode", enableSorting: false },
    { header: "Lokasi", accessorKey: "lokasi", enableSorting: true },
    { header: "UPT", accessorKey: "upt", enableSorting: false },
    { header: "Jaringan", accessorKey: "jaringan", enableSorting: false },
    { header: "Availability", columns: [
        {
        header: "Januari",
        accessorFn: row => row.availability[0], // index 0 = Januari
        },
        {
          header: "Februari",
          accessorFn: row => row.availability[1], // index 1 = Februari
        },
        {
          header: "Maret",
          accessorFn: row => row.availability[2], // index 2 = Maret
        },
      ] },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainLayout>
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <h1 className="bg-gray-100 rounded-2xl text-center text-4xl font-bold my-4 mx-48 py-2 border-2">
            Stasiun Availability
          </h1>
          <TableFilters
            filters={filters}
            setFilters={setFilters}
            filterConfig={filterConfig}
          />
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          {loading ? (
            <p className="text-center text-gray-500">Loading data...</p>
          ) : (
            <DataTable columns={columns} data={filteredData} />
          )}
        </div>
      </MainLayout>
    </div>
  );
};

export default StationAvailability;
