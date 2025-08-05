import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import ReactDOM from 'react-dom/client';
import '../index.css'; // pastikan ini masuk

const root = ReactDOM.createRoot(document.getElementById('root'));

const DropdownComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("Select an option");
  const options = ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"];
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    setSelected(option);
    setIsOpen(false);
  };

  return (
    <div className="w-64 relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center px-4 py-3 bg-white text-gray-700 rounded-xl shadow-md border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200"
      >
        <span className="truncate">{selected}</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      <div
        className={`absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transform transition-all duration-200 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        {options.map((option, index) => (
          <div
            key={index}
            onClick={() => handleSelect(option)}
            className="px-4 py-3 text-gray-700 cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-all duration-150"
          >
            {option}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DropdownComponent;
