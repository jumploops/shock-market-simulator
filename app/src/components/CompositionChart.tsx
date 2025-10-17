import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface CompositionCategory {
  key: string;
  label: string;
  color: string;
}

export interface CompositionRow {
  state: string;
  [key: string]: string | number;
}

interface CompositionChartProps {
  data: CompositionRow[];
  categories: CompositionCategory[];
  formatCurrency: (value: number) => string;
}

const createTooltipRenderer =
  (
    formatCurrency: (value: number) => string,
    categories: CompositionCategory[],
  ) =>
  ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const labelMap = new Map(
      categories.map((category) => [category.key, category.label]),
    );

    return (
      <div className="chart-tooltip">
        <strong>{label}</strong>
        <ul>
          {payload
            .filter(
              (item: any) =>
                item.value !== undefined && Number.isFinite(item.value),
            )
            .map((item: any) => (
              <li key={item.dataKey}>
                <span>{labelMap.get(item.dataKey) ?? item.dataKey}</span>
                <span>{formatCurrency(item.value)}</span>
              </li>
            ))}
        </ul>
      </div>
    );
  };

export const CompositionChart = ({
  data,
  categories,
  formatCurrency,
}: CompositionChartProps) => {
  if (!data.length || categories.length === 0) {
    return null;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="state" />
        <YAxis tickFormatter={formatCurrency} />
        <Tooltip content={createTooltipRenderer(formatCurrency, categories)} />
        <Legend />
        {categories.map((category) => (
          <Bar
            key={category.key}
            dataKey={category.key}
            stackId="composition"
            fill={category.color}
            name={category.label}
            maxBarSize={80}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CompositionChart;
