"use client";

import { useRef, useEffect, useState } from "react";
import { SavedGrid, GridConfig } from "@/lib/grid-state";
import { renderGrids } from "@/components/editor/grid-engine";
import { RiPencilLine, RiDeleteBinLine } from "@remixicon/react";

interface GridCardProps {
  grid: SavedGrid;
  selected: boolean;
  onSelect: (id: string) => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export default function GridCard({
  grid,
  selected,
  onSelect,
  onLoad,
  onDelete,
  onRename,
}: GridCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(grid.name);

  // Render thumbnail
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const config = grid.config as unknown as GridConfig;
    const { state, layers } = config;

    // Render at reduced size for performance
    const maxDim = 300;
    const scale = Math.min(maxDim / state.width, maxDim / state.height, 1);
    canvas.width = state.width * scale;
    canvas.height = state.height * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(scale, scale);
    renderGrids(ctx, state, layers, false);
  }, [grid.config]);

  const handleRename = () => {
    if (name.trim() && name.trim() !== grid.name) {
      onRename(grid.id, name.trim());
    }
    setEditing(false);
  };

  const dateStr = new Date(grid.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className={`grid-card ${selected ? "selected" : ""}`}>
      <div className="grid-card-select">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(grid.id)}
        />
      </div>
      <div className="grid-card-thumb" onClick={() => onLoad(grid.id)}>
        <canvas ref={canvasRef} />
      </div>
      <div className="grid-card-info">
        {editing ? (
          <input
            className="grid-card-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") {
                setName(grid.name);
                setEditing(false);
              }
            }}
            autoFocus
          />
        ) : (
          <span
            className="grid-card-name"
            onDoubleClick={() => setEditing(true)}
          >
            {grid.name}
          </span>
        )}
        <span className="grid-card-date">{dateStr}</span>
      </div>
      <div className="grid-card-actions">
        <button
          className="grid-card-action"
          onClick={() => setEditing(true)}
          title="Rename"
        >
          <RiPencilLine size={14} />
        </button>
        <button
          className="grid-card-action delete"
          onClick={() => onDelete(grid.id)}
          title="Delete"
        >
          <RiDeleteBinLine size={14} />
        </button>
      </div>
    </div>
  );
}
