import React from "react";
import { useNavigate } from "react-router-dom";

interface DetailButtonProps {
  id: number;
}

const DetailButton: React.FC<DetailButtonProps> = ({ id }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/detail/${id}`);
  };

  return (
    <button
      onClick={handleClick}
      className="px-2 py-1 bg-black text-white rounded hover:bg-blue-700"
    >
      Lihat Detail
    </button>
  );
};

export default DetailButton;
