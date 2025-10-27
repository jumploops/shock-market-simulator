import {
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { CompositionCategory, CompositionRow } from "./CompositionChart";
import type { Options } from "../types";

interface ShareableImageRendererProps {
  data: CompositionRow[];
  categories: CompositionCategory[];
  scenarioName: string;
  horizonLabel: string;
  netWorthDeltaPct: number;
  options: Options;
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
        fontSize: "14px",
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

export const ShareableImageRenderer = ({
  data,
  categories,
  scenarioName,
  horizonLabel,
  netWorthDeltaPct,
  options,
}: ShareableImageRendererProps) => {
  if (data.length < 2) {
    return null;
  }

  const beforeRow = data[0];
  const afterRow = data[1];

  // Debug logging
  console.log('=== ShareableImageRenderer Debug ===');
  console.log('beforeRow:', beforeRow);
  console.log('afterRow:', afterRow);
  console.log('categories:', categories);

  // Transform data for pie charts - only include assets (positive values)
  const beforeData: PieChartData[] = categories
    .map((cat) => {
      const value = beforeRow[cat.key];
      const numValue = typeof value === 'number' ? value : 0;
      console.log(`Before ${cat.label} (${cat.key}): ${value} -> ${numValue}`);
      return {
        name: cat.label,
        value: numValue > 0 ? numValue : 0,
        color: cat.color,
      };
    })
    .filter((item) => item.value > 0);

  // Calculate totals
  const beforeTotal = beforeData.reduce((sum, item) => sum + item.value, 0);

  // For the "after" chart, use actual after values
  const afterData: PieChartData[] = categories
    .map((cat) => {
      const value = afterRow[cat.key];
      const numValue = typeof value === 'number' ? value : 0;
      console.log(`After ${cat.label} (${cat.key}): ${value} -> ${numValue}`);
      return {
        name: cat.label,
        value: numValue > 0 ? numValue : 0,
        color: cat.color,
      };
    })
    .filter((item) => item.value > 0);

  // Calculate loss/gain amount
  const afterTotal = afterData.reduce((sum, item) => sum + item.value, 0);
  const changeAmount = beforeTotal - afterTotal;

  console.log('beforeTotal:', beforeTotal);
  console.log('afterTotal:', afterTotal);
  console.log('changeAmount:', changeAmount);

  // Add loss/gain segment to make both pies the same total size
  if (changeAmount > 1) { // Loss
    afterData.push({
      name: 'Portfolio Loss',
      value: changeAmount,
      color: '#d0d0d0',
    });
  } else if (changeAmount < -1) { // Gain
    afterData.push({
      name: 'Portfolio Gain',
      value: Math.abs(changeAmount),
      color: '#90EE90',
    });
  }

  console.log('beforeData:', beforeData);
  console.log('afterData (with change):', afterData);
  console.log('=================================');

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const changeIndicator = netWorthDeltaPct >= 0 ? "+" : "";
  const changeColor = netWorthDeltaPct >= 0 ? "#2d7a3e" : "#c73838";

  return (
    <div className="shareable-image-container">
      <div className="shareable-image-header">
        <div className="shareable-image-title">
          <img
            src="/logo.png"
            alt="Shock Market"
            className="shareable-image-logo"
          />
          <h1>Shock Market Simulator</h1>
        </div>
        <div className="shareable-image-scenario">
          <div className="scenario-name">{scenarioName}</div>
          <div className="scenario-details">
            {horizonLabel}
            {options.locationRisk > 0 && (
              <> • Location risk: {(options.locationRisk * 100).toFixed(0)}%</>
            )}
            {options.useRealReturns && <> • Real returns</>}
          </div>
        </div>
      </div>

      <div className="shareable-image-charts">
        <div className="shareable-chart-panel">
          <h2>Asset Allocation - Now</h2>
          <div style={{ width: "100%", height: "300px", display: "flex", justifyContent: "center" }}>
            <PieChart width={500} height={300}>
              <Pie
                data={beforeData}
                cx={250}
                cy={120}
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={90}
                dataKey="value"
                startAngle={0}
                endAngle={360}
                isAnimationActive={false}
              >
                {beforeData.map((entry, index) => (
                  <Cell key={`cell-before-${index}`} fill={entry.color} stroke="#0c0d10" strokeWidth={2} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={60}
                iconType="circle"
                wrapperStyle={{
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              />
            </PieChart>
          </div>
        </div>

        <div className="shareable-chart-panel">
          <h2>{options.useRealReturns ? "After (Real) + Loss" : "After + Portfolio Change"}</h2>
          <div style={{ width: "100%", height: "300px", display: "flex", justifyContent: "center" }}>
            <PieChart width={500} height={300}>
              <Pie
                data={afterData}
                cx={250}
                cy={120}
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={90}
                dataKey="value"
                startAngle={0}
                endAngle={360}
                isAnimationActive={false}
              >
                {afterData.map((entry, index) => (
                  <Cell key={`cell-after-${index}`} fill={entry.color} stroke="#0c0d10" strokeWidth={2} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={60}
                iconType="circle"
                wrapperStyle={{
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              />
            </PieChart>
          </div>
        </div>
      </div>

      <div className="shareable-image-summary">
        <div className="net-worth-change">
          <span className="change-label">Net Worth Change:</span>
          <span className="change-value" style={{ color: changeColor }}>
            {changeIndicator}
            {(netWorthDeltaPct * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="shareable-image-footer">
        <div className="footer-left">
          Generated on {currentDate}
        </div>
        <div className="footer-right">
          shockmarketsimulator.com • All data stays local
        </div>
      </div>
    </div>
  );
};

export default ShareableImageRenderer;
