// TypeScript types for the grid generator state

export interface LayerState {
  selectedGrids: string[];
  lineWeight: number;
  lineStyle: "solid" | "dashed" | "dotted";
  lineColor: string;
  lineOpacity: number;
  opacity: number;
}

export interface CanvasState {
  width: number;
  height: number;
  margin: number;
  padding: number;
  gutter: number;
  bgColor: string;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  zoom: number;
}

export interface Locks {
  margin: boolean;
  padding: boolean;
  gutter: boolean;
  lineWeight: boolean;
  lineStyle: boolean;
  lineColor: boolean;
  lineOpacity: boolean;
}

export interface Layers {
  1: LayerState;
  2: LayerState;
}

// Config saved to Supabase
export interface GridConfig {
  state: CanvasState;
  layers: Layers;
  locks: Locks;
}

export interface SavedGrid {
  id: string;
  user_id: string;
  name: string;
  config: GridConfig;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_STATE: CanvasState = {
  width: 1440,
  height: 900,
  margin: 20,
  padding: 20,
  gutter: 20,
  bgColor: "#FFFFFF",
  rotation: 0,
  flipH: false,
  flipV: false,
  zoom: 1,
};

export const DEFAULT_LAYERS: Layers = {
  1: {
    selectedGrids: ["ui-app-shell"],
    lineWeight: 1,
    lineStyle: "solid",
    lineColor: "#a855f7",
    lineOpacity: 70,
    opacity: 100,
  },
  2: {
    selectedGrids: [],
    lineWeight: 1,
    lineStyle: "solid",
    lineColor: "#22c55e",
    lineOpacity: 70,
    opacity: 100,
  },
};

export const DEFAULT_LOCKS: Locks = {
  margin: false,
  padding: false,
  gutter: false,
  lineWeight: true,
  lineStyle: false,
  lineColor: false,
  lineOpacity: false,
};
