import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { CompositionCategory, CompositionRow } from "./CompositionChart";

interface PieChartComparisonProps {
  data: CompositionRow[];
  categories: CompositionCategory[];
  formatCurrency: (value: number) => string;
  beforeTotal: number;
  afterTotal: number;
}

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  if (percent < 0.05) return null; // Don't show labels for < 5%

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#fffef9"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      style={{
        fontSize: "13px",
        fontWeight: 700,
        stroke: "#0c0d10",
        strokeWidth: "3px",
        paintOrder: "stroke",
      }}
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export const PieChartComparison = ({
  data,
  categories,
  formatCurrency,
  beforeTotal,
  afterTotal,
}: PieChartComparisonProps) => {
  if (data.length < 2) {
    return null;
  }

  const beforeRow = data[0];
  const afterRow = data[1];

  // Transform data for "before" pie chart
  const beforeData: PieChartData[] = categories
    .map((cat) => {
      const value = beforeRow[cat.key];
      const numValue = typeof value === "number" ? value : 0;
      return {
        name: cat.label,
        value: numValue > 0 ? numValue : 0,
        color: cat.color,
      };
    })
    .filter((item) => item.value > 0);

  // For the "after" chart, use actual after values
  const afterData: PieChartData[] = categories
    .map((cat) => {
      const value = afterRow[cat.key];
      const numValue = typeof value === "number" ? value : 0;
      return {
        name: cat.label,
        value: numValue > 0 ? numValue : 0,
        color: cat.color,
      };
    })
    .filter((item) => item.value > 0);

  // Calculate loss/gain amount
  const changeAmount = beforeTotal - afterTotal;

  // Add loss/gain segment to make both pies the same total size
  if (changeAmount > 1) {
    // Loss
    afterData.push({
      name: "Portfolio Loss",
      value: changeAmount,
      color: "#d0d0d0",
    });
  } else if (changeAmount < -1) {
    // Gain
    afterData.push({
      name: "Portfolio Gain",
      value: Math.abs(changeAmount),
      color: "#90EE90",
    });
  }

  return (
    <div className="pie-chart-comparison">
      <div className="pie-chart-panel">
        <h4>Now</h4>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={beforeData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              dataKey="value"
              isAnimationActive={true}
            >
              {beforeData.map((entry, index) => (
                <Cell
                  key={`cell-before-${index}`}
                  fill={entry.color}
                  stroke="#0c0d10"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) {
                  return null;
                }
                const data = payload[0];
                return (
                  <div className="chart-tooltip">
                    <strong>{data.name}</strong>
                    <ul>
                      <li>
                        <span>Value</span>
                        <span>{formatCurrency(data.value as number)}</span>
                      </li>
                      <li>
                        <span>Percentage</span>
                        <span>
                          {((data.value as number / beforeTotal) * 100).toFixed(1)}%
                        </span>
                      </li>
                    </ul>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{
                fontSize: "12px",
                fontWeight: 600,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="pie-chart-panel">
        <h4>After + Portfolio Change</h4>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={afterData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              dataKey="value"
              isAnimationActive={true}
            >
              {afterData.map((entry, index) => (
                <Cell
                  key={`cell-after-${index}`}
                  fill={entry.color}
                  stroke="#0c0d10"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) {
                  return null;
                }
                const data = payload[0];
                return (
                  <div className="chart-tooltip">
                    <strong>{data.name}</strong>
                    <ul>
                      <li>
                        <span>Value</span>
                        <span>{formatCurrency(data.value as number)}</span>
                      </li>
                      <li>
                        <span>Percentage</span>
                        <span>
                          {((data.value as number / beforeTotal) * 100).toFixed(1)}%
                        </span>
                      </li>
                    </ul>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{
                fontSize: "12px",
                fontWeight: 600,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PieChartComparison;
