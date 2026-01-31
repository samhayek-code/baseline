"use client";

import { useState } from "react";
import JSZip from "jszip";
import { SavedGrid, GridConfig } from "@/lib/grid-state";
import { renderGrids, generateSVG } from "@/components/editor/grid-engine";

interface BatchDownloadBarProps {
  selectedGrids: SavedGrid[];
  onClear: () => void;
}

export default function BatchDownloadBar({
  selectedGrids,
  onClear,
}: BatchDownloadBarProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (format: "png" | "svg") => {
    if (selectedGrids.length === 0) return;
    setDownloading(true);

    try {
      const zip = new JSZip();

      for (const grid of selectedGrids) {
        const config = grid.config as unknown as GridConfig;
        const { state, layers } = config;
        // Sanitize filename
        const safeName = grid.name.replace(/[^a-zA-Z0-9_-]/g, "_");

        if (format === "svg") {
          const svgStr = generateSVG(state, layers, false);
          zip.file(`${safeName}.svg`, svgStr);
        } else {
          const canvas = document.createElement("canvas");
          canvas.width = state.width;
          canvas.height = state.height;
          const ctx = canvas.getContext("2d")!;
          renderGrids(ctx, state, layers, false);

          // Convert canvas to blob
          const blob = await new Promise<Blob>((resolve) =>
            canvas.toBlob((b) => resolve(b!), "image/png"),
          );
          zip.file(`${safeName}.png`, blob);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `baseline-grids-${format}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="batch-bar">
      <span className="batch-count">
        {selectedGrids.length} selected
      </span>
      <div className="batch-actions">
        <button
          className="batch-btn"
          onClick={() => handleDownload("png")}
          disabled={downloading}
        >
          {downloading ? "Zipping..." : "Download PNG"}
        </button>
        <button
          className="batch-btn"
          onClick={() => handleDownload("svg")}
          disabled={downloading}
        >
          {downloading ? "Zipping..." : "Download SVG"}
        </button>
        <button className="batch-btn secondary" onClick={onClear}>
          Clear
        </button>
      </div>
    </div>
  );
}
