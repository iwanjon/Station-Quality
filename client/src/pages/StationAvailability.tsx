import { useState } from "react";
import Footer from "../components/Footer";
import MainLayout from "../layouts/MainLayout";

const StationQuality = () => {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    year: "",
    province: "",
    upt: "",
    network: "",
    history: "",
  });

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
  };

  const tableData = [
    {
      no: 1,
      kode: "BIA",
      nama: "Fayhe Bantyan, Barat, Aceh",
      lokasi: "Straight-Austin Coma",
      upt: "ACFM March 2023",
      jaringan: "Net A",
      jan: 100,
      jul: 100,
      agustus: 100,
    },
    {
      no: 2,
      kode: "LWA",
      nama: "Jln DR Tdjohan Lubis, Meulaboh, Aceh",
      lokasi: "Straight-Austin Coma",
      upt: "Type A",
      jaringan: "Net B",
      jan: 100,
      jul: 100,
      agustus: 100,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainLayout>
        {/* Judul */}
        <h1 className="text-center text-2xl font-bold my-4">
          Stasiun Availability
        </h1>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow flex flex-wrap justify-center gap-3 mb-6">
          {[
            "Start Date",
            "End Date",
            "Year",
            "Province",
            "UPT Penanggung Jawab",
            "Jaringan",
            "History",
          ].map((label, idx) => (
            <select
              key={idx}
              className="border rounded-lg p-2 text-sm"
              onChange={(e) =>
                handleFilterChange(label.toLowerCase(), e.target.value)
              }
            >
              <option>Select an option</option>
            </select>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 border">No</th>
                <th className="p-3 border">Kode</th>
                <th className="p-3 border">Nama</th>
                <th className="p-3 border">Lokasi</th>
                <th className="p-3 border">UPT</th>
                <th className="p-3 border">Jaringan</th>
                <th className="p-3 border">Aksi</th>
                <th className="p-3 border text-center">Jan</th>
                <th className="p-3 border text-center">Jul</th>
                <th className="p-3 border text-center">Agustus</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.no} className="hover:bg-gray-50">
                  <td className="p-3 border">{row.no}</td>
                  <td className="p-3 border">{row.kode}</td>
                  <td className="p-3 border">{row.nama}</td>
                  <td className="p-3 border">{row.lokasi}</td>
                  <td className="p-3 border">{row.upt}</td>
                  <td className="p-3 border">{row.jaringan}</td>
                  <td className="p-3 border text-center">
                    <button className="bg-red-800 text-white px-3 py-1 rounded">
                      Lihat Detail
                    </button>
                  </td>
                  <td className="p-3 border text-center">{row.jan}</td>
                  <td className="p-3 border text-center">{row.jul}</td>
                  <td className="p-3 border text-center">{row.agustus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 mt-4">
          <button className="px-3 py-1 border rounded text-sm">
            &lt; Previous
          </button>
          <span className="px-3 py-1 border rounded bg-gray-200 text-sm">1</span>
          <span className="px-3 py-1 border rounded text-sm">2</span>
          <span className="px-3 py-1 border rounded text-sm">3</span>
          <button className="px-3 py-1 border rounded text-sm">Next &gt;</button>
        </div>
      </MainLayout>
      <Footer />
    </div>
  );
};

export default StationQuality;
