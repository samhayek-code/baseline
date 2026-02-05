"use client";

import { useCallback, useState, useRef } from "react";
import { CanvasState, Locks, LayerState } from "@/lib/grid-state";
import { GRID_LAYOUTS } from "./grid-layouts";
import { hexToRgbStr, hexToHslStr } from "./grid-engine";
import UserMenu from "@/components/auth/UserMenu";
import {
  RiLockLine,
  RiLockUnlockLine,
  RiArrowDownSLine,
  RiShuffleLine,
} from "@remixicon/react";

// Size preset data
const SIZE_PRESETS = {
  Presentation: [
    { value: "1920x1080", label: "Presentation 16:9 (1920×1080)" },
    { value: "1600x1200", label: "Slide 4:3 (1600×1200)" },
    { value: "1920x1200", label: "Slide 16:10 (1920×1200)" },
    { value: "1024x768", label: "Slide Classic (1024×768)" },
    { value: "2560x1440", label: "Presentation 2K (2560×1440)" },
  ],
  "Social Media": [
    { value: "1080x1350", label: "Instagram Post (1080×1350)" },
    { value: "1080x1920", label: "Instagram Story (1080×1920)" },
    { value: "1200x630", label: "Facebook Post (1200×630)" },
    { value: "1500x500", label: "Twitter/X Header (1500×500)" },
    { value: "1000x1500", label: "Pinterest Pin (1000×1500)" },
    { value: "1280x720", label: "YouTube Thumbnail (1280×720)" },
    { value: "1200x1200", label: "LinkedIn Post (1200×1200)" },
  ],
  Video: [
    { value: "1920x1080", label: "Full HD 1080p (1920×1080)" },
    { value: "3840x2160", label: "4K UHD (3840×2160)" },
    { value: "2560x1440", label: "2K QHD (2560×1440)" },
    { value: "1280x720", label: "HD 720p (1280×720)" },
    { value: "1080x1920", label: "Vertical Video (1080×1920)" },
    { value: "1080x1080", label: "Square Video (1080×1080)" },
  ],
  "Print (300 DPI)": [
    { value: "2550x3300", label: 'US Letter Portrait (8.5×11")' },
    { value: "3300x2550", label: 'US Letter Landscape (11×8.5")' },
    { value: "2480x3508", label: "A4 Portrait (210×297mm)" },
    { value: "3508x2480", label: "A4 Landscape (297×210mm)" },
    { value: "1050x600", label: 'Business Card (3.5×2")' },
    { value: "1200x1800", label: '4×6" Photo' },
    { value: "2400x3000", label: '8×10" Photo' },
    { value: "3300x5100", label: 'Poster 11×17"' },
  ],
  Screen: [
    { value: "1440x900", label: "Desktop (1440×900)" },
    { value: "1920x1080", label: "Desktop HD (1920×1080)" },
    { value: "2560x1440", label: "2K Monitor (2560×1440)" },
    { value: "1366x768", label: "Laptop HD (1366×768)" },
    { value: "1512x982", label: 'MacBook Pro 14"' },
    { value: "1728x1117", label: 'MacBook Pro 16"' },
    { value: "768x1024", label: "iPad Portrait (768×1024)" },
    { value: "1024x768", label: "iPad Landscape (1024×768)" },
    { value: "375x812", label: "iPhone SE (375×812)" },
    { value: "390x844", label: "iPhone 14 (390×844)" },
    { value: "393x852", label: "iPhone 15 Pro (393×852)" },
    { value: "430x932", label: "iPhone 15 Pro Max (430×932)" },
  ],
};

const BG_SWATCHES = ["#FFFFFF", "#BFBFBF", "#808080", "#404040", "#09090b"];

interface SidebarProps {
  state: CanvasState;
  setState: React.Dispatch<React.SetStateAction<CanvasState>>;
  currentLayer: LayerState;
  updateCurrentLayer: (updates: Partial<LayerState>) => void;
  locks: Locks;
  toggleLock: (key: keyof Locks) => void;
  randomize: () => void;
  drawerOpen: boolean;
  setDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

// Helper to update slider fill via CSS custom property
function updateSliderFill(el: HTMLInputElement) {
  const min = parseFloat(el.min) || 0;
  const max = parseFloat(el.max) || 100;
  const val = parseFloat(el.value) || 0;
  const percent = ((val - min) / (max - min)) * 100;
  el.style.setProperty("--slider-percent", percent + "%");
}

function LockButton({
  locked,
  onClick,
}: {
  locked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`lock-btn ${locked ? "locked" : ""}`}
      onClick={onClick}
    >
      <RiLockUnlockLine size={14} className="unlock-icon" />
      <RiLockLine size={14} className="lock-icon" />
    </button>
  );
}

export default function Sidebar({
  state,
  setState,
  currentLayer,
  updateCurrentLayer,
  locks,
  toggleLock,
  randomize,
  drawerOpen,
  setDrawerOpen,
}: SidebarProps) {
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false);
  const [sizePresetLabel, setSizePresetLabel] = useState("Custom Size");
  const [colorFormat, setColorFormat] = useState<"HEX" | "RGB" | "HSL">("HEX");
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    Object.keys(GRID_LAYOUTS).forEach((cat, i) => {
      initial[cat] = i === 0;
    });
    return initial;
  });

  const sizeDropdownRef = useRef<HTMLDivElement>(null);

  const formatBgColor = useCallback(
    (hex: string) => {
      if (colorFormat === "RGB") return hexToRgbStr(hex);
      if (colorFormat === "HSL") return hexToHslStr(hex);
      return hex;
    },
    [colorFormat],
  );

  const handleSizePreset = useCallback(
    (value: string, label: string) => {
      setSizePresetLabel(label);
      setSizeDropdownOpen(false);
      if (value !== "custom") {
        const [w, h] = value.split("x").map(Number);
        setState((s) => ({ ...s, width: w, height: h }));
      }
    },
    [setState],
  );

  const toggleGrid = useCallback(
    (gridId: string) => {
      const grids = currentLayer.selectedGrids;
      if (grids.includes(gridId)) {
        updateCurrentLayer({
          selectedGrids: grids.filter((id) => id !== gridId),
        });
      } else {
        updateCurrentLayer({ selectedGrids: [...grids, gridId] });
      }
    },
    [currentLayer.selectedGrids, updateCurrentLayer],
  );

  const clearGrids = useCallback(() => {
    updateCurrentLayer({ selectedGrids: [] });
  }, [updateCurrentLayer]);

  return (
    <aside className={`sidebar ${drawerOpen ? "drawer-open" : ""}`}>
      <div className="sidebar-header">
        <div className="drawer-handle" onClick={() => setDrawerOpen((o) => !o)}>
          <div className="drawer-pill" />
        </div>
        <div className="header-top">
          <div className="brand-text">
            <h1>Baseline</h1>
          </div>
          <UserMenu />
        </div>
        <div className="header-meta">
          <span className="version-badge">v4.1</span>
          <span className="meta-label">Grid Generator</span>
        </div>
      </div>

      <div className="sidebar-content">
        {/* Canvas Size */}
        <div className="section">
          <div className="section-title">Canvas Size</div>
          <div className="form-group">
            <div className="label-row">
              <label>Preset</label>
            </div>
            <div
              className={`custom-select ${sizeDropdownOpen ? "open" : ""}`}
              ref={sizeDropdownRef}
            >
              <button
                type="button"
                className="custom-select-trigger"
                onClick={() => setSizeDropdownOpen((o) => !o)}
              >
                <span>{sizePresetLabel}</span>
              </button>
              <div className="custom-select-dropdown">
                <div className="custom-select-group">
                  <div
                    className={`custom-select-option ${sizePresetLabel === "Custom Size" ? "selected" : ""}`}
                    onClick={() => handleSizePreset("custom", "Custom Size")}
                  >
                    Custom Size
                  </div>
                </div>
                {Object.entries(SIZE_PRESETS).map(([group, presets]) => (
                  <div className="custom-select-group" key={group}>
                    <div className="custom-select-group-header">{group}</div>
                    {presets.map((p) => (
                      <div
                        key={p.value + p.label}
                        className={`custom-select-option ${sizePresetLabel === p.label ? "selected" : ""}`}
                        onClick={() => handleSizePreset(p.value, p.label)}
                      >
                        {p.label}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="input-row">
            <div className="form-group">
              <div className="label-row">
                <label>Width</label>
              </div>
              <input
                type="number"
                value={state.width}
                min={100}
                max={10000}
                onChange={(e) => {
                  setState((s) => ({ ...s, width: +e.target.value }));
                  setSizePresetLabel("Custom Size");
                }}
              />
            </div>
            <div className="form-group">
              <div className="label-row">
                <label>Height</label>
              </div>
              <input
                type="number"
                value={state.height}
                min={100}
                max={10000}
                onChange={(e) => {
                  setState((s) => ({ ...s, height: +e.target.value }));
                  setSizePresetLabel("Custom Size");
                }}
              />
            </div>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="section">
          <div className="section-title">
            Grid Layout
            <div className="section-actions">
              <button className="clear-btn" onClick={clearGrids}>
                Clear All
              </button>
            </div>
          </div>
          <div className="grid-templates">
            {Object.entries(GRID_LAYOUTS).map(([cat, grids]) => (
              <div
                key={cat}
                className={`grid-category ${expandedCategories[cat] ? "expanded" : ""}`}
              >
                <div
                  className="grid-category-title"
                  onClick={() =>
                    setExpandedCategories((prev) => ({
                      ...prev,
                      [cat]: !prev[cat],
                    }))
                  }
                >
                  <span className="category-label">{cat}</span>
                  <RiArrowDownSLine size={16} className="chevron" />
                </div>
                <div className="grid-category-items">
                  {grids.map((g) => (
                    <div
                      key={g.id}
                      className="grid-template-item"
                      onClick={() => toggleGrid(g.id)}
                    >
                      <span>{g.name}</span>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={currentLayer.selectedGrids.includes(g.id)}
                          onChange={() => toggleGrid(g.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spacing */}
        <div className="section">
          <div className="section-title">Spacing</div>
          {(
            [
              ["Margin", "margin", state.margin],
              ["Padding", "padding", state.padding],
              ["Gutter", "gutter", state.gutter],
            ] as const
          ).map(([label, key, value]) => (
            <div className="form-group" key={key}>
              <div className="label-row">
                <label>{label}</label>
                <LockButton
                  locked={locks[key]}
                  onClick={() => toggleLock(key)}
                />
              </div>
              <div className="opacity-control">
                <input
                  type="range"
                  value={value}
                  min={0}
                  max={200}
                  onChange={(e) => {
                    const val = +e.target.value;
                    setState((s) => ({ ...s, [key]: val }));
                    updateSliderFill(e.target);
                  }}
                  ref={(el) => { if (el) updateSliderFill(el); }}
                />
                <div className="opacity-input-wrap">
                  <input
                    type="number"
                    value={value}
                    min={0}
                    max={500}
                    onChange={(e) => {
                      const val = Math.min(
                        500,
                        Math.max(0, +e.target.value || 0),
                      );
                      setState((s) => ({ ...s, [key]: val }));
                    }}
                  />
                  <span className="opacity-suffix">px</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Line Style */}
        <div className="section">
          <div className="section-title">Line Style</div>
          <div className="input-row">
            <div className="form-group">
              <div className="label-row">
                <label>Weight</label>
                <LockButton
                  locked={locks.lineWeight}
                  onClick={() => toggleLock("lineWeight")}
                />
              </div>
              <input
                type="number"
                value={currentLayer.lineWeight}
                min={0.5}
                max={10}
                step={0.5}
                onChange={(e) =>
                  updateCurrentLayer({ lineWeight: +e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <div className="label-row">
                <label>Style</label>
                <LockButton
                  locked={locks.lineStyle}
                  onClick={() => toggleLock("lineStyle")}
                />
              </div>
              <select
                value={currentLayer.lineStyle}
                onChange={(e) =>
                  updateCurrentLayer({
                    lineStyle: e.target.value as "solid" | "dashed" | "dotted",
                  })
                }
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <div className="label-row">
              <label>Color</label>
              <LockButton
                locked={locks.lineColor}
                onClick={() => toggleLock("lineColor")}
              />
            </div>
            <input
              type="color"
              value={currentLayer.lineColor}
              onChange={(e) =>
                updateCurrentLayer({ lineColor: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <div className="label-row">
              <label>Opacity</label>
              <LockButton
                locked={locks.lineOpacity}
                onClick={() => toggleLock("lineOpacity")}
              />
            </div>
            <div className="opacity-control">
              <input
                type="range"
                value={currentLayer.lineOpacity}
                min={10}
                max={100}
                onChange={(e) => {
                  updateCurrentLayer({ lineOpacity: +e.target.value });
                  updateSliderFill(e.target);
                }}
                ref={(el) => { if (el) updateSliderFill(el); }}
              />
              <div className="opacity-input-wrap">
                <input
                  type="number"
                  value={currentLayer.lineOpacity}
                  min={10}
                  max={100}
                  onChange={(e) => {
                    const val = Math.min(
                      100,
                      Math.max(10, +e.target.value || 10),
                    );
                    updateCurrentLayer({ lineOpacity: val });
                  }}
                />
                <span className="opacity-suffix">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Background */}
        <div className="section">
          <div className="section-title">Background</div>
          <div className="bg-preview-section">
            <div className="bg-swatches">
              {BG_SWATCHES.map((color) => (
                <button
                  key={color}
                  className={`bg-swatch ${state.bgColor === color ? "active" : ""}`}
                  onClick={() => setState((s) => ({ ...s, bgColor: color }))}
                >
                  <div
                    className="bg-swatch-color"
                    style={{ background: color }}
                  />
                </button>
              ))}
            </div>
            <div className="color-input-row">
              <input
                type="color"
                value={state.bgColor}
                onChange={(e) =>
                  setState((s) => ({ ...s, bgColor: e.target.value }))
                }
              />
              <input
                type="text"
                value={formatBgColor(state.bgColor)}
                placeholder="#000000"
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
                    setState((s) => ({ ...s, bgColor: v }));
                  }
                }}
              />
              <button
                className="color-format-toggle"
                onClick={() =>
                  setColorFormat((f) =>
                    f === "HEX" ? "RGB" : f === "RGB" ? "HSL" : "HEX",
                  )
                }
              >
                {colorFormat}
              </button>
            </div>
          </div>
        </div>

        {/* Randomize */}
        <div className="section">
          <button className="btn btn-secondary" onClick={randomize}>
            <RiShuffleLine size={16} />
            Randomize
            <span className="shortcut-hint">R</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
