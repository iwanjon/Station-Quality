import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosServer from "../utilities/AxiosServer";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import CardContainer from "../components/Card"; // pastikan path sesuai

interface QCData {
  date: string;
  rms: number;
  amplitude_ratio: number;
  availability: number;
}

const StationDetail = () => {
  const { stationCode } = useParams();
  const [qcData, setQcData] = useState<QCData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosServer.get(`/api/qc/data/detail/7days/${stationCode}`);
        setQcData(res.data);
      } catch (err) {
        console.error("Error fetching QC 7days:", err);
      }
    };
    if (stationCode) fetchData();
  }, [stationCode]);

  return (
    <div className="p-6">
      {/* Judul */}
      <h1 className="text-center text-lg font-semibold mb-6">
        Detail Stasiun {stationCode}
      </h1>

      {/* Grid 2x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RMS */}
        <CardContainer>
          <h2 className="text-base font-medium mb-2">RMS</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={qcData}>
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="rms" stroke="#8884d8" name="RMS" />
            </LineChart>
          </ResponsiveContainer>
        </CardContainer>

        {/* Amplitude Ratio */}
        <CardContainer>
          <h2 className="text-base font-medium mb-2">Amplitude Ratio</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={qcData}>
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="amplitude_ratio" stroke="#82ca9d" name="Amplitude Ratio" />
            </LineChart>
          </ResponsiveContainer>
        </CardContainer>

        {/* Availability */}
        {/* <CardContainer>
          <h2 className="text-base font-medium mb-2">Availability</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={qcData}>
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="availability" stroke="#ff7300" name="Availability" />
            </LineChart>
          </ResponsiveContainer>
        </CardContainer> */}

        {/* Placeholder / Metric lain */}
        {/* <CardContainer>
          <h2 className="text-base font-medium mb-2">Metric Lain</h2>
          <div className="flex items-center justify-center text-gray-400 h-[200px]">
            Coming Soon
          </div>
        </CardContainer> */}
      </div>
    </div>
  );
};

export default StationDetail;
