import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import axiosInstance from "../utilities/Axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Tipe data station
interface Station {
  id: number;
  net: string;
  kode: string;
  lokasi: string;
  upt: string;
  jaringan: string;
  availability: number[];
  lat?: number;
  lng?: number;
}

  // Custom marker icon (optional)
  const stationIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

const StationMap = () => {
  const [data, setData] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data dari JSON
  useEffect(() => {
    axiosInstance
      .get("/api/stasiun")
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

  console.log(data);
  // Default center Indonesia
  const center: [number, number] = [-2.5, 118];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainLayout>
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <h1 className="bg-gray-100 rounded-2xl text-center text-3xl font-bold my-2 mx-48">
            Stasiun Map
          </h1>
        </div>
        <div className="w-full h-[70vh] rounded-xl overflow-hidden">
          <MapContainer center={center} zoom={5} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {!loading &&
              data.map((station) =>
                station.lat && station.lng ? (
                  <Marker
                    key={station.id}
                    position={[station.lat, station.lng]}
                    icon={stationIcon}
                  >
                    <Popup>
                      <div>
                        <strong>{station.kode}</strong>
                        <br />
                        {station.lokasi}
                        <br />
                        Jaringan: {station.jaringan}
                        <br />
                        UPT: {station.upt}
                      </div>
                    </Popup>
                  </Marker>
                ) : null
              )}
          </MapContainer>
        </div>
      </MainLayout>
    </div>
  );
};

export default StationMap;
