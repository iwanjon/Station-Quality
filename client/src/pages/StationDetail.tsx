import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import CardContainer from "../components/Card";

export interface StationMetadata {
  id_stasiun: number;
  net: string;
  id: number;
  kode: string;
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
  keterangan: string;
  accelerometer: string;
  digitizer_komunikasi: string;
  tipe_shelter: string;
  lokasi_shelter: string;
  penjaga_shelter: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const StasiunDetail = () => {
  const { id } = useParams<{ id: string }>(); // ambil id dari URL
  const [station, setStation] = useState<StationMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/stasiun/${id}`);
      if (!res.ok) throw new Error("Gagal mengambil data detail stasiun");
      const data: StationMetadata = await res.json();
      setStation(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <p className="p-8">Memuat data...</p>
      </MainLayout>
    );
  }

  if (!station) {
    return (
      <MainLayout>
        <p className="p-8">Data stasiun tidak ditemukan</p>
      </MainLayout>
    );
  }

  return (
  <MainLayout className="p-8">
    {loading && <p>Memuat data...</p>}
    {!loading && !station && <p>Data stasiun tidak ditemukan</p>}
    {!loading && station && (
      <>
        <h1 className="text-2xl font-bold text-center mb-6">
          Stasiun {station.lokasi}
        </h1>
        {/* ...card-card detail di sini */}
      </>
    )}
  </MainLayout>
);

};

export default StasiunDetail;
