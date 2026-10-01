import React, { useState, useRef, useEffect, useMemo } from "react";
import { Filter, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export type FilterType = "multi" | "date" | (string & {});

export interface FilterConfig {
  label: string;
  type: FilterType;
  options?: string[]; // List of options for 'multi' type
}

interface TableFiltersProps {
  filters: Record<string, any>;
  setFilters: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  filterConfig: Record<string, FilterConfig>;
  closeOnClickOutside?: boolean;
  variant?: "popover" | "inline";
}

/**
 * Option count threshold:
 * - Options <= 5 (Priority, Summary, Status): Displayed directly as inline checkboxes.
 * - Options > 5 (UPT, Network, Province, Year): Displayed as searchable dropdown checkboxes.
 */
const COMPACT_OPTIONS_THRESHOLD = 5;

const TableFilters: React.FC<TableFiltersProps> = ({
  filters,
  setFilters,
  filterConfig,
  closeOnClickOutside,
  variant = "popover",
}) => {
  const isInline = variant === "inline";
  const shouldCloseOutside = closeOnClickOutside !== undefined ? closeOnClickOutside : !isInline;

  // Primary filter panel toggle state
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Active sub-dropdown state for categories with > 5 options (UPT, Province, etc.)
  const [activeSubDropdown, setActiveSubDropdown] = useState<string | null>(null);

  // Search queries for filtering options inside sub-dropdowns
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  // Refs for click-outside detection
  const mainFilterRef = useRef<HTMLDivElement>(null);
  const subDropdownRef = useRef<HTMLDivElement>(null);

  // 1. Calculate active filters count
  const totalActiveFilters = useMemo(() => {
    return Object.keys(filterConfig).reduce((count, key) => {
      const val = filters[key];
      if (Array.isArray(val) && val.length > 0) return count + val.length;
      if (val && !Array.isArray(val)) return count + 1;
      return count;
    }, 0);
  }, [filters, filterConfig]);

  // 2. Categorize filter configurations (Compact <= 5 vs Expandable > 5 vs Date)
  const { compactFilters, expandableFilters, dateFilters } = useMemo(() => {
    const compact: string[] = [];
    const expandable: string[] = [];
    const dates: string[] = [];

    Object.keys(filterConfig).forEach((key) => {
      const config = filterConfig[key];
      if (config.type === "date") {
        dates.push(key);
      } else if (config.type === "multi" && config.options) {
        if (config.options.length <= COMPACT_OPTIONS_THRESHOLD) {
          compact.push(key);
        } else {
          expandable.push(key);
        }
      }
    });

    return { compactFilters: compact, expandableFilters: expandable, dateFilters: dates };
  }, [filterConfig]);

  // 3. Click-outside listener for closing main panel (active in popover mode or when explicitly set)
  useEffect(() => {
    if (!shouldCloseOutside) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        mainFilterRef.current &&
        !mainFilterRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveSubDropdown(null);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, shouldCloseOutside]);

  // 4. Click-outside listener for closing active sub-dropdown
  useEffect(() => {
    const handleSubClickOutside = (event: MouseEvent) => {
      if (
        subDropdownRef.current &&
        !subDropdownRef.current.contains(event.target as Node)
      ) {
        setActiveSubDropdown(null);
      }
    };

    if (activeSubDropdown) {
      document.addEventListener("mousedown", handleSubClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleSubClickOutside);
    };
  }, [activeSubDropdown]);

  // 5. Toggle a specific checkbox option
  const handleToggleOption = (fieldKey: string, optionValue: string) => {
    const currentValues: string[] = Array.isArray(filters[fieldKey])
      ? [...filters[fieldKey]]
      : [];

    const index = currentValues.indexOf(optionValue);
    if (index > -1) {
      currentValues.splice(index, 1);
    } else {
      currentValues.push(optionValue);
    }

    setFilters((prev) => ({
      ...prev,
      [fieldKey]: currentValues,
    }));
  };

  // 6. Select all options in a category
  const handleSelectAll = (fieldKey: string, options: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [fieldKey]: [...options],
    }));
  };

  // 7. Clear all options in a single category
  const handleClearCategory = (fieldKey: string) => {
    setFilters((prev) => ({
      ...prev,
      [fieldKey]: [],
    }));
  };

  // 8. Reset all filters
  const handleClearAll = () => {
    const cleared = Object.keys(filterConfig).reduce(
      (acc, key) => ({
        ...acc,
        [key]: filterConfig[key].type === "multi" ? [] : null,
      }),
      {}
    );
    setFilters(cleared);
    setSearchQueries({});
  };

  return (
    <div
      className={isInline ? "w-full text-left" : "relative inline-block text-left"}
      ref={mainFilterRef}
    >
      {/* 1. FILTER TRIGGER BUTTON */}
      <div className={`flex items-center gap-2 ${isInline ? "w-full" : ""}`}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-sm font-medium transition-colors shadow-sm ${
            isInline ? "w-full justify-between" : ""
          } ${
            isOpen || totalActiveFilters > 0
              ? "bg-blue-50 border-blue-500 text-blue-700"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
          }`}
          title="Buka opsi filter"
        >
          <div className="flex items-center gap-1.5">
            <Filter size={14} className={totalActiveFilters > 0 ? "text-blue-600" : "text-gray-500"} />
            <span>Filter</span>

            {totalActiveFilters > 0 && (
              <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold leading-none">
                {totalActiveFilters}
              </span>
            )}
          </div>

          {isOpen ? (
            <ChevronUp size={14} className="text-gray-400 ml-0.5" />
          ) : (
            <ChevronDown size={14} className="text-gray-400 ml-0.5" />
          )}
        </button>

        {/* Reset button when filters are active */}
        {totalActiveFilters > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2.5 py-1.5 rounded text-xs font-medium transition-colors shrink-0"
            title="Reset semua filter"
          >
            Reset
          </button>
        )}
      </div>

      {/* 2. FILTER PANEL (INLINE ACCORDION OR ABSOLUTE POPOVER) */}
      {isOpen && (
        <div
          className={
            isInline
              ? "w-full mt-2.5 bg-gray-50/80 rounded-lg border border-gray-200 p-3.5 transition-all shadow-sm"
              : "absolute left-0 mt-1.5 z-[999] w-[92vw] sm:w-[580px] md:w-[680px] bg-white rounded-md shadow-lg border border-gray-300 p-4 transition-all"
          }
        >
          {/* Header Panel */}
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              {isInline ? "Opsi Filter" : "Filter Data Stasiun"}
            </span>

            <div className="flex items-center gap-2">
              {totalActiveFilters > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-red-600 hover:underline font-medium"
                >
                  Reset Semua
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
                title="Tutup"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div
            className={`space-y-3.5 overflow-y-auto pr-1 ${
              isInline ? "max-h-[55vh]" : "max-h-[68vh]"
            }`}
          >
            {/* 1. COMPACT CATEGORIES (<= 5 OPTIONS) - INLINE CHECKBOXES */}
            {compactFilters.length > 0 && (
              <div
                className={
                  isInline
                    ? "flex flex-col gap-3 pt-0.5"
                    : "grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 pt-1"
                }
              >
                {compactFilters.map((key) => {
                  const config = filterConfig[key];
                  const activeValues: string[] = filters[key] || [];

                  return (
                    <div key={key} className="flex flex-col">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-gray-700">
                          {config.label}:
                        </label>
                        {activeValues.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleClearCategory(key)}
                            className="text-[11px] text-gray-400 hover:text-red-600"
                          >
                            Hapus
                          </button>
                        )}
                      </div>

                      {/* Checkbox Items */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                        {config.options?.map((opt) => {
                          const isChecked = activeValues.includes(opt);

                          return (
                            <label
                              key={opt}
                              className="inline-flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer select-none hover:text-gray-900"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleOption(key, opt)}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Separator between compact and expandable filters */}
            {compactFilters.length > 0 && expandableFilters.length > 0 && (
              <div className="border-t border-gray-200"></div>
            )}

            {/* 2. EXPANDABLE CATEGORIES (> 5 OPTIONS) - DROPDOWN CHECKBOX */}
            {expandableFilters.length > 0 && (
              <div>
                <div
                  className={
                    isInline
                      ? "flex flex-col gap-2.5"
                      : "grid grid-cols-1 sm:grid-cols-3 gap-3"
                  }
                  ref={subDropdownRef}
                >
                  {expandableFilters.map((key) => {
                    const config = filterConfig[key];
                    const activeValues: string[] = filters[key] || [];
                    const isSubOpen = activeSubDropdown === key;
                    const query = (searchQueries[key] || "").toLowerCase();

                    // Filter option list based on search query
                    const filteredOptions = (config.options || []).filter((opt) =>
                      opt.toLowerCase().includes(query)
                    );

                    return (
                      <div key={key} className="flex flex-col relative">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-gray-700">
                            {config.label}:
                          </label>
                          {activeValues.length > 0 && (
                            <span className="text-[11px] text-blue-600 font-medium">
                              ({activeValues.length} dipilih)
                            </span>
                          )}
                        </div>

                        {/* Dropdown trigger button */}
                        <button
                          type="button"
                          onClick={() =>
                            setActiveSubDropdown(isSubOpen ? null : key)
                          }
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs border rounded bg-white transition-colors ${
                            activeValues.length > 0
                              ? "border-blue-500 text-blue-800 bg-blue-50/30"
                              : "border-gray-300 text-gray-600 hover:border-gray-400"
                          }`}
                        >
                          <span className="truncate">
                            {activeValues.length > 0
                              ? activeValues.slice(0, 2).join(", ") +
                                (activeValues.length > 2 ? "..." : "")
                              : `Pilih ${config.label}...`}
                          </span>
                          {isSubOpen ? (
                            <ChevronUp size={14} className="text-gray-400 ml-1 shrink-0" />
                          ) : (
                            <ChevronDown size={14} className="text-gray-400 ml-1 shrink-0" />
                          )}
                        </button>

                        {/* Sub-dropdown Menu */}
                        {isSubOpen && (
                          <div
                            className={
                              isInline
                                ? "w-full mt-1.5 bg-white border border-gray-300 rounded shadow-sm p-2.5"
                                : "absolute left-0 top-full mt-1 w-64 bg-white border border-gray-300 rounded shadow-md p-2.5 z-[1000]"
                            }
                          >
                            {/* Simple Search Input */}
                            <div className="relative mb-2">
                              <Search
                                size={12}
                                className="text-gray-400 absolute left-2.5 top-2"
                              />
                              <input
                                type="text"
                                placeholder={`Cari ${config.label}...`}
                                value={searchQueries[key] || ""}
                                onChange={(e) =>
                                  setSearchQueries((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }))
                                }
                                className="w-full pl-7 pr-6 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                autoFocus
                              />
                              {searchQueries[key] && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSearchQueries((prev) => ({
                                      ...prev,
                                      [key]: "",
                                    }))
                                  }
                                  className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>

                            {/* Select All / Clear Selection Shortcuts */}
                            <div className="flex justify-between items-center px-1 pb-1 mb-1.5 border-b border-gray-100 text-[11px]">
                              <button
                                type="button"
                                onClick={() =>
                                  handleSelectAll(key, config.options || [])
                                }
                                className="text-blue-600 hover:underline"
                              >
                                Pilih Semua
                              </button>
                              <button
                                type="button"
                                onClick={() => handleClearCategory(key)}
                                className="text-gray-500 hover:text-red-600"
                              >
                                Hapus Pilihan
                              </button>
                            </div>

                            {/* Scrollable Checkbox List */}
                            <div className="max-h-40 overflow-y-auto space-y-0.5 pr-1">
                              {filteredOptions.length === 0 ? (
                                <p className="text-center text-gray-400 text-xs py-2">
                                  Tidak ada opsi cocok
                                </p>
                              ) : (
                                filteredOptions.map((opt) => {
                                  const isChecked = activeValues.includes(opt);

                                  return (
                                    <label
                                      key={opt}
                                      className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-gray-100 text-xs cursor-pointer select-none text-gray-700"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() =>
                                          handleToggleOption(key, opt)
                                        }
                                        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                      />
                                      <span className="truncate" title={opt}>
                                        {opt}
                                      </span>
                                    </label>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. DATE FILTER TYPE (IF CONFIGURED) */}
            {dateFilters.length > 0 && (
              <div className="pt-2 border-t border-gray-200">
                <div
                  className={
                    isInline
                      ? "flex flex-col gap-2.5"
                      : "grid grid-cols-1 sm:grid-cols-2 gap-3"
                  }
                >
                  {dateFilters.map((key) => {
                    const config = filterConfig[key];
                    return (
                      <div key={key} className="flex flex-col">
                        <label className="text-xs font-semibold text-gray-700 mb-1">
                          {config.label}:
                        </label>
                        <DatePicker
                          selected={filters[key] || null}
                          onChange={(date) =>
                            setFilters((prev) => ({ ...prev, [key]: date }))
                          }
                          className="border border-gray-300 rounded p-1.5 text-xs w-full focus:outline-none focus:border-blue-500"
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Pilih tanggal"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 🏁 FOOTER PANEL */}
          <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-gray-200">
            <span className="text-xs text-gray-500">
              {totalActiveFilters > 0
                ? `${totalActiveFilters} filter aktif`
                : "Semua data"}
            </span>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableFilters;