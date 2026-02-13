// Grid rendering engine — extracted from index.html lines 2907-3258
// Refactored to accept state/layers as parameters instead of reading globals.

import { CanvasState, Layers } from "@/lib/grid-state";

// --- Color helpers ---

export function hexToRgba(h: string, a: number): string {
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function hexToRgbStr(h: string): string {
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `rgb(${r},${g},${b})`;
}

export function hexToHslStr(h: string): string {
  let r = parseInt(h.slice(1, 3), 16) / 255;
  let g = parseInt(h.slice(3, 5), 16) / 255;
  let b = parseInt(h.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hu = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hu = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        hu = ((b - r) / d + 2) / 6;
        break;
      case b:
        hu = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return `hsl(${Math.round(hu * 360)},${Math.round(s * 100)}%,${Math.round(l * 100)}%)`;
}

// --- Canvas rendering ---

export function renderGrids(
  c: CanvasRenderingContext2D,
  state: CanvasState,
  layers: Layers,
  transparent: boolean,
): void {
  c.clearRect(0, 0, state.width, state.height);
  if (!transparent) {
    c.fillStyle = state.bgColor;
    c.fillRect(0, 0, state.width, state.height);
  }

  const m = state.margin;
  const p = state.padding;
  const g = state.gutter;
  const x = m + p;
  const y = m + p;
  const w = state.width - 2 * (m + p);
  const h = state.height - 2 * (m + p);
  const s = Math.max(state.width, state.height) / 1000;

  ([1, 2] as const).forEach((layerNum) => {
    const layer = layers[layerNum];
    if (layer.selectedGrids.length === 0 || layer.opacity === 0) return;

    c.save();
    c.globalAlpha = layer.opacity / 100;
    c.strokeStyle = hexToRgba(layer.lineColor, layer.lineOpacity / 100);
    c.lineWidth = layer.lineWeight;
    if (layer.lineStyle === "dashed") c.setLineDash([8 * s, 4 * s]);
    else if (layer.lineStyle === "dotted") c.setLineDash([2 * s, 4 * s]);
    else c.setLineDash([]);

    // Apply transforms
    c.translate(state.width / 2, state.height / 2);
    c.rotate((state.rotation * Math.PI) / 180);
    c.scale(state.flipH ? -1 : 1, state.flipV ? -1 : 1);
    c.translate(-state.width / 2, -state.height / 2);

    layer.selectedGrids.forEach((id) => drawGrid(c, id, x, y, w, h, g, s));

    c.restore();
  });
}

// --- SVG Generation ---

export function generateSVG(
  state: CanvasState,
  layers: Layers,
  transparent: boolean,
): string {
  const m = state.margin;
  const p = state.padding;
  const g = state.gutter;
  const x = m + p;
  const y = m + p;
  const w = state.width - 2 * (m + p);
  const h = state.height - 2 * (m + p);
  const s = Math.max(state.width, state.height) / 1000;

  // Build transform string
  const transforms: string[] = [];
  transforms.push(`translate(${state.width / 2},${state.height / 2})`);
  if (state.rotation !== 0) transforms.push(`rotate(${state.rotation})`);
  if (state.flipH || state.flipV)
    transforms.push(
      `scale(${state.flipH ? -1 : 1},${state.flipV ? -1 : 1})`,
    );
  transforms.push(`translate(${-state.width / 2},${-state.height / 2})`);
  const transformAttr =
    state.rotation !== 0 || state.flipH || state.flipV
      ? `transform="${transforms.join(" ")}"`
      : "";

  const bgRect = transparent
    ? ""
    : `<rect width="${state.width}" height="${state.height}" fill="${state.bgColor}"/>`;

  let layerGroups = "";
  ([1, 2] as const).forEach((layerNum) => {
    const layer = layers[layerNum];
    if (layer.selectedGrids.length === 0 || layer.opacity === 0) return;

    let paths = "";
    layer.selectedGrids.forEach((id) => {
      paths += generateGridSVG(id, x, y, w, h, g, s);
    });

    const strokeColor = layer.lineColor;
    const strokeOpacity = (layer.lineOpacity / 100) * (layer.opacity / 100);
    let dashArray = "";
    if (layer.lineStyle === "dashed")
      dashArray = `stroke-dasharray="${8 * s},${4 * s}"`;
    else if (layer.lineStyle === "dotted")
      dashArray = `stroke-dasharray="${2 * s},${4 * s}"`;

    layerGroups += `
  <g stroke="${strokeColor}" stroke-opacity="${strokeOpacity}" stroke-width="${layer.lineWeight}" fill="none" ${dashArray} ${transformAttr}>
    ${paths}
  </g>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${state.width}" height="${state.height}" viewBox="0 0 ${state.width} ${state.height}">
  ${bgRect}${layerGroups}
</svg>`;
}

// --- SVG grid path generators ---

function svgLine(x1: number, y1: number, x2: number, y2: number): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
}
function svgRect(rx: number, ry: number, rw: number, rh: number): string {
  return `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}"/>`;
}
function svgCircle(cx: number, cy: number, cr: number): string {
  return `<circle cx="${cx}" cy="${cy}" r="${cr}"/>`;
}

function generateGridSVG(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  g: number,
  s: number,
): string {
  const phi = 1.618;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) * 0.4;
  let paths = "";

  switch (id) {
    case "rule-of-thirds":
      paths +=
        svgLine(x + w / 3, y, x + w / 3, y + h) +
        svgLine(x + (2 * w) / 3, y, x + (2 * w) / 3, y + h) +
        svgLine(x, y + h / 3, x + w, y + h / 3) +
        svgLine(x, y + (2 * h) / 3, x + w, y + (2 * h) / 3);
      break;
    case "fibonacci":
      paths += generateGoldenSpiralSVG(x, y, w, h);
      break;
    case "center-lines":
      paths +=
        svgLine(x + w / 2, y, x + w / 2, y + h) +
        svgLine(x, y + h / 2, x + w, y + h / 2);
      break;
    case "dynamic-symmetry":
      paths +=
        svgLine(x, y, x + w, y + h) +
        svgLine(x + w, y, x, y + h) +
        svgLine(x, y, x + w, y + h * 0.618) +
        svgLine(x + w, y, x, y + h * 0.618) +
        svgLine(x, y + h, x + w, y + h * 0.382) +
        svgLine(x + w, y + h, x, y + h * 0.382);
      break;
    case "harmonic-armature":
      paths +=
        svgLine(x, y, x + w, y + h) +
        svgLine(x + w, y, x, y + h) +
        svgLine(x + w / 2, y, x, y + h) +
        svgLine(x + w / 2, y, x + w, y + h) +
        svgLine(x, y + h / 2, x + w, y) +
        svgLine(x, y + h / 2, x + w, y + h) +
        svgLine(x + w, y + h / 2, x, y) +
        svgLine(x + w, y + h / 2, x, y + h);
      break;
    case "axial-15": {
      const ang = (15 * Math.PI) / 180;
      const dy = (w * Math.tan(ang)) / 2;
      paths += svgLine(x, cy - dy, x + w, cy + dy);
      break;
    }
    case "axial-30": {
      const ang = (30 * Math.PI) / 180;
      const dy = (w * Math.tan(ang)) / 2;
      paths += svgLine(x, cy - dy, x + w, cy + dy);
      break;
    }
    case "axial-45":
      paths += svgLine(x, y, x + w, y + h);
      break;
    case "axial-60": {
      const ang = (60 * Math.PI) / 180;
      const dy = Math.min((w * Math.tan(ang)) / 2, h / 2);
      const dx = dy / Math.tan(ang);
      paths += svgLine(cx - dx, y, cx + dx, y + h);
      break;
    }
    case "axial-offset-high": {
      const ang = (30 * Math.PI) / 180;
      const offY = y + h * 0.25;
      const dy = (w * Math.tan(ang)) / 2;
      paths += svgLine(x, offY - dy, x + w, offY + dy);
      break;
    }
    case "axial-offset-low": {
      const ang = (30 * Math.PI) / 180;
      const offY = y + h * 0.75;
      const dy = (w * Math.tan(ang)) / 2;
      paths += svgLine(x, offY - dy, x + w, offY + dy);
      break;
    }
    case "diagonal":
      paths += svgLine(x, y, x + w, y + h) + svgLine(x + w, y, x, y + h);
      break;
    case "diagonal-thirds":
      paths +=
        svgLine(x, y, x + w, y + h) +
        svgLine(x + w, y, x, y + h) +
        svgLine(x + w / 3, y, x + w, y + (h * 2) / 3) +
        svgLine(x, y + h / 3, x + (w * 2) / 3, y + h) +
        svgLine(x + (w * 2) / 3, y, x, y + (h * 2) / 3) +
        svgLine(x + w, y + h / 3, x + w / 3, y + h);
      break;
    case "diagonal-quarters":
      paths +=
        svgLine(x, y, x + w, y + h) +
        svgLine(x + w, y, x, y + h) +
        svgLine(x + w / 2, y, x, y + h / 2) +
        svgLine(x + w / 2, y, x + w, y + h / 2) +
        svgLine(x, y + h / 2, x + w / 2, y + h) +
        svgLine(x + w, y + h / 2, x + w / 2, y + h);
      break;
    case "diagonal-cross": {
      for (let i = 1; i < 4; i++) {
        paths +=
          svgLine(x + (w * i) / 4, y, x + w, y + (h * (4 - i)) / 4) +
          svgLine(x, y + (h * i) / 4, x + (w * (4 - i)) / 4, y + h) +
          svgLine(x + (w * (4 - i)) / 4, y, x, y + (h * (4 - i)) / 4) +
          svgLine(x + w, y + (h * i) / 4, x + (w * i) / 4, y + h);
      }
      paths += svgLine(x, y, x + w, y + h) + svgLine(x + w, y, x, y + h);
      break;
    }
    case "diagonal-angle": {
      const tan30 = Math.tan((30 * Math.PI) / 180);
      const tan60 = Math.tan((60 * Math.PI) / 180);
      paths +=
        svgLine(x, y + h, Math.min(x + w, x + h / tan30), y) +
        svgLine(x + w, y + h, Math.max(x, x + w - h / tan30), y) +
        svgLine(x, y + h, Math.min(x + w, x + h / tan60), y) +
        svgLine(x + w, y + h, Math.max(x, x + w - h / tan60), y);
      break;
    }
    case "diagonal-chevron": {
      const chevH = h / 5;
      for (let i = 0; i < 5; i++) {
        const chevY = y + i * chevH;
        paths +=
          svgLine(x, chevY + chevH, x + w / 2, chevY) +
          svgLine(x + w / 2, chevY, x + w, chevY + chevH);
      }
      break;
    }
    case "radial": {
      const rr = Math.min(w, h) / 2;
      for (let i = 1; i <= 5; i++) paths += svgCircle(cx, cy, (rr * i) / 5);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        paths += svgLine(
          cx,
          cy,
          cx + Math.cos(a) * rr,
          cy + Math.sin(a) * rr,
        );
      }
      break;
    }
    case "radial-corner": {
      const maxR = Math.sqrt(w * w + h * h);
      for (let i = 1; i <= 5; i++) {
        const radius = (maxR * i) / 5;
        paths += `<path d="M${x + w - radius},${y + h} A${radius},${radius} 0 0,1 ${x + w},${y + h - radius}" fill="none"/>`;
      }
      for (let i = 0; i < 5; i++) {
        const angle = Math.PI + (i / 4) * (Math.PI / 2);
        paths += svgLine(
          x + w,
          y + h,
          x + w + Math.cos(angle) * maxR,
          y + h + Math.sin(angle) * maxR,
        );
      }
      break;
    }
    case "radial-concentric": {
      const cr = Math.min(w, h) / 2;
      for (let i = 1; i <= 12; i++) paths += svgCircle(cx, cy, (cr * i) / 12);
      break;
    }
    case "radial-sunburst": {
      const rayR = Math.max(w, h);
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        paths += svgLine(
          cx,
          cy,
          cx + Math.cos(angle) * rayR,
          cy + Math.sin(angle) * rayR,
        );
      }
      break;
    }
    case "radial-quadrant": {
      const qr = Math.min(w, h) * 0.6;
      for (let i = 1; i <= 3; i++) {
        const radius = (qr * i) / 3;
        paths += `<path d="M${x},${y + radius} A${radius},${radius} 0 0,1 ${x + radius},${y}"/>`;
        paths += `<path d="M${x + w - radius},${y} A${radius},${radius} 0 0,1 ${x + w},${y + radius}"/>`;
        paths += `<path d="M${x + w},${y + h - radius} A${radius},${radius} 0 0,1 ${x + w - radius},${y + h}"/>`;
        paths += `<path d="M${x + radius},${y + h} A${radius},${radius} 0 0,1 ${x},${y + h - radius}"/>`;
      }
      break;
    }
    case "manuscript":
      paths += svgRect(x + w * 0.1, y, w * 0.8, h);
      break;
    case "ratio-2-1": {
      const a21 = (w - g) / 3;
      paths += svgRect(x, y, a21 * 2, h) + svgRect(x + a21 * 2 + g, y, a21, h);
      break;
    }
    case "ratio-1-2": {
      const a12 = (w - g) / 3;
      paths += svgRect(x, y, a12, h) + svgRect(x + a12 + g, y, a12 * 2, h);
      break;
    }
    case "feature": {
      const fw = w * 0.6;
      paths +=
        svgRect(x, y, fw, h * 0.65) +
        svgRect(x, y + h * 0.65 + g, fw, h * 0.35 - g) +
        svgRect(x + fw + g, y, w - fw - g, h);
      break;
    }
    case "pull-quote":
      paths +=
        svgRect(x, y, w, h) + svgRect(x + w * 0.15, y + h * 0.35, w * 0.7, h * 0.3);
      break;
    case "layout-dual-header": {
      const imgH = h * 0.35;
      const imgW = (w - g) / 2;
      paths +=
        svgRect(x, y, imgW, imgH) +
        svgLine(x, y, x + imgW, y + imgH) +
        svgLine(x + imgW, y, x, y + imgH);
      paths +=
        svgRect(x + imgW + g, y, imgW, imgH) +
        svgLine(x + imgW + g, y, x + w, y + imgH) +
        svgLine(x + w, y, x + imgW + g, y + imgH);
      const colW = (w - g * 2) / 3;
      const colY = y + imgH + g;
      const colH = h - imgH - g;
      for (let i = 0; i < 3; i++)
        paths += svgRect(x + i * (colW + g), colY, colW, colH);
      break;
    }
    case "layout-sidebar-stack": {
      const leftW = w * 0.55;
      const rightW = w - leftW - g;
      const topH = h * 0.65;
      const rightImgH = (topH - g) / 2;
      paths +=
        svgRect(x, y, leftW, topH) +
        svgLine(x, y, x + leftW, y + topH) +
        svgLine(x + leftW, y, x, y + topH);
      paths +=
        svgRect(x + leftW + g, y, rightW, rightImgH) +
        svgLine(x + leftW + g, y, x + w, y + rightImgH) +
        svgLine(x + w, y, x + leftW + g, y + rightImgH);
      paths +=
        svgRect(x + leftW + g, y + rightImgH + g, rightW, rightImgH) +
        svgLine(x + leftW + g, y + rightImgH + g, x + w, y + topH) +
        svgLine(x + w, y + rightImgH + g, x + leftW + g, y + topH);
      paths += svgRect(x, y + topH + g, w, h - topH - g);
      break;
    }
    case "layout-hero-split": {
      const heroW = w * 0.65;
      const heroH = h * 0.6;
      const sideW = w - heroW - g;
      paths +=
        svgRect(x, y, heroW, heroH) +
        svgLine(x, y, x + heroW, y + heroH) +
        svgLine(x + heroW, y, x, y + heroH);
      paths += svgRect(x + heroW + g, y, sideW, heroH);
      paths += svgRect(x, y + heroH + g, w, h - heroH - g);
      break;
    }
    case "layout-poster-block": {
      const topH = h * 0.55;
      paths +=
        svgRect(x, y, w, topH) +
        svgLine(x, y, x + w, y + topH) +
        svgLine(x + w, y, x, y + topH);
      const botH = h - topH - g;
      const cellW = (w - g * 3) / 4;
      for (let i = 0; i < 4; i++)
        paths += svgRect(x + i * (cellW + g), y + topH + g, cellW, botH);
      break;
    }
    case "layout-catalog": {
      const cols = 3;
      const rows = 2;
      const cellW = (w - g * (cols - 1)) / cols;
      const cellH = (h - g * (rows - 1)) / rows;
      const cImgH = cellH * 0.7;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const bx = x + col * (cellW + g);
          const by = y + row * (cellH + g);
          paths +=
            svgRect(bx, by, cellW, cImgH) +
            svgLine(bx, by, bx + cellW, by + cImgH) +
            svgLine(bx + cellW, by, bx, by + cImgH);
          paths += svgRect(bx, by + cImgH, cellW, cellH - cImgH);
        }
      }
      break;
    }
    case "layout-news-mix": {
      const largeW = w * 0.55;
      const largeH = h * 0.65;
      paths +=
        svgRect(x, y, largeW, largeH) +
        svgLine(x, y, x + largeW, y + largeH) +
        svgLine(x + largeW, y, x, y + largeH);
      paths += svgRect(x, y + largeH + g, largeW, h - largeH - g);
      const smallW = w - largeW - g;
      const smallH = (h - g * 2) / 3;
      for (let i = 0; i < 3; i++) {
        const sy = y + i * (smallH + g);
        const simgH = smallH * 0.5;
        paths +=
          svgRect(x + largeW + g, sy, smallW, simgH) +
          svgLine(x + largeW + g, sy, x + w, sy + simgH) +
          svgLine(x + w, sy, x + largeW + g, sy + simgH);
        paths += svgRect(x + largeW + g, sy + simgH, smallW, smallH - simgH);
      }
      break;
    }
    case "layout-book-page": {
      const marginL = w * 0.12;
      const marginR = w * 0.08;
      const marginT = h * 0.1;
      const contentW = w - marginL - marginR;
      const contentH = h - marginT - h * 0.12;
      const bImgH = contentH * 0.4;
      paths += svgRect(x + marginL, y + marginT, contentW, contentH);
      paths +=
        svgRect(x + marginL, y + marginT, contentW, bImgH) +
        svgLine(
          x + marginL,
          y + marginT,
          x + marginL + contentW,
          y + marginT + bImgH,
        ) +
        svgLine(
          x + marginL + contentW,
          y + marginT,
          x + marginL,
          y + marginT + bImgH,
        );
      paths += svgLine(
        x + marginL,
        y + marginT + bImgH + g * 2,
        x + marginL + contentW,
        y + marginT + bImgH + g * 2,
      );
      break;
    }
    case "modular-2x2":
      paths += generateModSVG(x, y, w, h, 2, 2, g);
      break;
    case "modular-3x3":
      paths += generateModSVG(x, y, w, h, 3, 3, g);
      break;
    case "modular-4x4":
      paths += generateModSVG(x, y, w, h, 4, 4, g);
      break;
    case "modular-4x6":
      paths += generateModSVG(x, y, w, h, 4, 6, g);
      break;
    case "modular-5x5":
      paths += generateModSVG(x, y, w, h, 5, 5, g);
      break;
    case "modular-6x6":
      paths += generateModSVG(x, y, w, h, 6, 6, g);
      break;
    case "isometric":
      paths += generateIsoSVG(x, y, w, h, s);
      break;
    case "perspective-1pt":
      paths += generate1PSVG(x, y, w, h);
      break;
    case "perspective-2pt":
      paths += generate2PSVG(x, y, w, h);
      break;
    case "perspective-3pt":
      paths += generate3PSVG(x, y, w, h);
      break;
    case "field-grid": {
      const fc = 4;
      const fgr = 6;
      const fgw = w / fc;
      const fgh = h / fgr;
      for (let i = 0; i <= fc; i++)
        paths += svgLine(x + i * fgw, y, x + i * fgw, y + h);
      for (let i = 0; i <= fgr; i++)
        paths += svgLine(x, y + i * fgh, x + w, y + i * fgh);
      break;
    }
    case "musical":
      [0, 0.125, 0.25, 0.333, 0.5, 0.667, 0.75, 0.875, 1].forEach((v) => {
        paths += svgLine(x, y + h * v, x + w, y + h * v);
      });
      break;
    case "progressive":
      [0, 0.08, 0.18, 0.3, 0.45, 0.62, 0.8, 1].forEach((v) => {
        paths += svgLine(x, y + h * v, x + w, y + h * v);
      });
      break;
    case "fibonacci-rhythm": {
      let fibAcc = 0;
      [0, 1, 1, 2, 3, 5, 8, 13, 21].forEach((v, i) => {
        if (i > 0) {
          const p = fibAcc / 34;
          paths += svgLine(x, y + h * p, x + w, y + h * p);
        }
        fibAcc += v;
      });
      break;
    }
    case "phi-sections":
      [0, 1 - 1 / phi, 1 / phi, 1 - 1 / phi / phi, 1 / phi / phi, 1].forEach(
        (v) => {
          paths += svgLine(x, y + h * v, x + w, y + h * v);
        },
      );
      break;
    case "fifths":
      [0, 0.2, 0.4, 0.6, 0.8, 1].forEach((v) => {
        paths += svgLine(x, y + h * v, x + w, y + h * v);
      });
      break;
    case "sevenths":
      for (let i = 0; i <= 7; i++)
        paths += svgLine(x, y + (h * i) / 7, x + w, y + (h * i) / 7);
      break;
    case "standard-4":
      paths += generateStdSVG(x, y, w, h, 4 * s);
      break;
    case "standard-8":
      paths += generateStdSVG(x, y, w, h, 8 * s);
      break;
    case "standard-12":
      paths += generateStdSVG(x, y, w, h, 12 * s);
      break;
    case "standard-24":
      paths += generateStdSVG(x, y, w, h, 24 * s);
      break;
    case "standard-48":
      paths += generateStdSVG(x, y, w, h, 48 * s);
      break;
    case "baseline-4":
      paths += generateBaseSVG(x, y, w, h, 4 * s);
      break;
    case "baseline-8":
      paths += generateBaseSVG(x, y, w, h, 8 * s);
      break;
    case "baseline-12":
      paths += generateBaseSVG(x, y, w, h, 12 * s);
      break;
    case "baseline-24":
      paths += generateBaseSVG(x, y, w, h, 24 * s);
      break;
    case "baseline-48":
      paths += generateBaseSVG(x, y, w, h, 48 * s);
      break;
    case "columns-2":
    case "columns-3":
    case "columns-4":
    case "columns-5":
    case "columns-6":
    case "columns-8":
    case "columns-12":
      paths += generateColsSVG(x, y, w, h, +id.split("-")[1], g);
      break;
    case "rows-2":
    case "rows-3":
    case "rows-4":
    case "rows-6":
    case "rows-8":
    case "rows-12":
      paths += generateRowsSVG(x, y, w, h, +id.split("-")[1], g);
      break;
    case "compound-3-4":
      paths += generateCompoundSVG(x, y, w, h, 3, 4);
      break;
    case "compound-3-5":
      paths += generateCompoundSVG(x, y, w, h, 3, 5);
      break;
    case "compound-4-5":
      paths += generateCompoundSVG(x, y, w, h, 4, 5);
      break;
    case "compound-4-6":
      paths += generateCompoundSVG(x, y, w, h, 4, 6);
      break;
    case "compound-5-6":
      paths += generateCompoundSVG(x, y, w, h, 5, 6);
      break;
    case "program":
      paths += generateProgramSVG(x, y, w, h);
      break;
    case "cross-channel": {
      const ng1 = w / phi;
      const ng2 = ng1 / phi;
      paths +=
        svgLine(x + ng1, y, x + ng1, y + h) +
        svgLine(x + w - ng1, y, x + w - ng1, y + h) +
        svgLine(x + ng2, y, x + ng2, y + h) +
        svgLine(x + w - ng2, y, x + w - ng2, y + h);
      const ngh1 = h / phi;
      const ngh2 = ngh1 / phi;
      paths +=
        svgLine(x, y + ngh1, x + w, y + ngh1) +
        svgLine(x, y + h - ngh1, x + w, y + h - ngh1) +
        svgLine(x, y + ngh2, x + w, y + ngh2) +
        svgLine(x, y + h - ngh2, x + w, y + h - ngh2);
      break;
    }
    case "asymmetric-compound": {
      const acw = w / 3;
      paths += svgRect(x, y, acw, h);
      const colW = (w - acw - g - g * 5) / 6;
      for (let i = 0; i < 6; i++)
        paths += svgRect(x + acw + g + i * (colW + g), y, colW, h);
      break;
    }
    case "circle":
      paths += svgCircle(cx, cy, r);
      break;
    case "vesica-piscis": {
      const vr = r * 0.75;
      paths += svgCircle(cx - vr * 0.4, cy, vr) + svgCircle(cx + vr * 0.4, cy, vr);
      break;
    }
    case "trinity":
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3 - Math.PI / 2;
        paths += svgCircle(
          cx + r * 0.35 * Math.cos(a),
          cy + r * 0.35 * Math.sin(a),
          r * 0.7,
        );
      }
      break;
    case "tetrad":
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        paths += svgCircle(
          cx + r * 0.4 * Math.cos(a),
          cy + r * 0.4 * Math.sin(a),
          r * 0.65,
        );
      }
      break;
    case "quintet":
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        paths += svgCircle(
          cx + r * 0.45 * Math.cos(a),
          cy + r * 0.45 * Math.sin(a),
          r * 0.58,
        );
      }
      break;
    case "seed-of-life": {
      const sr = r * 0.5;
      paths += svgCircle(cx, cy, sr);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        paths += svgCircle(cx + sr * Math.cos(a), cy + sr * Math.sin(a), sr);
      }
      break;
    }
    case "flower-of-life": {
      const flr = r * 0.28;
      paths += svgCircle(cx, cy, flr);
      for (let ring = 0; ring < 2; ring++) {
        const dist = flr * (ring + 1);
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3 + (ring * Math.PI) / 6;
          paths += svgCircle(
            cx + dist * Math.cos(a),
            cy + dist * Math.sin(a),
            flr,
          );
        }
      }
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        paths += svgCircle(
          cx + flr * 2 * Math.cos(a),
          cy + flr * 2 * Math.sin(a),
          flr,
        );
      }
      break;
    }
    case "sri-yantra":
      paths += generateSriYantraSVG(cx, cy, r);
      break;
    case "metatrons-cube":
      paths += generateMetatronSVG(cx, cy, r);
      break;

    // --- Interface grids ---

    case "ui-gutenberg": {
      // Quadrant dividers
      paths += svgLine(x, cy, x + w, cy) + svgLine(cx, y, cx, y + h);
      // Primary reading diagonal (top-left → bottom-right)
      paths += svgLine(x, y, x + w, y + h);
      // Primary Optical Area emphasis rect (top-left)
      paths += svgRect(x, y, w * 0.22, h * 0.22);
      // Terminal Area emphasis rect (bottom-right)
      paths += svgRect(x + w * 0.78, y + h * 0.78, w * 0.22, h * 0.22);
      break;
    }
    case "ui-app-shell": {
      const headerH = h * 0.07;
      const sideW = w * 0.22;
      const sideY = y + headerH + g;
      const sideH = h - headerH - g;
      const cX = x + sideW + g;
      const cW = w - sideW - g;
      const cY = sideY;
      const cH = sideH;
      // Header bar
      paths += svgRect(x, y, w, headerH);
      // Logo divider in header
      paths += svgLine(x + w * 0.15, y, x + w * 0.15, y + headerH);
      // Sidebar
      paths += svgRect(x, sideY, sideW, sideH);
      // Sidebar logo/brand area
      paths += svgLine(x, sideY + sideH * 0.12, x + sideW, sideY + sideH * 0.12);
      // Sidebar nav dividers
      paths += svgLine(x, sideY + sideH * 0.35, x + sideW, sideY + sideH * 0.35);
      paths += svgLine(x, sideY + sideH * 0.58, x + sideW, sideY + sideH * 0.58);
      // Content area
      paths += svgRect(cX, cY, cW, cH);
      // Breadcrumb/sub-header line
      paths += svgLine(cX, cY + cH * 0.05, cX + cW, cY + cH * 0.05);
      break;
    }
    case "ui-three-panel": {
      const totalG = g * 2;
      const unitW = (w - totalG) / 4;
      const leftW = unitW;
      const centerW = unitW * 2;
      const rightW = unitW;
      const leftX = x;
      const centerX = x + leftW + g;
      const rightX = centerX + centerW + g;
      // Three panels
      paths += svgRect(leftX, y, leftW, h);
      paths += svgRect(centerX, y, centerW, h);
      paths += svgRect(rightX, y, rightW, h);
      // Left panel header + section divider
      paths += svgLine(leftX, y + h * 0.12, leftX + leftW, y + h * 0.12);
      paths += svgLine(leftX, y + h * 0.45, leftX + leftW, y + h * 0.45);
      // Center panel header + content zone split
      paths += svgLine(centerX, y + h * 0.12, centerX + centerW, y + h * 0.12);
      paths += svgLine(centerX, y + h * 0.55, centerX + centerW, y + h * 0.55);
      // Right panel header + section dividers
      paths += svgLine(rightX, y + h * 0.12, rightX + rightW, y + h * 0.12);
      paths += svgLine(rightX, y + h * 0.4, rightX + rightW, y + h * 0.4);
      paths += svgLine(rightX, y + h * 0.65, rightX + rightW, y + h * 0.65);
      break;
    }
    case "ui-dashboard": {
      const dHeaderH = h * 0.07;
      const dSideW = w * 0.22;
      const dSideY = y + dHeaderH + g;
      const dSideH = h - dHeaderH - g;
      const dContentX = x + dSideW + g;
      const dContentY = dSideY;
      const dContentW = w - dSideW - g;
      const dContentH = dSideH;
      const dCellW = (dContentW - g) / 2;
      const dCellH = (dContentH - g) / 2;
      // Header
      paths += svgRect(x, y, w, dHeaderH);
      // Logo divider in header
      paths += svgLine(x + w * 0.15, y, x + w * 0.15, y + dHeaderH);
      // Sidebar
      paths += svgRect(x, dSideY, dSideW, dSideH);
      // Sidebar nav dividers
      paths += svgLine(x, dSideY + dSideH * 0.15, x + dSideW, dSideY + dSideH * 0.15);
      paths += svgLine(x, dSideY + dSideH * 0.4, x + dSideW, dSideY + dSideH * 0.4);
      paths += svgLine(x, dSideY + dSideH * 0.65, x + dSideW, dSideY + dSideH * 0.65);
      // 2×2 content grid — top-left with X-cross (data viz)
      paths += svgRect(dContentX, dContentY, dCellW, dCellH);
      paths += svgLine(dContentX, dContentY, dContentX + dCellW, dContentY + dCellH);
      paths += svgLine(dContentX + dCellW, dContentY, dContentX, dContentY + dCellH);
      // Top-right
      paths += svgRect(dContentX + dCellW + g, dContentY, dCellW, dCellH);
      // Bottom-left
      paths += svgRect(dContentX, dContentY + dCellH + g, dCellW, dCellH);
      // Bottom-right
      paths += svgRect(dContentX + dCellW + g, dContentY + dCellH + g, dCellW, dCellH);
      break;
    }
    case "ui-canvas": {
      const canvLeftW = w * 0.28;
      const canvRightW = w - canvLeftW - g;
      const canvRightX = x + canvLeftW + g;
      // Left panel
      paths += svgRect(x, y, canvLeftW, h);
      // Left panel: layers section header
      paths += svgLine(x, y + h * 0.08, x + canvLeftW, y + h * 0.08);
      // Left panel: layers/properties split
      paths += svgLine(x, y + h * 0.42, x + canvLeftW, y + h * 0.42);
      // Left panel: properties section header
      paths += svgLine(x, y + h * 0.5, x + canvLeftW, y + h * 0.5);
      // Right canvas
      paths += svgRect(canvRightX, y, canvRightW, h);
      // Top toolbar
      paths += svgLine(canvRightX, y + h * 0.06, canvRightX + canvRightW, y + h * 0.06);
      // Bottom status bar
      paths += svgLine(canvRightX, y + h * 0.95, canvRightX + canvRightW, y + h * 0.95);
      break;
    }
    case "ui-chat-artifact": {
      const chatW = w * 0.38;
      const artW = w - chatW - g;
      const artX = x + chatW + g;
      // Chat panel
      paths += svgRect(x, y, chatW, h);
      // Chat header
      paths += svgLine(x, y + h * 0.07, x + chatW, y + h * 0.07);
      // Chat input area divider
      paths += svgLine(x, y + h * 0.82, x + chatW, y + h * 0.82);
      // Input field rect
      paths += svgRect(x + chatW * 0.08, y + h * 0.85, chatW * 0.84, h * 0.1);
      // Artifact panel
      paths += svgRect(artX, y, artW, h);
      // Artifact toolbar
      paths += svgLine(artX, y + h * 0.06, artX + artW, y + h * 0.06);
      break;
    }
    case "ui-agent-workflow": {
      const awHeaderH = h * 0.1;
      const awStatusH = h * 0.05;
      const awColY = y + awHeaderH + g;
      const awColH = h - awHeaderH - awStatusH - g * 2;
      const awColW = (w - g * 2) / 3;
      const awCol1X = x;
      const awCol2X = x + awColW + g;
      const awCol3X = x + awColW * 2 + g * 2;
      const awStatusY = y + h - awStatusH;
      // Header
      paths += svgRect(x, y, w, awHeaderH);
      // Three columns
      paths += svgRect(awCol1X, awColY, awColW, awColH);
      paths += svgRect(awCol2X, awColY, awColW, awColH);
      paths += svgRect(awCol3X, awColY, awColW, awColH);
      // Column headers
      paths += svgLine(awCol1X, awColY + awColH * 0.1, awCol1X + awColW, awColY + awColH * 0.1);
      paths += svgLine(awCol2X, awColY + awColH * 0.1, awCol2X + awColW, awColY + awColH * 0.1);
      paths += svgLine(awCol3X, awColY + awColH * 0.1, awCol3X + awColW, awColY + awColH * 0.1);
      // Bridge lines between columns (flow indicators)
      const awBridgeY = awColY + awColH * 0.5;
      paths += svgLine(awCol1X + awColW, awBridgeY, awCol2X, awBridgeY);
      paths += svgLine(awCol2X + awColW, awBridgeY, awCol3X, awBridgeY);
      // Bottom status bar
      paths += svgLine(x, awStatusY, x + w, awStatusY);
      break;
    }
  }
  return paths;
}

// --- SVG helper generators ---

function generateGoldenSpiralSVG(
  x: number,
  y: number,
  w: number,
  h: number,
): string {
  const p = 1.618;
  let cx = x,
    cy = y,
    cw = w,
    ch = h;
  let paths = "";
  for (let i = 0; i < 8; i++) {
    if (i % 4 === 0) {
      const nw = cw / p;
      paths += svgLine(cx + nw, cy, cx + nw, cy + ch);
      cx += nw;
      cw -= nw;
    } else if (i % 4 === 1) {
      const nh = ch / p;
      paths += svgLine(cx, cy + ch - nh, cx + cw, cy + ch - nh);
      ch -= nh;
    } else if (i % 4 === 2) {
      const nw = cw / p;
      paths += svgLine(cx + cw - nw, cy, cx + cw - nw, cy + ch);
      cw -= nw;
    } else {
      const nh = ch / p;
      paths += svgLine(cx, cy + nh, cx + cw, cy + nh);
      cy += nh;
      ch -= nh;
    }
  }
  return paths;
}

function generateModSVG(
  x: number,
  y: number,
  w: number,
  h: number,
  cols: number,
  rows: number,
  g: number,
): string {
  const cw = (w - g * (cols - 1)) / cols;
  const rh = (h - g * (rows - 1)) / rows;
  let paths = "";
  for (let col = 0; col < cols; col++)
    for (let row = 0; row < rows; row++)
      paths += `<rect x="${x + col * (cw + g)}" y="${y + row * (rh + g)}" width="${cw}" height="${rh}"/>`;
  return paths;
}

function generateBaseSVG(
  x: number,
  y: number,
  w: number,
  h: number,
  sp: number,
): string {
  let paths = "";
  for (let py = y; py <= y + h; py += sp)
    paths += `<line x1="${x}" y1="${py}" x2="${x + w}" y2="${py}"/>`;
  return paths;
}

function generateStdSVG(
  x: number,
  y: number,
  w: number,
  h: number,
  sp: number,
): string {
  let paths = "";
  for (let py = y; py <= y + h; py += sp)
    paths += `<line x1="${x}" y1="${py}" x2="${x + w}" y2="${py}"/>`;
  for (let px = x; px <= x + w; px += sp)
    paths += `<line x1="${px}" y1="${y}" x2="${px}" y2="${y + h}"/>`;
  return paths;
}

function generateIsoSVG(
  x: number,
  y: number,
  w: number,
  h: number,
  s: number,
): string {
  // Equilateral triangle tessellation — clipped to working area
  const sp = 30 * s;
  const triH = (sp * Math.sqrt(3)) / 2;
  const numRows = Math.ceil(h / triH) + 1;
  const numCols = Math.ceil(w / sp) + 2;
  let inner = "";
  // Horizontal lines
  for (let r = 0; r <= numRows; r++)
    inner += svgLine(x, y + h - r * triH, x + w, y + h - r * triH);
  // Diagonal edges: V-shapes from each triangle apex
  for (let r = 0; r < numRows; r++) {
    const yBot = y + h - r * triH;
    const yTop = yBot - triH;
    const xOff = r % 2 === 0 ? sp / 2 : 0;
    for (let k = -1; k <= numCols; k++) {
      const ax = x + k * sp + xOff;
      inner += svgLine(ax - sp / 2, yBot, ax, yTop);
      inner += svgLine(ax + sp / 2, yBot, ax, yTop);
    }
  }
  return `<defs><clipPath id="iso-clip"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><g clip-path="url(#iso-clip)">${inner}</g>` + svgRect(x, y, w, h);
}

function generate1PSVG(
  x: number,
  y: number,
  w: number,
  h: number,
): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  let paths = "";
  [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
    [x + w / 2, y],
    [x + w, cy],
    [x + w / 2, y + h],
    [x, cy],
  ].forEach((p) => {
    paths += `<line x1="${cx}" y1="${cy}" x2="${p[0]}" y2="${p[1]}"/>`;
  });
  paths += `<line x1="${x}" y1="${cy}" x2="${x + w}" y2="${cy}"/>`;
  return paths;
}

function generate2PSVG(
  x: number,
  y: number,
  w: number,
  h: number,
): string {
  const hy = y + h * 0.4;
  const lv = x - w * 0.1;
  const rv = x + w * 1.1;
  let paths = `<line x1="${x}" y1="${hy}" x2="${x + w}" y2="${hy}"/>`;
  for (let i = 0; i <= 4; i++) {
    paths += `<line x1="${lv}" y1="${hy}" x2="${x + w}" y2="${y + (h * i) / 4}"/>`;
    paths += `<line x1="${rv}" y1="${hy}" x2="${x}" y2="${y + (h * i) / 4}"/>`;
  }
  return paths;
}

function generate3PSVG(
  x: number,
  y: number,
  w: number,
  h: number,
): string {
  const hy = y + h * 0.3;
  const lv = x - w * 0.1;
  const rv = x + w * 1.1;
  const bv = y + h * 1.3;
  let paths = `<line x1="${x}" y1="${hy}" x2="${x + w}" y2="${hy}"/>`;
  for (let i = 0; i <= 3; i++) {
    paths += `<line x1="${lv}" y1="${hy}" x2="${x + w}" y2="${y + (h * i) / 3}"/>`;
    paths += `<line x1="${rv}" y1="${hy}" x2="${x}" y2="${y + (h * i) / 3}"/>`;
  }
  for (let i = 0; i <= 4; i++)
    paths += `<line x1="${x + (w * i) / 4}" y1="${y}" x2="${x + w / 2}" y2="${bv}"/>`;
  return paths;
}

function generateColsSVG(
  x: number,
  y: number,
  w: number,
  h: number,
  n: number,
  g: number,
): string {
  const cw = (w - g * (n - 1)) / n;
  let paths = "";
  for (let i = 0; i < n; i++) {
    const cx = x + i * (cw + g);
    paths += `<line x1="${cx}" y1="${y}" x2="${cx}" y2="${y + h}"/>`;
    paths += `<line x1="${cx + cw}" y1="${y}" x2="${cx + cw}" y2="${y + h}"/>`;
  }
  return paths;
}

function generateRowsSVG(
  x: number,
  y: number,
  w: number,
  h: number,
  n: number,
  g: number,
): string {
  const rh = (h - g * (n - 1)) / n;
  let paths = "";
  for (let i = 0; i < n; i++) {
    const ry = y + i * (rh + g);
    paths += `<line x1="${x}" y1="${ry}" x2="${x + w}" y2="${ry}"/>`;
    paths += `<line x1="${x}" y1="${ry + rh}" x2="${x + w}" y2="${ry + rh}"/>`;
  }
  return paths;
}

function generateCompoundSVG(
  x: number,
  y: number,
  w: number,
  h: number,
  n1: number,
  n2: number,
): string {
  let paths = `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`;
  for (let i = 1; i < n1; i++)
    paths += `<line x1="${x + (w * i) / n1}" y1="${y}" x2="${x + (w * i) / n1}" y2="${y + h}"/>`;
  for (let i = 1; i < n2; i++)
    paths += `<line x1="${x + (w * i) / n2}" y1="${y}" x2="${x + (w * i) / n2}" y2="${y + h}"/>`;
  for (let i = 1; i < n1; i++)
    paths += `<line x1="${x}" y1="${y + (h * i) / n1}" x2="${x + w}" y2="${y + (h * i) / n1}"/>`;
  for (let i = 1; i < n2; i++)
    paths += `<line x1="${x}" y1="${y + (h * i) / n2}" x2="${x + w}" y2="${y + (h * i) / n2}"/>`;
  return paths;
}

function generateProgramSVG(
  x: number,
  y: number,
  w: number,
  h: number,
): string {
  let paths = `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`;
  [2, 3, 4, 5, 6].forEach((d) => {
    for (let i = 1; i < d; i++) {
      paths += `<line x1="${x + (w * i) / d}" y1="${y}" x2="${x + (w * i) / d}" y2="${y + h}"/>`;
      paths += `<line x1="${x}" y1="${y + (h * i) / d}" x2="${x + w}" y2="${y + (h * i) / d}"/>`;
    }
  });
  return paths;
}

function generateSriYantraSVG(cx: number, cy: number, r: number): string {
  const s = r * 1.15;
  let paths = "";
  const upTris = [
    [
      [0, -0.92],
      [-0.82, 0.58],
      [0.82, 0.58],
    ],
    [
      [0, -0.58],
      [-0.52, 0.32],
      [0.52, 0.32],
    ],
    [
      [0, -0.32],
      [-0.32, 0.16],
      [0.32, 0.16],
    ],
    [
      [0, -0.12],
      [-0.14, 0.06],
      [0.14, 0.06],
    ],
  ];
  const downTris = [
    [
      [0, 0.92],
      [-0.72, -0.48],
      [0.72, -0.48],
    ],
    [
      [0, 0.62],
      [-0.54, -0.32],
      [0.54, -0.32],
    ],
    [
      [0, 0.42],
      [-0.38, -0.2],
      [0.38, -0.2],
    ],
    [
      [0, 0.26],
      [-0.24, -0.1],
      [0.24, -0.1],
    ],
    [
      [0, 0.12],
      [-0.1, -0.04],
      [0.1, -0.04],
    ],
  ];
  [...upTris, ...downTris].forEach((tri) => {
    paths += `<polygon points="${tri.map((p) => `${cx + p[0] * s},${cy + p[1] * s}`).join(" ")}"/>`;
  });
  paths += `<line x1="${cx - s * 0.82}" y1="${cy + s * 0.58}" x2="${cx + s * 0.82}" y2="${cy + s * 0.58}"/>`;
  paths += `<line x1="${cx - s * 0.72}" y1="${cy - s * 0.48}" x2="${cx + s * 0.72}" y2="${cy - s * 0.48}"/>`;
  return paths;
}

function generateMetatronSVG(cx: number, cy: number, r: number): string {
  let paths = "";
  const pts: number[][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 2;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  const inner: number[][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 2;
    inner.push([cx + r * 0.5 * Math.cos(a), cy + r * 0.5 * Math.sin(a)]);
  }
  pts.push([cx, cy]);
  inner.forEach((p) => pts.push(p));
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++)
      paths += `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${pts[j][0]}" y2="${pts[j][1]}"/>`;
  [...pts.slice(0, 6), ...inner].forEach((p) => {
    paths += `<circle cx="${p[0]}" cy="${p[1]}" r="${r * 0.25}"/>`;
  });
  paths += `<circle cx="${cx}" cy="${cy}" r="${r * 0.25}"/>`;
  return paths;
}

// --- Canvas drawing functions ---

function drawGrid(
  c: CanvasRenderingContext2D,
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  g: number,
  s: number,
): void {
  c.beginPath();
  const phi = 1.618;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) * 0.4;

  switch (id) {
    case "rule-of-thirds":
      c.moveTo(x + w / 3, y);
      c.lineTo(x + w / 3, y + h);
      c.moveTo(x + (2 * w) / 3, y);
      c.lineTo(x + (2 * w) / 3, y + h);
      c.moveTo(x, y + h / 3);
      c.lineTo(x + w, y + h / 3);
      c.moveTo(x, y + (2 * h) / 3);
      c.lineTo(x + w, y + (2 * h) / 3);
      break;
    case "fibonacci":
      drawGoldenSpiral(c, x, y, w, h);
      break;
    case "center-lines":
      c.moveTo(x + w / 2, y);
      c.lineTo(x + w / 2, y + h);
      c.moveTo(x, y + h / 2);
      c.lineTo(x + w, y + h / 2);
      break;
    case "dynamic-symmetry":
      c.moveTo(x, y); c.lineTo(x + w, y + h);
      c.moveTo(x + w, y); c.lineTo(x, y + h);
      c.moveTo(x, y); c.lineTo(x + w, y + h * 0.618);
      c.moveTo(x + w, y); c.lineTo(x, y + h * 0.618);
      c.moveTo(x, y + h); c.lineTo(x + w, y + h * 0.382);
      c.moveTo(x + w, y + h); c.lineTo(x, y + h * 0.382);
      break;
    case "harmonic-armature":
      c.moveTo(x, y); c.lineTo(x + w, y + h);
      c.moveTo(x + w, y); c.lineTo(x, y + h);
      c.moveTo(x + w / 2, y); c.lineTo(x, y + h);
      c.moveTo(x + w / 2, y); c.lineTo(x + w, y + h);
      c.moveTo(x, y + h / 2); c.lineTo(x + w, y);
      c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h);
      c.moveTo(x + w, y + h / 2); c.lineTo(x, y);
      c.moveTo(x + w, y + h / 2); c.lineTo(x, y + h);
      break;
    case "axial-15": {
      const ang = (15 * Math.PI) / 180;
      const dy = (w * Math.tan(ang)) / 2;
      c.moveTo(x, cy - dy); c.lineTo(x + w, cy + dy);
      break;
    }
    case "axial-30": {
      const ang = (30 * Math.PI) / 180;
      const dy = (w * Math.tan(ang)) / 2;
      c.moveTo(x, cy - dy); c.lineTo(x + w, cy + dy);
      break;
    }
    case "axial-45":
      c.moveTo(x, y); c.lineTo(x + w, y + h);
      break;
    case "axial-60": {
      const ang = (60 * Math.PI) / 180;
      const dy = Math.min((w * Math.tan(ang)) / 2, h / 2);
      const dx = dy / Math.tan(ang);
      c.moveTo(cx - dx, y); c.lineTo(cx + dx, y + h);
      break;
    }
    case "axial-offset-high": {
      const ang = (30 * Math.PI) / 180;
      const offY = y + h * 0.25;
      const dy = (w * Math.tan(ang)) / 2;
      c.moveTo(x, offY - dy); c.lineTo(x + w, offY + dy);
      break;
    }
    case "axial-offset-low": {
      const ang = (30 * Math.PI) / 180;
      const offY = y + h * 0.75;
      const dy = (w * Math.tan(ang)) / 2;
      c.moveTo(x, offY - dy); c.lineTo(x + w, offY + dy);
      break;
    }
    case "diagonal":
      c.moveTo(x, y); c.lineTo(x + w, y + h);
      c.moveTo(x + w, y); c.lineTo(x, y + h);
      break;
    case "diagonal-thirds":
      c.moveTo(x, y); c.lineTo(x + w, y + h);
      c.moveTo(x + w, y); c.lineTo(x, y + h);
      c.moveTo(x + w / 3, y); c.lineTo(x + w, y + (h * 2) / 3);
      c.moveTo(x, y + h / 3); c.lineTo(x + (w * 2) / 3, y + h);
      c.moveTo(x + (w * 2) / 3, y); c.lineTo(x, y + (h * 2) / 3);
      c.moveTo(x + w, y + h / 3); c.lineTo(x + w / 3, y + h);
      break;
    case "diagonal-quarters":
      c.moveTo(x, y); c.lineTo(x + w, y + h);
      c.moveTo(x + w, y); c.lineTo(x, y + h);
      c.moveTo(x + w / 2, y); c.lineTo(x, y + h / 2);
      c.moveTo(x + w / 2, y); c.lineTo(x + w, y + h / 2);
      c.moveTo(x, y + h / 2); c.lineTo(x + w / 2, y + h);
      c.moveTo(x + w, y + h / 2); c.lineTo(x + w / 2, y + h);
      break;
    case "diagonal-cross": {
      for (let i = 1; i < 4; i++) {
        c.moveTo(x + (w * i) / 4, y); c.lineTo(x + w, y + (h * (4 - i)) / 4);
        c.moveTo(x, y + (h * i) / 4); c.lineTo(x + (w * (4 - i)) / 4, y + h);
        c.moveTo(x + (w * (4 - i)) / 4, y); c.lineTo(x, y + (h * (4 - i)) / 4);
        c.moveTo(x + w, y + (h * i) / 4); c.lineTo(x + (w * i) / 4, y + h);
      }
      c.moveTo(x, y); c.lineTo(x + w, y + h);
      c.moveTo(x + w, y); c.lineTo(x, y + h);
      break;
    }
    case "diagonal-angle": {
      const tan30 = Math.tan((30 * Math.PI) / 180);
      const tan60 = Math.tan((60 * Math.PI) / 180);
      c.moveTo(x, y + h); c.lineTo(Math.min(x + w, x + h / tan30), Math.max(y, y + h - h));
      c.moveTo(x + w, y + h); c.lineTo(Math.max(x, x + w - h / tan30), Math.max(y, y + h - h));
      c.moveTo(x, y + h); c.lineTo(Math.min(x + w, x + h / tan60), Math.max(y, y + h - h));
      c.moveTo(x + w, y + h); c.lineTo(Math.max(x, x + w - h / tan60), Math.max(y, y + h - h));
      break;
    }
    case "diagonal-chevron": {
      const chevH = h / 5;
      for (let i = 0; i < 5; i++) {
        const chevY = y + i * chevH;
        c.moveTo(x, chevY + chevH); c.lineTo(x + w / 2, chevY);
        c.moveTo(x + w / 2, chevY); c.lineTo(x + w, chevY + chevH);
      }
      break;
    }
    case "radial": {
      const rr = Math.min(w, h) / 2;
      for (let i = 1; i <= 5; i++) {
        c.moveTo(cx + (rr * i) / 5, cy);
        c.arc(cx, cy, (rr * i) / 5, 0, Math.PI * 2);
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        c.moveTo(cx, cy);
        c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      break;
    }
    case "radial-corner": {
      const maxR = Math.sqrt(w * w + h * h);
      for (let i = 1; i <= 5; i++) {
        const radius = (maxR * i) / 5;
        c.moveTo(x + w - radius, y + h);
        c.arc(x + w, y + h, radius, Math.PI, Math.PI * 1.5);
      }
      for (let i = 0; i < 5; i++) {
        const angle = Math.PI + (i / 4) * (Math.PI / 2);
        c.moveTo(x + w, y + h);
        c.lineTo(x + w + Math.cos(angle) * maxR, y + h + Math.sin(angle) * maxR);
      }
      break;
    }
    case "radial-concentric": {
      const cr = Math.min(w, h) / 2;
      for (let i = 1; i <= 12; i++) {
        c.moveTo(cx + (cr * i) / 12, cy);
        c.arc(cx, cy, (cr * i) / 12, 0, Math.PI * 2);
      }
      break;
    }
    case "radial-sunburst": {
      const rayR = Math.max(w, h);
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        c.moveTo(cx, cy);
        c.lineTo(cx + Math.cos(angle) * rayR, cy + Math.sin(angle) * rayR);
      }
      break;
    }
    case "radial-quadrant": {
      const qr = Math.min(w, h) * 0.6;
      for (let i = 1; i <= 3; i++) {
        const radius = (qr * i) / 3;
        c.moveTo(x, y + radius); c.arc(x, y, radius, Math.PI / 2, 0, true);
        c.moveTo(x + w - radius, y); c.arc(x + w, y, radius, Math.PI, Math.PI / 2, true);
        c.moveTo(x + w, y + h - radius); c.arc(x + w, y + h, radius, Math.PI * 1.5, Math.PI, true);
        c.moveTo(x + radius, y + h); c.arc(x, y + h, radius, 0, Math.PI * 1.5, true);
      }
      break;
    }
    case "manuscript":
      c.strokeRect(x + w * 0.1, y, w * 0.8, h);
      break;
    case "ratio-2-1": {
      const a21 = (w - g) / 3;
      c.strokeRect(x, y, a21 * 2, h);
      c.strokeRect(x + a21 * 2 + g, y, a21, h);
      break;
    }
    case "ratio-1-2": {
      const a12 = (w - g) / 3;
      c.strokeRect(x, y, a12, h);
      c.strokeRect(x + a12 + g, y, a12 * 2, h);
      break;
    }
    case "feature": {
      const fw = w * 0.6;
      c.strokeRect(x, y, fw, h * 0.65);
      c.strokeRect(x, y + h * 0.65 + g, fw, h * 0.35 - g);
      c.strokeRect(x + fw + g, y, w - fw - g, h);
      break;
    }
    case "pull-quote":
      c.strokeRect(x, y, w, h);
      c.strokeRect(x + w * 0.15, y + h * 0.35, w * 0.7, h * 0.3);
      break;
    case "layout-dual-header": {
      const imgH = h * 0.35, imgW = (w - g) / 2;
      c.strokeRect(x, y, imgW, imgH);
      c.moveTo(x, y); c.lineTo(x + imgW, y + imgH);
      c.moveTo(x + imgW, y); c.lineTo(x, y + imgH);
      c.strokeRect(x + imgW + g, y, imgW, imgH);
      c.moveTo(x + imgW + g, y); c.lineTo(x + w, y + imgH);
      c.moveTo(x + w, y); c.lineTo(x + imgW + g, y + imgH);
      const colW = (w - g * 2) / 3, colY = y + imgH + g, colH = h - imgH - g;
      for (let i = 0; i < 3; i++) c.strokeRect(x + i * (colW + g), colY, colW, colH);
      break;
    }
    case "layout-sidebar-stack": {
      const leftW = w * 0.55, rightW = w - leftW - g, topH = h * 0.65, rightImgH = (topH - g) / 2;
      c.strokeRect(x, y, leftW, topH);
      c.moveTo(x, y); c.lineTo(x + leftW, y + topH);
      c.moveTo(x + leftW, y); c.lineTo(x, y + topH);
      c.strokeRect(x + leftW + g, y, rightW, rightImgH);
      c.moveTo(x + leftW + g, y); c.lineTo(x + w, y + rightImgH);
      c.moveTo(x + w, y); c.lineTo(x + leftW + g, y + rightImgH);
      c.strokeRect(x + leftW + g, y + rightImgH + g, rightW, rightImgH);
      c.moveTo(x + leftW + g, y + rightImgH + g); c.lineTo(x + w, y + topH);
      c.moveTo(x + w, y + rightImgH + g); c.lineTo(x + leftW + g, y + topH);
      c.strokeRect(x, y + topH + g, w, h - topH - g);
      break;
    }
    case "layout-hero-split": {
      const heroW = w * 0.65, heroH = h * 0.6, sideW = w - heroW - g;
      c.strokeRect(x, y, heroW, heroH);
      c.moveTo(x, y); c.lineTo(x + heroW, y + heroH);
      c.moveTo(x + heroW, y); c.lineTo(x, y + heroH);
      c.strokeRect(x + heroW + g, y, sideW, heroH);
      c.strokeRect(x, y + heroH + g, w, h - heroH - g);
      break;
    }
    case "layout-poster-block": {
      const topH = h * 0.55;
      c.strokeRect(x, y, w, topH);
      c.moveTo(x, y); c.lineTo(x + w, y + topH);
      c.moveTo(x + w, y); c.lineTo(x, y + topH);
      const botH = h - topH - g, cellW = (w - g * 3) / 4;
      for (let i = 0; i < 4; i++) c.strokeRect(x + i * (cellW + g), y + topH + g, cellW, botH);
      break;
    }
    case "layout-catalog": {
      const cols = 3, rows = 2, cellW = (w - g * (cols - 1)) / cols, cellH = (h - g * (rows - 1)) / rows, cImgH = cellH * 0.7;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const bx = x + col * (cellW + g), by = y + row * (cellH + g);
          c.strokeRect(bx, by, cellW, cImgH);
          c.moveTo(bx, by); c.lineTo(bx + cellW, by + cImgH);
          c.moveTo(bx + cellW, by); c.lineTo(bx, by + cImgH);
          c.strokeRect(bx, by + cImgH, cellW, cellH - cImgH);
        }
      }
      break;
    }
    case "layout-news-mix": {
      const largeW = w * 0.55, largeH = h * 0.65;
      c.strokeRect(x, y, largeW, largeH);
      c.moveTo(x, y); c.lineTo(x + largeW, y + largeH);
      c.moveTo(x + largeW, y); c.lineTo(x, y + largeH);
      c.strokeRect(x, y + largeH + g, largeW, h - largeH - g);
      const smallW = w - largeW - g, smallH = (h - g * 2) / 3;
      for (let i = 0; i < 3; i++) {
        const sy = y + i * (smallH + g), simgH = smallH * 0.5;
        c.strokeRect(x + largeW + g, sy, smallW, simgH);
        c.moveTo(x + largeW + g, sy); c.lineTo(x + w, sy + simgH);
        c.moveTo(x + w, sy); c.lineTo(x + largeW + g, sy + simgH);
        c.strokeRect(x + largeW + g, sy + simgH, smallW, smallH - simgH);
      }
      break;
    }
    case "layout-book-page": {
      const marginL = w * 0.12, marginR = w * 0.08, marginT = h * 0.1;
      const contentW = w - marginL - marginR, contentH = h - marginT - h * 0.12, bImgH = contentH * 0.4;
      c.strokeRect(x + marginL, y + marginT, contentW, contentH);
      c.strokeRect(x + marginL, y + marginT, contentW, bImgH);
      c.moveTo(x + marginL, y + marginT); c.lineTo(x + marginL + contentW, y + marginT + bImgH);
      c.moveTo(x + marginL + contentW, y + marginT); c.lineTo(x + marginL, y + marginT + bImgH);
      c.moveTo(x + marginL, y + marginT + bImgH + g * 2); c.lineTo(x + marginL + contentW, y + marginT + bImgH + g * 2);
      break;
    }
    case "modular-2x2": drawMod(c, x, y, w, h, 2, 2, g); break;
    case "modular-3x3": drawMod(c, x, y, w, h, 3, 3, g); break;
    case "modular-4x4": drawMod(c, x, y, w, h, 4, 4, g); break;
    case "modular-4x6": drawMod(c, x, y, w, h, 4, 6, g); break;
    case "modular-5x5": drawMod(c, x, y, w, h, 5, 5, g); break;
    case "modular-6x6": drawMod(c, x, y, w, h, 6, 6, g); break;
    case "isometric": drawIso(c, x, y, w, h, s); break;
    case "perspective-1pt": draw1P(c, x, y, w, h); break;
    case "perspective-2pt": draw2P(c, x, y, w, h); break;
    case "perspective-3pt": draw3P(c, x, y, w, h); break;
    case "field-grid": {
      const fc = 4, fgr = 6, fgw = w / fc, fgh = h / fgr;
      for (let i = 0; i <= fc; i++) { c.moveTo(x + i * fgw, y); c.lineTo(x + i * fgw, y + h); }
      for (let i = 0; i <= fgr; i++) { c.moveTo(x, y + i * fgh); c.lineTo(x + w, y + i * fgh); }
      break;
    }
    case "musical":
      [0, 0.125, 0.25, 0.333, 0.5, 0.667, 0.75, 0.875, 1].forEach((v) => {
        c.moveTo(x, y + h * v); c.lineTo(x + w, y + h * v);
      });
      break;
    case "progressive":
      [0, 0.08, 0.18, 0.3, 0.45, 0.62, 0.8, 1].forEach((v) => {
        c.moveTo(x, y + h * v); c.lineTo(x + w, y + h * v);
      });
      break;
    case "fibonacci-rhythm":
      [0, 1, 1, 2, 3, 5, 8, 13, 21].reduce((a, v, i) => {
        if (i > 0) { const p = a / 34; c.moveTo(x, y + h * p); c.lineTo(x + w, y + h * p); }
        return a + v;
      }, 0);
      break;
    case "phi-sections":
      [0, 1 - 1 / phi, 1 / phi, 1 - 1 / phi / phi, 1 / phi / phi, 1].forEach((v) => {
        c.moveTo(x, y + h * v); c.lineTo(x + w, y + h * v);
      });
      break;
    case "fifths":
      [0, 0.2, 0.4, 0.6, 0.8, 1].forEach((v) => {
        c.moveTo(x, y + h * v); c.lineTo(x + w, y + h * v);
      });
      break;
    case "sevenths":
      for (let i = 0; i <= 7; i++) { c.moveTo(x, y + (h * i) / 7); c.lineTo(x + w, y + (h * i) / 7); }
      break;
    case "standard-4": drawStd(c, x, y, w, h, 4 * s); break;
    case "standard-8": drawStd(c, x, y, w, h, 8 * s); break;
    case "standard-12": drawStd(c, x, y, w, h, 12 * s); break;
    case "standard-24": drawStd(c, x, y, w, h, 24 * s); break;
    case "standard-48": drawStd(c, x, y, w, h, 48 * s); break;
    case "baseline-4": drawBase(c, x, y, w, h, 4 * s); break;
    case "baseline-8": drawBase(c, x, y, w, h, 8 * s); break;
    case "baseline-12": drawBase(c, x, y, w, h, 12 * s); break;
    case "baseline-24": drawBase(c, x, y, w, h, 24 * s); break;
    case "baseline-48": drawBase(c, x, y, w, h, 48 * s); break;
    case "columns-2": case "columns-3": case "columns-4": case "columns-5":
    case "columns-6": case "columns-8": case "columns-12":
      drawCols(c, x, y, w, h, +id.split("-")[1], g);
      break;
    case "rows-2": case "rows-3": case "rows-4": case "rows-6":
    case "rows-8": case "rows-12":
      drawRows(c, x, y, w, h, +id.split("-")[1], g);
      break;
    case "compound-3-4": drawCompound(c, x, y, w, h, 3, 4); break;
    case "compound-3-5": drawCompound(c, x, y, w, h, 3, 5); break;
    case "compound-4-5": drawCompound(c, x, y, w, h, 4, 5); break;
    case "compound-4-6": drawCompound(c, x, y, w, h, 4, 6); break;
    case "compound-5-6": drawCompound(c, x, y, w, h, 5, 6); break;
    case "program": drawProgram(c, x, y, w, h); break;
    case "cross-channel": {
      const ng1 = w / phi, ng2 = ng1 / phi;
      c.moveTo(x + ng1, y); c.lineTo(x + ng1, y + h);
      c.moveTo(x + w - ng1, y); c.lineTo(x + w - ng1, y + h);
      c.moveTo(x + ng2, y); c.lineTo(x + ng2, y + h);
      c.moveTo(x + w - ng2, y); c.lineTo(x + w - ng2, y + h);
      const ngh1 = h / phi, ngh2 = ngh1 / phi;
      c.moveTo(x, y + ngh1); c.lineTo(x + w, y + ngh1);
      c.moveTo(x, y + h - ngh1); c.lineTo(x + w, y + h - ngh1);
      c.moveTo(x, y + ngh2); c.lineTo(x + w, y + ngh2);
      c.moveTo(x, y + h - ngh2); c.lineTo(x + w, y + h - ngh2);
      break;
    }
    case "asymmetric-compound": {
      const acw = w / 3;
      c.strokeRect(x, y, acw, h);
      const acg = w - acw - g;
      const acColW = (acg - g * 5) / 6;
      for (let i = 0; i < 6; i++) c.strokeRect(x + acw + g + i * (acColW + g), y, acColW, h);
      break;
    }
    case "circle":
      c.moveTo(cx + r, cy); c.arc(cx, cy, r, 0, Math.PI * 2);
      break;
    case "vesica-piscis": {
      const vr = r * 0.75;
      c.moveTo(cx - vr * 0.4 + vr, cy); c.arc(cx - vr * 0.4, cy, vr, 0, Math.PI * 2);
      c.moveTo(cx + vr * 0.4 + vr, cy); c.arc(cx + vr * 0.4, cy, vr, 0, Math.PI * 2);
      break;
    }
    case "trinity":
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3 - Math.PI / 2;
        const px = cx + r * 0.35 * Math.cos(a), py = cy + r * 0.35 * Math.sin(a);
        c.moveTo(px + r * 0.7, py); c.arc(px, py, r * 0.7, 0, Math.PI * 2);
      }
      break;
    case "tetrad":
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        const px = cx + r * 0.4 * Math.cos(a), py = cy + r * 0.4 * Math.sin(a);
        c.moveTo(px + r * 0.65, py); c.arc(px, py, r * 0.65, 0, Math.PI * 2);
      }
      break;
    case "quintet":
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const px = cx + r * 0.45 * Math.cos(a), py = cy + r * 0.45 * Math.sin(a);
        c.moveTo(px + r * 0.58, py); c.arc(px, py, r * 0.58, 0, Math.PI * 2);
      }
      break;
    case "seed-of-life": {
      const sr = r * 0.5;
      c.moveTo(cx + sr, cy); c.arc(cx, cy, sr, 0, Math.PI * 2);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const px = cx + sr * Math.cos(a), py = cy + sr * Math.sin(a);
        c.moveTo(px + sr, py); c.arc(px, py, sr, 0, Math.PI * 2);
      }
      break;
    }
    case "flower-of-life": {
      const flr = r * 0.28;
      c.moveTo(cx + flr, cy); c.arc(cx, cy, flr, 0, Math.PI * 2);
      for (let ring = 0; ring < 2; ring++) {
        const dist = flr * (ring + 1);
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3 + (ring * Math.PI) / 6;
          const px = cx + dist * Math.cos(a), py = cy + dist * Math.sin(a);
          c.moveTo(px + flr, py); c.arc(px, py, flr, 0, Math.PI * 2);
        }
      }
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const px = cx + flr * 2 * Math.cos(a), py = cy + flr * 2 * Math.sin(a);
        c.moveTo(px + flr, py); c.arc(px, py, flr, 0, Math.PI * 2);
      }
      break;
    }
    case "sri-yantra": drawSriYantra(c, cx, cy, r); break;
    case "metatrons-cube": drawMetatron(c, cx, cy, r); break;

    // --- Interface grids ---

    case "ui-gutenberg": {
      // Quadrant dividers
      c.moveTo(x, cy); c.lineTo(x + w, cy);
      c.moveTo(cx, y); c.lineTo(cx, y + h);
      // Primary reading diagonal
      c.moveTo(x, y); c.lineTo(x + w, y + h);
      // Primary Optical Area rect (top-left)
      c.strokeRect(x, y, w * 0.22, h * 0.22);
      // Terminal Area rect (bottom-right)
      c.strokeRect(x + w * 0.78, y + h * 0.78, w * 0.22, h * 0.22);
      break;
    }
    case "ui-app-shell": {
      const headerH = h * 0.07;
      const sideW = w * 0.22;
      const sideY = y + headerH + g;
      const sideH = h - headerH - g;
      const cX = x + sideW + g;
      const cW = w - sideW - g;
      const cY = sideY;
      const cH = sideH;
      // Header bar
      c.strokeRect(x, y, w, headerH);
      // Logo divider in header
      c.moveTo(x + w * 0.15, y); c.lineTo(x + w * 0.15, y + headerH);
      // Sidebar
      c.strokeRect(x, sideY, sideW, sideH);
      // Sidebar logo/brand area
      c.moveTo(x, sideY + sideH * 0.12); c.lineTo(x + sideW, sideY + sideH * 0.12);
      // Sidebar nav dividers
      c.moveTo(x, sideY + sideH * 0.35); c.lineTo(x + sideW, sideY + sideH * 0.35);
      c.moveTo(x, sideY + sideH * 0.58); c.lineTo(x + sideW, sideY + sideH * 0.58);
      // Content area
      c.strokeRect(cX, cY, cW, cH);
      // Breadcrumb/sub-header line
      c.moveTo(cX, cY + cH * 0.05); c.lineTo(cX + cW, cY + cH * 0.05);
      break;
    }
    case "ui-three-panel": {
      const tpUnitW = (w - g * 2) / 4;
      const tpLeftW = tpUnitW;
      const tpCenterW = tpUnitW * 2;
      const tpRightW = tpUnitW;
      const tpLeftX = x;
      const tpCenterX = x + tpLeftW + g;
      const tpRightX = tpCenterX + tpCenterW + g;
      // Three panels
      c.strokeRect(tpLeftX, y, tpLeftW, h);
      c.strokeRect(tpCenterX, y, tpCenterW, h);
      c.strokeRect(tpRightX, y, tpRightW, h);
      // Left panel header + section divider
      c.moveTo(tpLeftX, y + h * 0.12); c.lineTo(tpLeftX + tpLeftW, y + h * 0.12);
      c.moveTo(tpLeftX, y + h * 0.45); c.lineTo(tpLeftX + tpLeftW, y + h * 0.45);
      // Center panel header + content zone split
      c.moveTo(tpCenterX, y + h * 0.12); c.lineTo(tpCenterX + tpCenterW, y + h * 0.12);
      c.moveTo(tpCenterX, y + h * 0.55); c.lineTo(tpCenterX + tpCenterW, y + h * 0.55);
      // Right panel header + section dividers
      c.moveTo(tpRightX, y + h * 0.12); c.lineTo(tpRightX + tpRightW, y + h * 0.12);
      c.moveTo(tpRightX, y + h * 0.4); c.lineTo(tpRightX + tpRightW, y + h * 0.4);
      c.moveTo(tpRightX, y + h * 0.65); c.lineTo(tpRightX + tpRightW, y + h * 0.65);
      break;
    }
    case "ui-dashboard": {
      const dHeaderH = h * 0.07;
      const dSideW = w * 0.22;
      const dSideY = y + dHeaderH + g;
      const dSideH = h - dHeaderH - g;
      const dContentX = x + dSideW + g;
      const dContentY = dSideY;
      const dContentW = w - dSideW - g;
      const dContentH = dSideH;
      const dCellW = (dContentW - g) / 2;
      const dCellH = (dContentH - g) / 2;
      // Header
      c.strokeRect(x, y, w, dHeaderH);
      // Logo divider in header
      c.moveTo(x + w * 0.15, y); c.lineTo(x + w * 0.15, y + dHeaderH);
      // Sidebar
      c.strokeRect(x, dSideY, dSideW, dSideH);
      // Sidebar nav dividers
      c.moveTo(x, dSideY + dSideH * 0.15); c.lineTo(x + dSideW, dSideY + dSideH * 0.15);
      c.moveTo(x, dSideY + dSideH * 0.4); c.lineTo(x + dSideW, dSideY + dSideH * 0.4);
      c.moveTo(x, dSideY + dSideH * 0.65); c.lineTo(x + dSideW, dSideY + dSideH * 0.65);
      // 2×2 content grid — top-left with X-cross (data viz)
      c.strokeRect(dContentX, dContentY, dCellW, dCellH);
      c.moveTo(dContentX, dContentY); c.lineTo(dContentX + dCellW, dContentY + dCellH);
      c.moveTo(dContentX + dCellW, dContentY); c.lineTo(dContentX, dContentY + dCellH);
      // Top-right
      c.strokeRect(dContentX + dCellW + g, dContentY, dCellW, dCellH);
      // Bottom-left
      c.strokeRect(dContentX, dContentY + dCellH + g, dCellW, dCellH);
      // Bottom-right
      c.strokeRect(dContentX + dCellW + g, dContentY + dCellH + g, dCellW, dCellH);
      break;
    }
    case "ui-canvas": {
      const canvLeftW = w * 0.28;
      const canvRightW = w - canvLeftW - g;
      const canvRightX = x + canvLeftW + g;
      // Left panel
      c.strokeRect(x, y, canvLeftW, h);
      // Left: layers section header
      c.moveTo(x, y + h * 0.08); c.lineTo(x + canvLeftW, y + h * 0.08);
      // Left: layers/properties split
      c.moveTo(x, y + h * 0.42); c.lineTo(x + canvLeftW, y + h * 0.42);
      // Left: properties section header
      c.moveTo(x, y + h * 0.5); c.lineTo(x + canvLeftW, y + h * 0.5);
      // Right canvas
      c.strokeRect(canvRightX, y, canvRightW, h);
      // Top toolbar
      c.moveTo(canvRightX, y + h * 0.06); c.lineTo(canvRightX + canvRightW, y + h * 0.06);
      // Bottom status bar
      c.moveTo(canvRightX, y + h * 0.95); c.lineTo(canvRightX + canvRightW, y + h * 0.95);
      break;
    }
    case "ui-chat-artifact": {
      const chatW = w * 0.38;
      const artW = w - chatW - g;
      const artX = x + chatW + g;
      // Chat panel
      c.strokeRect(x, y, chatW, h);
      // Chat header
      c.moveTo(x, y + h * 0.07); c.lineTo(x + chatW, y + h * 0.07);
      // Chat input area divider
      c.moveTo(x, y + h * 0.82); c.lineTo(x + chatW, y + h * 0.82);
      // Input field rect
      c.strokeRect(x + chatW * 0.08, y + h * 0.85, chatW * 0.84, h * 0.1);
      // Artifact panel
      c.strokeRect(artX, y, artW, h);
      // Artifact toolbar
      c.moveTo(artX, y + h * 0.06); c.lineTo(artX + artW, y + h * 0.06);
      break;
    }
    case "ui-agent-workflow": {
      const awHeaderH = h * 0.1;
      const awStatusH = h * 0.05;
      const awColY = y + awHeaderH + g;
      const awColH = h - awHeaderH - awStatusH - g * 2;
      const awColW = (w - g * 2) / 3;
      const awCol1X = x;
      const awCol2X = x + awColW + g;
      const awCol3X = x + awColW * 2 + g * 2;
      const awStatusY = y + h - awStatusH;
      // Header
      c.strokeRect(x, y, w, awHeaderH);
      // Three columns
      c.strokeRect(awCol1X, awColY, awColW, awColH);
      c.strokeRect(awCol2X, awColY, awColW, awColH);
      c.strokeRect(awCol3X, awColY, awColW, awColH);
      // Column headers
      c.moveTo(awCol1X, awColY + awColH * 0.1); c.lineTo(awCol1X + awColW, awColY + awColH * 0.1);
      c.moveTo(awCol2X, awColY + awColH * 0.1); c.lineTo(awCol2X + awColW, awColY + awColH * 0.1);
      c.moveTo(awCol3X, awColY + awColH * 0.1); c.lineTo(awCol3X + awColW, awColY + awColH * 0.1);
      // Bridge lines between columns
      const awBridgeY = awColY + awColH * 0.5;
      c.moveTo(awCol1X + awColW, awBridgeY); c.lineTo(awCol2X, awBridgeY);
      c.moveTo(awCol2X + awColW, awBridgeY); c.lineTo(awCol3X, awBridgeY);
      // Bottom status bar
      c.moveTo(x, awStatusY); c.lineTo(x + w, awStatusY);
      break;
    }
  }
  c.stroke();
}

// --- Canvas helper draw functions ---

function drawCols(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, n: number, g: number) {
  const cw = (w - g * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const colX = x + i * (cw + g);
    c.moveTo(colX, y); c.lineTo(colX, y + h);
    c.moveTo(colX + cw, y); c.lineTo(colX + cw, y + h);
  }
}

function drawRows(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, n: number, g: number) {
  const rh = (h - g * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const ry = y + i * (rh + g);
    c.moveTo(x, ry); c.lineTo(x + w, ry);
    c.moveTo(x, ry + rh); c.lineTo(x + w, ry + rh);
  }
}

function drawMod(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cols: number, rows: number, g: number) {
  const cw = (w - g * (cols - 1)) / cols;
  const rh = (h - g * (rows - 1)) / rows;
  for (let col = 0; col < cols; col++)
    for (let row = 0; row < rows; row++)
      c.rect(x + col * (cw + g), y + row * (rh + g), cw, rh);
}

function drawBase(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, sp: number) {
  for (let py = y; py <= y + h; py += sp) { c.moveTo(x, py); c.lineTo(x + w, py); }
}

function drawStd(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, sp: number) {
  for (let py = y; py <= y + h; py += sp) { c.moveTo(x, py); c.lineTo(x + w, py); }
  for (let px = x; px <= x + w; px += sp) { c.moveTo(px, y); c.lineTo(px, y + h); }
}

function drawIso(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, s: number) {
  // Equilateral triangle tessellation — clipped to working area
  // Stroke any prior path, then clip and draw independently
  c.stroke();
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.beginPath();
  const sp = 30 * s;
  const triH = (sp * Math.sqrt(3)) / 2;
  const numRows = Math.ceil(h / triH) + 1;
  const numCols = Math.ceil(w / sp) + 2;
  // Horizontal lines
  for (let r = 0; r <= numRows; r++) {
    const py = y + h - r * triH;
    c.moveTo(x, py); c.lineTo(x + w, py);
  }
  // Diagonal edges: V-shapes from each triangle apex
  for (let r = 0; r < numRows; r++) {
    const yBot = y + h - r * triH;
    const yTop = yBot - triH;
    const xOff = r % 2 === 0 ? sp / 2 : 0;
    for (let k = -1; k <= numCols; k++) {
      const ax = x + k * sp + xOff;
      c.moveTo(ax - sp / 2, yBot); c.lineTo(ax, yTop);
      c.moveTo(ax + sp / 2, yBot); c.lineTo(ax, yTop);
    }
  }
  c.stroke();
  c.restore();
  // Border stroke around the bounding box
  c.beginPath();
  c.rect(x, y, w, h);
}

function draw1P(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2, cy = y + h / 2;
  [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x + w / 2, y], [x + w, cy], [x + w / 2, y + h], [x, cy]].forEach((p) => {
    c.moveTo(cx, cy); c.lineTo(p[0], p[1]);
  });
  c.moveTo(x, cy); c.lineTo(x + w, cy);
}

function draw2P(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const hy = y + h * 0.4, lv = x - w * 0.1, rv = x + w * 1.1;
  c.moveTo(x, hy); c.lineTo(x + w, hy);
  for (let i = 0; i <= 4; i++) {
    c.moveTo(lv, hy); c.lineTo(x + w, y + (h * i) / 4);
    c.moveTo(rv, hy); c.lineTo(x, y + (h * i) / 4);
  }
}

function draw3P(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const hy = y + h * 0.3, lv = x - w * 0.1, rv = x + w * 1.1, bv = y + h * 1.3;
  c.moveTo(x, hy); c.lineTo(x + w, hy);
  for (let i = 0; i <= 3; i++) {
    c.moveTo(lv, hy); c.lineTo(x + w, y + (h * i) / 3);
    c.moveTo(rv, hy); c.lineTo(x, y + (h * i) / 3);
  }
  for (let i = 0; i <= 4; i++) {
    c.moveTo(x + (w * i) / 4, y); c.lineTo(x + w / 2, bv);
  }
}

function drawGoldenSpiral(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const p = 1.618;
  let sx = x, sy = y, sw = w, sh = h;
  for (let i = 0; i < 8; i++) {
    if (i % 4 === 0) {
      const nw = sw / p;
      c.moveTo(sx + nw, sy); c.lineTo(sx + nw, sy + sh);
      sx += nw; sw -= nw;
    } else if (i % 4 === 1) {
      const nh = sh / p;
      c.moveTo(sx, sy + sh - nh); c.lineTo(sx + sw, sy + sh - nh);
      sh -= nh;
    } else if (i % 4 === 2) {
      const nw = sw / p;
      c.moveTo(sx + sw - nw, sy); c.lineTo(sx + sw - nw, sy + sh);
      sw -= nw;
    } else {
      const nh = sh / p;
      c.moveTo(sx, sy + nh); c.lineTo(sx + sw, sy + nh);
      sy += nh; sh -= nh;
    }
  }
}

function drawCompound(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, n1: number, n2: number) {
  for (let i = 1; i < n1; i++) { c.moveTo(x + (w * i) / n1, y); c.lineTo(x + (w * i) / n1, y + h); }
  for (let i = 1; i < n2; i++) { c.moveTo(x + (w * i) / n2, y); c.lineTo(x + (w * i) / n2, y + h); }
  for (let i = 1; i < n1; i++) { c.moveTo(x, y + (h * i) / n1); c.lineTo(x + w, y + (h * i) / n1); }
  for (let i = 1; i < n2; i++) { c.moveTo(x, y + (h * i) / n2); c.lineTo(x + w, y + (h * i) / n2); }
  c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath();
}

function drawProgram(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  [2, 3, 4, 5, 6].forEach((d) => {
    for (let i = 1; i < d; i++) {
      c.moveTo(x + (w * i) / d, y); c.lineTo(x + (w * i) / d, y + h);
      c.moveTo(x, y + (h * i) / d); c.lineTo(x + w, y + (h * i) / d);
    }
  });
  c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath();
}

function drawSriYantra(c: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const s = r * 1.15;
  const upTris = [
    [[0, -0.92], [-0.82, 0.58], [0.82, 0.58]],
    [[0, -0.58], [-0.52, 0.32], [0.52, 0.32]],
    [[0, -0.32], [-0.32, 0.16], [0.32, 0.16]],
    [[0, -0.12], [-0.14, 0.06], [0.14, 0.06]],
  ];
  const downTris = [
    [[0, 0.92], [-0.72, -0.48], [0.72, -0.48]],
    [[0, 0.62], [-0.54, -0.32], [0.54, -0.32]],
    [[0, 0.42], [-0.38, -0.2], [0.38, -0.2]],
    [[0, 0.26], [-0.24, -0.1], [0.24, -0.1]],
    [[0, 0.12], [-0.1, -0.04], [0.1, -0.04]],
  ];
  [...upTris, ...downTris].forEach((tri) => {
    c.moveTo(cx + tri[0][0] * s, cy + tri[0][1] * s);
    tri.forEach((p) => c.lineTo(cx + p[0] * s, cy + p[1] * s));
    c.closePath();
  });
  c.moveTo(cx - s * 0.82, cy + s * 0.58); c.lineTo(cx + s * 0.82, cy + s * 0.58);
  c.moveTo(cx - s * 0.72, cy - s * 0.48); c.lineTo(cx + s * 0.72, cy - s * 0.48);
}

function drawMetatron(c: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const pts: number[][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 2;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  const inner: number[][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 2;
    inner.push([cx + r * 0.5 * Math.cos(a), cy + r * 0.5 * Math.sin(a)]);
  }
  pts.push([cx, cy]);
  inner.forEach((p) => pts.push(p));
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      c.moveTo(pts[i][0], pts[i][1]);
      c.lineTo(pts[j][0], pts[j][1]);
    }
  }
  [...pts.slice(0, 6), ...inner].forEach((p) => {
    c.moveTo(p[0] + r * 0.25, p[1]);
    c.arc(p[0], p[1], r * 0.25, 0, Math.PI * 2);
  });
  c.moveTo(cx + r * 0.25, cy);
  c.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
}
