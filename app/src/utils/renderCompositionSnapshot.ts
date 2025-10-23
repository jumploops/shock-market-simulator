type SnapshotCategory = {
  key: string;
  label: string;
  color: string;
  before: number;
  after: number;
};

export type CompositionSnapshotInput = {
  categories: SnapshotCategory[];
  scenarioName: string;
  horizonLabel: string;
  realReturns: boolean;
  totalBefore: number;
  totalAfter: number;
};

type LegendRow = {
  key: string;
  label: string;
  color: string;
  beforeRatio: number;
  afterRatio: number;
};

const SNAPSHOT_WIDTH = 1200;
const SNAPSHOT_HEIGHT = 630;

const BACKGROUND_COLOR = "#FDF9F0";
const PANEL_BORDER_COLOR = "#0C0D10";
const TEXT_COLOR = "#0C0D10";
const MUTED_TEXT_COLOR = "#3B3D42";
const OVERLINE_COLOR = "#7D4E57";

const clampRatio = (value: number): number => {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
};

const formatPercent = (ratio: number): string => {
  const bounded = clampRatio(ratio);
  return `${Math.round(bounded * 100)}%`;
};

const formatVolumeRatio = (before: number, after: number): string => {
  if (before <= 0) {
    return "Total volume: —";
  }

  const ratio = after / before;
  if (!Number.isFinite(ratio)) {
    return "Total volume: —";
  }

  const multiple = ratio.toFixed(2);
  const pct = (ratio - 1) * 100;
  const pctLabel = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  return `Total volume shift: ${pctLabel} (${multiple}×)`;
};

const buildLegendRows = (
  categories: CompositionSnapshotInput["categories"],
  totalBefore: number,
  totalAfter: number,
): LegendRow[] => {
  const safeBefore = totalBefore > 0 ? totalBefore : 0;
  const safeAfter = totalAfter > 0 ? totalAfter : 0;

  return categories.map((category) => {
    const beforeRatio =
      safeBefore > 0 ? clampRatio(category.before / safeBefore) : 0;
    const afterRatio =
      safeAfter > 0 ? clampRatio(category.after / safeAfter) : 0;

    return {
      key: category.key,
      label: category.label,
      color: category.color,
      beforeRatio,
      afterRatio,
    };
  });
};

const drawTitle = (
  ctx: CanvasRenderingContext2D,
  scenarioName: string,
  horizonLabel: string,
  realReturns: boolean,
) => {
  ctx.fillStyle = OVERLINE_COLOR;
  ctx.font = "600 20px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Shock Market Simulator", 80, 90);

  ctx.fillStyle = TEXT_COLOR;
  ctx.font = "700 46px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText("Portfolio mix snapshot", 80, 150);

  const details = [
    `Scenario: ${scenarioName}`,
    `Horizon: ${horizonLabel}`,
    realReturns ? "Real returns view" : "Nominal view",
  ];

  ctx.fillStyle = MUTED_TEXT_COLOR;
  ctx.font = "400 26px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText(details.join(" · "), 80, 198);
};

const drawPie = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  legendRows: LegendRow[],
  accessor: (row: LegendRow) => number,
) => {
  let startAngle = -Math.PI / 2;
  for (const row of legendRows) {
    const sliceRatio = accessor(row);
    const sweep = sliceRatio * Math.PI * 2;
    if (sweep <= 0) {
      continue;
    }

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.fillStyle = row.color;
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sweep);
    ctx.closePath();
    ctx.fill();

    startAngle += sweep;
  }

  ctx.lineWidth = 4;
  ctx.strokeStyle = PANEL_BORDER_COLOR;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
};

const drawLegend = (
  ctx: CanvasRenderingContext2D,
  legendRows: LegendRow[],
) => {
  const columnCount = 2;
  const columnWidth = 480;
  const baseX = 80;
  const baseY = 420;
  const rowGap = 78;
  const swatchSize = 22;

  ctx.font = "600 28px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillStyle = TEXT_COLOR;
  ctx.fillText("Mix ratios", baseX, baseY - 36);

  ctx.font = "500 20px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillStyle = MUTED_TEXT_COLOR;
  ctx.fillText("Now vs After", baseX, baseY - 8);

  ctx.font = "600 24px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillStyle = TEXT_COLOR;

  legendRows.forEach((row, index) => {
    const column = index % columnCount;
    const rowIndex = Math.floor(index / columnCount);
    const x = baseX + column * columnWidth;
    const y = baseY + rowIndex * rowGap;

    ctx.fillStyle = row.color;
    ctx.fillRect(x, y - swatchSize + 4, swatchSize, swatchSize);

    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText(row.label, x + swatchSize + 18, y);

    ctx.font = "500 20px 'Inter', 'Helvetica Neue', Arial, sans-serif";
    ctx.fillStyle = MUTED_TEXT_COLOR;
    const ratios = `${formatPercent(row.beforeRatio)} → ${formatPercent(row.afterRatio)}`;
    ctx.fillText(ratios, x + swatchSize + 18, y + 30);
    ctx.font = "600 24px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  });
};

const drawVolumeSummary = (
  ctx: CanvasRenderingContext2D,
  totalBefore: number,
  totalAfter: number,
) => {
  const label = formatVolumeRatio(totalBefore, totalAfter);
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = "600 28px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText(label, 80, 564);

  ctx.fillStyle = MUTED_TEXT_COLOR;
  ctx.font = "400 20px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText(
    "Values are ratios only — absolute balances stay private on-device.",
    80,
    600,
  );
};

const drawFrame = (ctx: CanvasRenderingContext2D) => {
  ctx.strokeStyle = PANEL_BORDER_COLOR;
  ctx.lineWidth = 6;
  ctx.strokeRect(60, 60, SNAPSHOT_WIDTH - 120, SNAPSHOT_HEIGHT - 120);
};

const renderSnapshot = (
  ctx: CanvasRenderingContext2D,
  input: CompositionSnapshotInput,
  legendRows: LegendRow[],
) => {
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, SNAPSHOT_WIDTH, SNAPSHOT_HEIGHT);

  drawFrame(ctx);
  drawTitle(ctx, input.scenarioName, input.horizonLabel, input.realReturns);

  const beforeCenterX = 360;
  const afterCenterX = 840;
  const centerY = 300;
  const radius = 150;

  drawPie(ctx, beforeCenterX, centerY, radius, legendRows, (row) => row.beforeRatio);
  drawPie(ctx, afterCenterX, centerY, radius, legendRows, (row) => row.afterRatio);

  ctx.fillStyle = TEXT_COLOR;
  ctx.font = "600 28px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Now", beforeCenterX, centerY + radius + 44);
  ctx.fillText("After", afterCenterX, centerY + radius + 44);
  ctx.textAlign = "left";

  drawLegend(ctx, legendRows);
  drawVolumeSummary(ctx, input.totalBefore, input.totalAfter);
};

export const createCompositionSnapshot = async (
  input: CompositionSnapshotInput,
): Promise<string> => {
  const { categories, totalBefore, totalAfter } = input;
  const hasContent =
    categories.some((category) => category.before > 0 || category.after > 0) &&
    (totalBefore > 0 || totalAfter > 0);

  if (!hasContent) {
    throw new Error("Nothing to export — add assets to create a mix snapshot.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = SNAPSHOT_WIDTH;
  canvas.height = SNAPSHOT_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not supported in this environment.");
  }

  const legendRows = buildLegendRows(categories, totalBefore, totalAfter);
  renderSnapshot(ctx, input, legendRows);

  return await new Promise<string>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to encode snapshot image."));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Could not read snapshot image data."));
        }
      };
      reader.onerror = () => {
        reject(new Error("Could not read snapshot image data."));
      };
      reader.readAsDataURL(blob);
    }, "image/png");
  });
};
