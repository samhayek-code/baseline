// Grid layout definitions — extracted from index.html lines 2244-2366

export interface GridItem {
  id: string;
  name: string;
}

export interface GridLayoutMap {
  [category: string]: GridItem[];
}

export const GRID_LAYOUTS: GridLayoutMap = {
  Compositional: [
    { id: "center-lines", name: "Center Lines" },
    { id: "rule-of-thirds", name: "Rule of Thirds" },
    { id: "fibonacci", name: "Fibonacci" },
    { id: "dynamic-symmetry", name: "Dynamic Symmetry" },
    { id: "harmonic-armature", name: "Harmonic Armature" },
  ],
  Modular: [
    { id: "modular-2x2", name: "2×2 Modular" },
    { id: "modular-3x3", name: "3×3 Modular" },
    { id: "modular-4x4", name: "4×4 Modular" },
    { id: "modular-4x6", name: "4×6 Modular" },
    { id: "modular-5x5", name: "5×5 Modular" },
    { id: "modular-6x6", name: "6×6 Modular" },
  ],
  Interface: [
    { id: "ui-gutenberg", name: "Gutenberg" },
    { id: "ui-app-shell", name: "App Shell" },
    { id: "ui-three-panel", name: "Three Panel" },
    { id: "ui-dashboard", name: "Dashboard" },
    { id: "ui-canvas", name: "Canvas Layout" },
    { id: "ui-chat-artifact", name: "Chat + Artifact" },
    { id: "ui-agent-workflow", name: "Agent Workflow" },
  ],
  Technical: [
    { id: "isometric", name: "Isometric" },
    { id: "perspective-1pt", name: "1-Point Perspective" },
    { id: "perspective-2pt", name: "2-Point Perspective" },
    { id: "perspective-3pt", name: "3-Point Perspective" },
  ],
  Editorial: [
    { id: "manuscript", name: "Manuscript" },
    { id: "ratio-2-1", name: "2:1 Ratio" },
    { id: "ratio-1-2", name: "1:2 Ratio" },
    { id: "pull-quote", name: "Pull Quote" },
    { id: "layout-book-page", name: "Book Page" },
    { id: "feature", name: "Feature" },
    { id: "layout-dual-header", name: "Dual Header" },
    { id: "layout-hero-split", name: "Hero Split" },
    { id: "layout-sidebar-stack", name: "Sidebar Stack" },
    { id: "layout-poster-block", name: "Poster Block" },
    { id: "layout-news-mix", name: "News Mix" },
    { id: "layout-catalog", name: "Catalog" },
    { id: "asymmetric-compound", name: "Asymmetric" },
  ],
  Rhythm: [
    { id: "fifths", name: "Fifths" },
    { id: "sevenths", name: "Sevenths" },
    { id: "field-grid", name: "Field" },
    { id: "musical", name: "Musical" },
    { id: "progressive", name: "Progressive" },
    { id: "fibonacci-rhythm", name: "Fibonacci Rhythm" },
    { id: "phi-sections", name: "Phi Sections" },
  ],
  Compound: [
    { id: "compound-3-4", name: "3+4" },
    { id: "compound-3-5", name: "3+5" },
    { id: "compound-4-5", name: "4+5" },
    { id: "compound-4-6", name: "4+6" },
    { id: "compound-5-6", name: "5+6" },
    { id: "program", name: "Program" },
    { id: "cross-channel", name: "Cross Channel" },
  ],
  Standard: [
    { id: "standard-4", name: "Standard (4px)" },
    { id: "standard-8", name: "Standard (8px)" },
    { id: "standard-12", name: "Standard (12px)" },
    { id: "standard-24", name: "Standard (24px)" },
    { id: "standard-48", name: "Standard (48px)" },
  ],
  Baseline: [
    { id: "baseline-4", name: "Baseline (4px)" },
    { id: "baseline-8", name: "Baseline (8px)" },
    { id: "baseline-12", name: "Baseline (12px)" },
    { id: "baseline-24", name: "Baseline (24px)" },
    { id: "baseline-48", name: "Baseline (48px)" },
  ],
  Columns: [
    { id: "columns-2", name: "2 Columns" },
    { id: "columns-3", name: "3 Columns" },
    { id: "columns-4", name: "4 Columns" },
    { id: "columns-5", name: "5 Columns" },
    { id: "columns-6", name: "6 Columns" },
    { id: "columns-8", name: "8 Columns" },
    { id: "columns-12", name: "12 Columns" },
  ],
  Rows: [
    { id: "rows-2", name: "2 Rows" },
    { id: "rows-3", name: "3 Rows" },
    { id: "rows-4", name: "4 Rows" },
    { id: "rows-6", name: "6 Rows" },
    { id: "rows-8", name: "8 Rows" },
    { id: "rows-12", name: "12 Rows" },
  ],
  Axial: [
    { id: "axial-15", name: "15°" },
    { id: "axial-30", name: "30°" },
    { id: "axial-45", name: "45°" },
    { id: "axial-60", name: "60°" },
    { id: "axial-offset-high", name: "Offset High" },
    { id: "axial-offset-low", name: "Offset Low" },
  ],
  Diagonal: [
    { id: "diagonal", name: "Diagonal Lines" },
    { id: "diagonal-thirds", name: "Diagonal Thirds" },
    { id: "diagonal-quarters", name: "Diagonal Quarters" },
    { id: "diagonal-cross", name: "Diagonal Cross" },
    { id: "diagonal-angle", name: "Angular 30/60" },
    { id: "diagonal-chevron", name: "Chevron" },
  ],
  Radial: [
    { id: "radial", name: "Radial" },
    { id: "radial-corner", name: "Corner Radial" },
    { id: "radial-concentric", name: "Concentric" },
    { id: "radial-sunburst", name: "Sunburst" },
    { id: "radial-quadrant", name: "Quadrant Arcs" },
  ],
  "Sacred Geometry": [
    { id: "circle", name: "Circle" },
    { id: "vesica-piscis", name: "Vesica Piscis" },
    { id: "trinity", name: "Trinity" },
    { id: "tetrad", name: "Tetrad" },
    { id: "quintet", name: "Quintet" },
    { id: "seed-of-life", name: "Seed of Life" },
    { id: "flower-of-life", name: "Flower of Life" },
    { id: "sri-yantra", name: "Sri Yantra" },
    { id: "metatrons-cube", name: "Metatron's Cube" },
  ],
};

export const ALL_GRIDS = Object.values(GRID_LAYOUTS).flat();
