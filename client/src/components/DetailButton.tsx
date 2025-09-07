import React from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";

interface DetailButtonProps {
  id: number;
}

const DetailButton: React.FC<DetailButtonProps> = ({ id }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/station-availability/${id}`);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors duration-200 text-sm"
      title="Lihat Detail"
    >
      <Eye size={16} />
      Detail
    </button>
  );
};

export default DetailButton;
