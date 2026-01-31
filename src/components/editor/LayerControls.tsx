"use client";

import { Layers } from "@/lib/grid-state";

interface LayerControlsProps {
  activeLayer: 1 | 2;
  setActiveLayer: (layer: 1 | 2) => void;
  layers: Layers;
  setLayers: React.Dispatch<React.SetStateAction<Layers>>;
}

function updateSliderFill(el: HTMLInputElement) {
  const min = parseFloat(el.min) || 0;
  const max = parseFloat(el.max) || 100;
  const val = parseFloat(el.value) || 0;
  const percent = ((val - min) / (max - min)) * 100;
  el.style.setProperty("--slider-percent", percent + "%");
}

export default function LayerControls({
  activeLayer,
  setActiveLayer,
  layers,
  setLayers,
}: LayerControlsProps) {
  return (
    <div className="layer-controls">
      <div className="layer-tabs">
        {([1, 2] as const).map((num) => (
          <button
            key={num}
            className={`layer-tab ${activeLayer === num ? "active" : ""} ${layers[num].selectedGrids.length > 0 ? "has-content" : ""}`}
            onClick={() => setActiveLayer(num)}
          >
            Layer {num}
          </button>
        ))}
      </div>
      <div className="layer-opacity">
        <input
          type="range"
          min={0}
          max={100}
          value={layers[activeLayer].opacity}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            setLayers((prev) => ({
              ...prev,
              [activeLayer]: { ...prev[activeLayer], opacity: val },
            }));
            updateSliderFill(e.target);
          }}
          ref={(el) => { if (el) updateSliderFill(el); }}
        />
        <span className="layer-opacity-value">
          {layers[activeLayer].opacity}%
        </span>
      </div>
    </div>
  );
}
