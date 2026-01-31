// Shared PNG/SVG export helpers

import { CanvasState, Layers } from "@/lib/grid-state";
import { renderGrids, generateSVG } from "@/components/editor/grid-engine";

export function exportPNG(
  state: CanvasState,
  layers: Layers,
  transparent: boolean,
): string {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = state.width;
  tempCanvas.height = state.height;
  const tempCtx = tempCanvas.getContext("2d")!;
  renderGrids(tempCtx, state, layers, transparent);
  return tempCanvas.toDataURL("image/png");
}

export function exportSVGString(
  state: CanvasState,
  layers: Layers,
  transparent: boolean,
): string {
  return generateSVG(state, layers, transparent);
}

export function downloadFile(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  downloadFile(url, filename);
  URL.revokeObjectURL(url);
}

// Render a grid config to an offscreen canvas and return the canvas
export function renderToCanvas(
  state: CanvasState,
  layers: Layers,
  transparent: boolean,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = state.width;
  canvas.height = state.height;
  const ctx = canvas.getContext("2d")!;
  renderGrids(ctx, state, layers, transparent);
  return canvas;
}
