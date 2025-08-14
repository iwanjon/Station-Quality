import React from "react";
import Select, { components } from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export type FilterType = "multi" | "date" | (string & {});

export interface FilterConfig {
  label: string;
  type: FilterType;
  options?: string[]; // for multi
}

interface TableFiltersProps {
  filters: Record<string, any>;
  setFilters: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  filterConfig: Record<string, FilterConfig>;
  closeOnClickOutside?: boolean;
}

// Override ValueContainer untuk custom ringkasan pilihan
const ValueContainer = ({ children, ...props }: any) => {
  const { getValue, hasValue } = props;
  const selected = getValue();

  if (!hasValue || !selected || selected.length === 0) {
    return <components.ValueContainer {...props}>{children}</components.ValueContainer>;
  }

  const maxShow = 2;
  const labels = selected.map((item: any) => item.label);
  const displayLabels =
    labels.length > maxShow ? labels.slice(0, maxShow).join(", ") + ", ..." : labels.join(", ");

  return (
    <components.ValueContainer {...props}>
      <div
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "100%",
          padding: "0 8px",
          lineHeight: "38px",
          fontSize: "0.875rem",
          color: "#555",
        }}
        title={labels.join(", ")}
      >
        {displayLabels}
      </div>
    </components.ValueContainer>
  );
};

// Hide MultiValue chips supaya gak muncul
const MultiValue = () => null;

const TableFilters: React.FC<TableFiltersProps> = ({
  filters,
  setFilters,
  filterConfig,
}) => {
  const handleChange = (field: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClear = () => {
    const cleared = Object.keys(filterConfig).reduce(
      (acc, key) => ({
        ...acc,
        [key]: filterConfig[key].type === "multi" ? [] : null,
      }),
      {}
    );
    setFilters(cleared);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        {Object.keys(filterConfig).map((key) => {
          const config = filterConfig[key];
          return (
            <div
              key={key}
              className="flex flex-col min-w-[200px] max-w-[200px]"
            >
              <label className="mb-1 font-medium">{config.label}:</label>
              {config.type === "multi" && config.options ? (
                <Select
                  isMulti
                  closeMenuOnSelect={false}
                  options={config.options.map((opt) => ({
                    label: opt,
                    value: opt,
                  }))}
                  value={
                    filters[key]?.map((f: string) => ({
                      label: f,
                      value: f,
                    })) || []
                  }
                  onChange={(values) =>
                    handleChange(
                      key,
                      values ? values.map((v: any) => v.value) : []
                    )
                  }
                  placeholder="Select an option"
                  className="text-sm"
                  components={{ MultiValue, ValueContainer }}
                  hideSelectedOptions={false}
                  inputValue=""
                />
              ) : (
                <DatePicker
                  selected={filters[key] || null}
                  onChange={(date) => handleChange(key, date)}
                  className="border rounded p-2 text-sm w-full"
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select date"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button
          className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 text-sm"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default TableFilters;  