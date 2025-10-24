import html2canvas from "html2canvas";
import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";

/**
 * Renders a React component to an image blob using html2canvas
 */
export async function renderComponentToImage(
  component: ReactElement,
  options?: {
    width?: number;
    height?: number;
    scale?: number;
    backgroundColor?: string;
  }
): Promise<Blob> {
  const {
    width = 1200,
    height = 630,
    scale = 2,
    backgroundColor = "#f5f2ec",
  } = options || {};

  // Create a temporary container
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-9999px";
  container.style.left = "-9999px";
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.backgroundColor = backgroundColor;
  document.body.appendChild(container);

  try {
    // Render the React component
    const root = createRoot(container);
    await new Promise<void>((resolve) => {
      root.render(component);
      // Wait for rendering, SVG generation, and any fonts to load
      // Increased timeout to ensure Recharts has time to render
      setTimeout(resolve, 1500);
    });

    // Convert to canvas
    const canvas = await html2canvas(container, {
      width,
      height,
      scale,
      backgroundColor,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) {
            resolve(b);
          } else {
            reject(new Error("Failed to convert canvas to blob"));
          }
        },
        "image/png",
        1.0
      );
    });

    // Cleanup
    root.unmount();
    document.body.removeChild(container);

    return blob;
  } catch (error) {
    // Cleanup on error
    if (container.parentNode) {
      document.body.removeChild(container);
    }
    throw error;
  }
}

/**
 * Triggers a browser download of a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup the object URL after a delay to ensure download starts
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Generates a descriptive filename for the exported image
 */
export function generateFilename(scenarioName: string): string {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD

  // Sanitize scenario name for filename
  const sanitized = scenarioName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `shock-market-${sanitized}-${dateStr}.png`;
}

/**
 * Convenience function to render and download an image in one step
 */
export async function exportComponentAsImage(
  component: ReactElement,
  filename: string,
  options?: {
    width?: number;
    height?: number;
    scale?: number;
    backgroundColor?: string;
  }
): Promise<void> {
  const blob = await renderComponentToImage(component, options);
  downloadBlob(blob, filename);
}
