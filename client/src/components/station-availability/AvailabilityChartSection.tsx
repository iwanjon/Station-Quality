import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AvailabilityRange {
  key: string;
  label: string;
  chartColor: string;
  legendColor: string;
}

interface ChartDataPoint {
  month: string;
  counts: Record<string, number>;
  [key: string]: string | number | Record<string, number>;
}

type ChartType = "stacked" | "line" | "grouped";
type Metric = "count" | "percentage";

interface AvailabilityChartSectionProps {
  chartData: ChartDataPoint[];
  availabilityRanges: AvailabilityRange[];
  chartType: ChartType;
  onChartTypeChange: (value: ChartType) => void;
  metric: Metric;
  onMetricChange: (value: Metric) => void;
  minHeightClassName?: string;
}

const AvailabilityChartSection = ({
  chartData,
  availabilityRanges,
  chartType,
  onChartTypeChange,
  metric,
  onMetricChange,
  minHeightClassName = "min-h-[420px]",
}: AvailabilityChartSectionProps) => {
  const isPercentage = metric === "percentage";

  const getValue = (point: ChartDataPoint, rangeKey: string) => {
    if (isPercentage) {
      return Number(point[rangeKey] ?? 0);
    }

    return Number(point.counts[rangeKey] ?? 0);
  };

  const getYAxisTicks = () => {
    if (!isPercentage) {
      const maxCount = chartData.reduce((max, point) => {
        const total = Object.values(point.counts).reduce((sum, count) => sum + count, 0);
        return Math.max(max, total);
      }, 0);

      if (maxCount <= 10) {
        return Array.from({ length: maxCount + 1 }, (_, index) => index);
      }

      const step = Math.ceil(maxCount / 5);
      return Array.from({ length: 6 }, (_, index) => Math.min(index * step, maxCount));
    }

    return [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  };

  const renderAvailabilityTooltip = ({
    active,
    payload,
    label,
  }: any) => {
    if (!active || !payload?.length) return null;

    const point = payload[0]?.payload as ChartDataPoint | undefined;
    if (!point) return null;

    return (
      <div className="bg-white border rounded-lg shadow-md p-3 text-xs">
        <div className="font-semibold text-gray-800 mb-2">
          {label}
        </div>

        {availabilityRanges.map((range) => {
          const count = Number(point.counts[range.key] ?? 0);
          const percentage = Number(point[range.key] ?? 0);

          return (
            <div key={range.key} className="flex items-center gap-2 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: range.chartColor }}
              />
              <span style={{ color: range.chartColor }}>
                {range.label}
              </span>
              <span className="text-gray-700">
                : {count} stasiun ({percentage.toFixed(1)}%)
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const axisLabel = isPercentage ? "Persentase (%)" : "Jumlah Stasiun";

  return (
    <div className={`bg-white p-4 rounded-lg ${minHeightClassName}`}>
      <div className="flex items-center justify-between gap-4 mb-3">
        <h2 className="text-lg font-semibold text-gray-700">
          Distribusi Persentase Stasiun per Bulan Berdasarkan Ketersediaan
        </h2>

        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-medium text-gray-700">
            Tipe Grafik:
          </label>
          <select
            value={chartType}
            onChange={(e) =>
              onChartTypeChange(e.target.value as ChartType)
            }
            className="border px-2 py-1 rounded text-xs"
          >
            <option value="stacked">100% Stacked Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="grouped">Grouped Bar Chart</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-3">
        <span className="text-xs font-medium text-gray-700 mr-1">
          Metrik:
        </span>
        <button
          type="button"
          onClick={() => onMetricChange("count")}
          className={`px-2 py-1 rounded text-xs border ${
            metric === "count"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300"
          }`}
        >
          Jumlah
        </button>
        <button
          type="button"
          onClick={() => onMetricChange("percentage")}
          className={`px-2 py-1 rounded text-xs border ${
            metric === "percentage"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300"
          }`}
        >
          Persentase
        </button>
      </div>

      <div className="h-[360px] min-h-[360px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          {chartType === "line" ? (
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 10, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
                fontSize={11}
              />
              <YAxis
                domain={isPercentage ? [0, 100] : [0, "auto"]}
                ticks={getYAxisTicks()}
                label={{
                  value: axisLabel,
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle", fontSize: "12px" },
                }}
                fontSize={11}
              />
              <Tooltip content={renderAvailabilityTooltip} />
              {availabilityRanges.map((range) => (
                <Line
                  key={range.key}
                  type="monotone"
                  dataKey={range.key}
                  stroke={range.chartColor}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 10, bottom: 40 }}
              barCategoryGap={chartType === "grouped" ? "20%" : "10%"}
              barGap={chartType === "grouped" ? 2 : 0}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
                fontSize={11}
              />
              <YAxis
                domain={isPercentage ? [0, 100] : [0, "auto"]}
                ticks={getYAxisTicks()}
                label={{
                  value: axisLabel,
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle", fontSize: "12px" },
                }}
                fontSize={11}
              />
              <Tooltip content={renderAvailabilityTooltip} />

              {availabilityRanges.map((range, index) => (
                <Bar
                  key={range.key}
                  dataKey={range.key}
                  fill={range.chartColor}
                  stackId={chartType === "stacked" ? "availability" : undefined}
                  radius={
                    chartType === "stacked" &&
                    index === availabilityRanges.length - 1
                      ? [4, 4, 0, 0]
                      : chartType === "grouped"
                        ? [3, 3, 0, 0]
                        : [0, 0, 0, 0]
                  }
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-6 mt-4 text-sm">
        {availabilityRanges.map((range) => (
          <div key={range.key} className="flex items-center gap-2">
            <div
              className={`w-4 h-4 ${range.legendColor} rounded`}
            />
            <span>{range.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailabilityChartSection;
