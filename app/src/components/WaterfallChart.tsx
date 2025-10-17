import { useMemo } from "react";

export interface WaterfallDatum {
  key: string;
  label: string;
  delta: number;
}

interface WaterfallChartProps {
  data: WaterfallDatum[];
  formatCurrency: (value: number) => string;
}

const BAR_HEIGHT = 24;
const ROW_GAP = 14;
const PADDING_Y = 28;
const LABEL_AREA = 140;
const VALUE_AREA = 80;

const clamp = (value: number) =>
  Number.isFinite(value) ? value : 0;

export const WaterfallChart = ({
  data,
  formatCurrency,
}: WaterfallChartProps) => {
  const enriched = useMemo(() => {
    let cumulative = 0;
    let min = 0;
    let max = 0;

    const rows = data.map((item) => {
      const start = cumulative;
      cumulative += item.delta;
      const end = cumulative;
      min = Math.min(min, start, end);
      max = Math.max(max, start, end);
      return { ...item, start, end };
    });

    return {
      rows,
      min,
      max,
    };
  }, [data]);

  if (enriched.rows.length === 0) {
    return null;
  }

  const width = 640;
  const height =
    enriched.rows.length * (BAR_HEIGHT + ROW_GAP) + PADDING_Y * 2;
  const chartWidth = width - LABEL_AREA - VALUE_AREA;
  const domainSize = clamp(enriched.max - enriched.min) || 1;

  const scaleValue = (value: number) =>
    LABEL_AREA +
    ((value - enriched.min) / domainSize) * chartWidth;

  const zeroX = scaleValue(0);

  return (
    <div className="waterfall-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMinYMin meet"
      >
        <line
          x1={zeroX}
          x2={zeroX}
          y1={PADDING_Y - 12}
          y2={height - PADDING_Y + 12}
          className="waterfall-zero-line"
        />
        {enriched.rows.map((item, index) => {
          const y = PADDING_Y + index * (BAR_HEIGHT + ROW_GAP);
          const startX = scaleValue(item.start);
          const endX = scaleValue(item.end);
          const barX = Math.min(startX, endX);
          const barWidth = Math.max(Math.abs(endX - startX), 2);
          const isPositive = item.delta >= 0;
          const color = isPositive ? "#177E89" : "#D1495B";
          const labelY = y + BAR_HEIGHT / 2 + 4;
          const valueX = (isPositive ? endX : startX) + 8;

          const previous = enriched.rows[index - 1];
          const connectorY = y - ROW_GAP / 2;

          return (
            <g key={item.key}>
              {previous && (
                <line
                  x1={scaleValue(previous.end)}
                  x2={scaleValue(item.start)}
                  y1={connectorY}
                  y2={connectorY}
                  className="waterfall-connector"
                />
              )}
              <text
                x={LABEL_AREA - 12}
                y={labelY}
                className="waterfall-label"
                textAnchor="end"
              >
                {item.label}
              </text>
              <rect
                x={barX}
                y={y}
                width={barWidth}
                height={BAR_HEIGHT}
                fill={color}
                rx={4}
                ry={4}
              />
              <text
                x={Math.min(
                  Math.max(valueX, LABEL_AREA + 8),
                  width - VALUE_AREA + 10,
                )}
                y={labelY}
                className="waterfall-value"
              >
                {formatCurrency(item.delta)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default WaterfallChart;
