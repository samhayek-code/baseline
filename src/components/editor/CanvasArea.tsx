"use client";

import { useRef, useEffect, useCallback } from "react";
import { CanvasState, Layers } from "@/lib/grid-state";
import { renderGrids } from "./grid-engine";

interface CanvasAreaProps {
  state: CanvasState;
  setState: React.Dispatch<React.SetStateAction<CanvasState>>;
  layers: Layers;
}

export default function CanvasArea({ state, setState, layers }: CanvasAreaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // Render grids to canvas whenever state or layers change
  useEffect(() => {
    const canvas = canvasRef.current;
    const area = areaRef.current;
    if (!canvas || !area) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const areaW = area.clientWidth - 96;
    const areaH = area.clientHeight - 96;
    const baseScale = Math.min(areaW / state.width, areaH / state.height, 1);
    const scale = baseScale * state.zoom;

    // Update canvas drawing buffer
    canvas.width = state.width;
    canvas.height = state.height;

    // Visual canvas size
    canvas.style.width = state.width * scale + "px";
    canvas.style.height = state.height * scale + "px";

    // Draw grids
    renderGrids(ctx, state, layers, false);
  }, [state, layers]);

  // Scroll wheel zoom — throttled with rAF
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        const delta = e.deltaY > 0 ? -0.03 : 0.03;
        setState((s) => ({
          ...s,
          zoom: Math.min(3, Math.max(0.1, s.zoom + delta)),
        }));
        rafRef.current = 0;
      });
    },
    [setState],
  );

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    area.addEventListener("wheel", handleWheel, { passive: false });
    return () => area.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Resize handler
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handler = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setState((s) => ({ ...s }));
      }, 150);
    };
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("resize", handler);
      clearTimeout(timeout);
    };
  }, [setState]);

  return (
    <main className="canvas-area" ref={areaRef}>
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} />
      </div>
    </main>
  );
}
