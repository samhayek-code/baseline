"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import "@/styles/editor.css";
import {
  RiShuffleLine,
  RiSaveLine,
  RiDownloadLine,
  RiRefreshLine,
  RiArrowLeftRightLine,
  RiArrowUpDownLine,
  RiHeartFill,
  RiSunLine,
  RiMoonLine,
} from "@remixicon/react";
import {
  CanvasState,
  Layers,
  Locks,
  DEFAULT_STATE,
  DEFAULT_LAYERS,
  DEFAULT_LOCKS,
  GridConfig,
} from "@/lib/grid-state";
import { ALL_GRIDS } from "./grid-layouts";
import Sidebar from "./Sidebar";
import CanvasArea from "./CanvasArea";
import LayerControls from "./LayerControls";
import ExportOverlay from "./ExportOverlay";
import SupportPanel from "./SupportPanel";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Helper to show toast
function showToast(message: string) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

export default function GridEditor() {
  const searchParams = useSearchParams();
  const loadId = searchParams.get("load");

  const [state, setState] = useState<CanvasState>(DEFAULT_STATE);
  const [layers, setLayers] = useState<Layers>({ ...DEFAULT_LAYERS });
  const [locks, setLocks] = useState<Locks>({ ...DEFAULT_LOCKS });
  const [activeLayer, setActiveLayer] = useState<1 | 2>(1);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showExport, setShowExport] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const saveInputRef = useRef<HTMLInputElement>(null);

  // Load saved grid from URL param
  useEffect(() => {
    if (!loadId) return;
    const supabase = createClient();
    supabase
      .from("saved_grids")
      .select("config")
      .eq("id", loadId)
      .single()
      .then(({ data }) => {
        if (data?.config) {
          const config = data.config as GridConfig;
          setState(config.state);
          setLayers(config.layers);
          setLocks(config.locks);
        }
      });
  }, [loadId]);

  // Theme toggle
  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      return next;
    });
  }, []);

  // Current layer helper
  const currentLayer = layers[activeLayer];

  // Update current layer
  const updateCurrentLayer = useCallback(
    (updates: Partial<(typeof layers)[1]>) => {
      setLayers((prev) => ({
        ...prev,
        [activeLayer]: { ...prev[activeLayer], ...updates },
      }));
    },
    [activeLayer],
  );

  // Toggle lock
  const toggleLock = useCallback((key: keyof Locks) => {
    setLocks((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Randomize
  const randomize = useCallback(() => {
    // Weighted distribution: 1 (20%), 2 (40%), 3 (30%), 4 (10%)
    const rand = Math.random();
    let n: number;
    if (rand < 0.2) n = 1;
    else if (rand < 0.6) n = 2;
    else if (rand < 0.9) n = 3;
    else n = 4;

    const randomGrids = [...ALL_GRIDS]
      .sort(() => Math.random() - 0.5)
      .slice(0, n)
      .map((g) => g.id);

    const layerUpdates: Partial<(typeof layers)[1]> = {
      selectedGrids: randomGrids,
    };

    if (!locks.lineStyle) {
      layerUpdates.lineStyle = (
        ["solid", "dashed", "dotted"] as const
      )[Math.floor(Math.random() * 3)];
    }
    if (!locks.lineColor) {
      layerUpdates.lineColor = [
        "#a855f7",
        "#ec4899",
        "#f97316",
        "#22c55e",
        "#14b8a6",
        "#0ea5e9",
        "#8b5cf6",
        "#ffffff",
      ][Math.floor(Math.random() * 8)];
    }
    if (!locks.lineOpacity) {
      layerUpdates.lineOpacity = Math.floor(Math.random() * 50) + 50;
    }
    if (!locks.lineWeight) {
      layerUpdates.lineWeight = (Math.floor(Math.random() * 6) + 1) * 0.5;
    }

    updateCurrentLayer(layerUpdates);

    setState((prev) => {
      const updates: Partial<CanvasState> = {};
      if (!locks.margin) updates.margin = Math.floor(Math.random() * 40) + 10;
      if (!locks.padding)
        updates.padding = Math.floor(Math.random() * 40) + 10;
      if (!locks.gutter) updates.gutter = Math.floor(Math.random() * 30) + 10;
      return { ...prev, ...updates };
    });
  }, [locks, updateCurrentLayer]);

  // Save grid handler
  const handleSave = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Redirect to login, then back to editor
      window.location.href = "/auth/login";
      return;
    }

    setShowSaveModal(true);
    setSaveName(`Grid ${state.width}x${state.height}`);
    // Focus input after render
    setTimeout(() => saveInputRef.current?.select(), 50);
  }, [state.width, state.height]);

  const confirmSave = useCallback(async () => {
    if (!saveName.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const config: GridConfig = { state, layers, locks };

    const { error } = await supabase.from("saved_grids").insert({
      user_id: user.id,
      name: saveName.trim(),
      config: config as unknown as Record<string, unknown>,
    });

    setSaving(false);
    setShowSaveModal(false);

    if (error) {
      showToast("Failed to save");
    } else {
      showToast("Grid saved!");
    }
  }, [saveName, state, layers, locks]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key.toLowerCase() === "r") randomize();
      if (e.key.toLowerCase() === "e") setShowExport(true);
      if (e.key.toLowerCase() === "s" && !e.metaKey && !e.ctrlKey) handleSave();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [randomize, handleSave]);

  return (
    <div className="app">
      <Sidebar
        state={state}
        setState={setState}
        currentLayer={currentLayer}
        updateCurrentLayer={updateCurrentLayer}
        locks={locks}
        toggleLock={toggleLock}
        randomize={randomize}
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
      />

      <CanvasArea
        state={state}
        setState={setState}
        layers={layers}
      />

      {/* Mobile FAB (Randomize) */}
      <button
        className="mobile-fab"
        onClick={randomize}
        title="Randomize"
      >
        <RiShuffleLine size={20} />
      </button>

      {/* Save + Export Buttons — top right */}
      <div className="action-btns-fixed">
          <button
            className="action-btn-fixed save"
            onClick={handleSave}
          >
            <RiSaveLine size={16} />
            Save
            <span className="shortcut-hint">S</span>
          </button>
          <button
            className="action-btn-fixed export"
            onClick={() => setShowExport(true)}
          >
            <RiDownloadLine size={16} />
            Export
            <span className="shortcut-hint">E</span>
          </button>
        </div>

      {/* Unified Bottom Toolbar */}
      <div className="canvas-toolbar">
        {/* Transform tools */}
        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={() =>
              setState((s) => ({
                ...s,
                rotation: (s.rotation + 90) % 360,
              }))
            }
            title="Rotate 90°"
          >
            <RiRefreshLine size={16} />
          </button>
          <button
            className={`toolbar-btn ${state.flipH ? "active" : ""}`}
            onClick={() => setState((s) => ({ ...s, flipH: !s.flipH }))}
            title="Flip Horizontal"
          >
            <RiArrowLeftRightLine size={16} />
          </button>
          <button
            className={`toolbar-btn ${state.flipV ? "active" : ""}`}
            onClick={() => setState((s) => ({ ...s, flipV: !s.flipV }))}
            title="Flip Vertical"
          >
            <RiArrowUpDownLine size={16} />
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Layer tabs + opacity */}
        <LayerControls
          activeLayer={activeLayer}
          setActiveLayer={setActiveLayer}
          layers={layers}
          setLayers={setLayers}
        />

        <div className="toolbar-divider" />

        {/* Zoom */}
        <div className="toolbar-group">
          <span className="toolbar-zoom">
            {Math.round(state.zoom * 100)}%
          </span>
        </div>

        <div className="toolbar-divider" />

        {/* Support + Theme */}
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={() => setShowSupport(true)} title="Support">
            <RiHeartFill size={16} className="heart-icon" />
          </button>
          <button className="toolbar-btn" onClick={toggleTheme} title="Toggle theme">
            <RiSunLine size={16} className="sun-icon" />
            <RiMoonLine size={16} className="moon-icon" />
          </button>
        </div>
      </div>

      {/* Export Overlay */}
      {showExport && (
        <ExportOverlay
          state={state}
          layers={layers}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="modal-backdrop" onClick={() => setShowSaveModal(false)}>
          <div className="save-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Save Grid</h3>
            <input
              ref={saveInputRef}
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmSave();
                if (e.key === "Escape") setShowSaveModal(false);
              }}
              placeholder="Grid name..."
              className="save-name-input"
            />
            <div className="save-modal-actions">
              <button
                className="export-btn secondary"
                onClick={() => setShowSaveModal(false)}
              >
                Cancel
              </button>
              <button
                className="export-btn primary"
                onClick={confirmSave}
                disabled={saving || !saveName.trim()}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Panel */}
      <SupportPanel
        open={showSupport}
        onClose={() => setShowSupport(false)}
      />

      {/* Toast */}
      <div className="toast" id="toast">
        Copied!
      </div>
    </div>
  );
}
