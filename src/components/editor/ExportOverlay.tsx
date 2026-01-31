"use client";

import { useState, useEffect, useRef } from "react";
import { CanvasState, Layers } from "@/lib/grid-state";
import { renderGrids, generateSVG } from "./grid-engine";

interface ExportOverlayProps {
  state: CanvasState;
  layers: Layers;
  onClose: () => void;
}

export default function ExportOverlay({
  state,
  layers,
  onClose,
}: ExportOverlayProps) {
  const [format, setFormat] = useState<"png" | "svg">("png");
  const [transparent, setTransparent] = useState(true);
  const [previewSrc, setPreviewSrc] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  // Generate preview
  useEffect(() => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = state.width;
    tempCanvas.height = state.height;
    const tempCtx = tempCanvas.getContext("2d")!;
    renderGrids(tempCtx, state, layers, transparent);
    setPreviewSrc(tempCanvas.toDataURL("image/png"));
  }, [state, layers, transparent]);

  const handleDownload = () => {
    if (format === "svg") {
      const svg = generateSVG(state, layers, transparent);
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `baseline-grid-${state.width}x${state.height}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = state.width;
      tempCanvas.height = state.height;
      const tempCtx = tempCanvas.getContext("2d")!;
      renderGrids(tempCtx, state, layers, transparent);
      const dataUrl = tempCanvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `baseline-grid-${state.width}x${state.height}.png`;
      a.click();
    }
    onClose();
  };

  return (
    <div className="export-overlay open" ref={overlayRef}>
      <div className="export-preview">
        {previewSrc && (
          <img src={previewSrc} alt="Preview" />
        )}
      </div>
      <div className="export-options">
        <div className="format-selector">
          <button
            className={`format-btn ${format === "png" ? "active" : ""}`}
            onClick={() => setFormat("png")}
          >
            PNG
          </button>
          <button
            className={`format-btn ${format === "svg" ? "active" : ""}`}
            onClick={() => setFormat("svg")}
          >
            SVG
          </button>
        </div>
        <label>
          <input
            type="checkbox"
            checked={transparent}
            onChange={(e) => setTransparent(e.target.checked)}
          />
          Transparent Background
        </label>
      </div>
      <div className="export-actions">
        <button className="export-btn secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="export-btn primary" onClick={handleDownload}>
          Download
        </button>
      </div>
    </div>
  );
}
