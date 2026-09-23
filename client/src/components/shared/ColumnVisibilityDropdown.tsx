import { useEffect, useRef, useState } from "react";

export interface ColumnVisibilityOption {
  key: string;
  label: string;
}

interface ColumnVisibilityDropdownProps {
  columns: ColumnVisibilityOption[];
  visibleColumns: Record<string, boolean>;
  onToggleColumn: (columnKey: string) => void;
}

const ColumnVisibilityDropdown = ({
  columns,
  visibleColumns,
  onToggleColumn,
}: ColumnVisibilityDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="border border-gray-300 bg-white px-3 py-2 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        Show/Hide Columns <span aria-hidden="true">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 w-64 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <div className="space-y-2">
            {columns.map((column) => {
              const isVisible = visibleColumns[column.key] ?? false;

              return (
                <label
                  key={column.key}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => onToggleColumn(column.key)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>{column.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnVisibilityDropdown;