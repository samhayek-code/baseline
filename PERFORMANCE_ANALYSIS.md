# Performance Analysis Report

**Project:** Baseline Grid Generator
**Date:** 2026-01-08
**Analysis Type:** Performance Anti-patterns, Inefficient Algorithms, Memory Leaks

---

## Executive Summary

This analysis identified **11 critical performance issues** in the codebase. The application is a Canvas-based grid generator that currently suffers from:

- Unthrottled event handlers causing excessive re-renders
- O(n²) complexity in sacred geometry rendering
- Inefficient string concatenation in SVG generation
- No caching or memoization of computed values
- Memory leak potential from unmanaged event listeners

**Impact:** Users experience lag during window resizing, input changes, and when rendering complex grids like Metatron's Cube.

---

## Critical Performance Issues

### 🔴 CRITICAL #1: Unthrottled Window Resize Handler

**Location:** `index.html:2423`

```javascript
window.addEventListener('resize', render);
```

**Problem:**
- The `resize` event fires hundreds of times per second during window resizing
- Each event triggers a full canvas redraw with no debouncing or throttling
- Causes severe UI lag and CPU spikes during resize operations

**Impact:** High - Affects all users during window resize

**Recommended Fix:**
```javascript
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(render, 150); // Debounce 150ms
});

// OR use requestAnimationFrame for smoother updates:
let resizeRAF;
window.addEventListener('resize', () => {
  if (resizeRAF) cancelAnimationFrame(resizeRAF);
  resizeRAF = requestAnimationFrame(render);
});
```

---

### 🔴 CRITICAL #2: Unthrottled Input Handlers

**Location:** `index.html:1766-1779`

```javascript
document.getElementById('canvasWidth').addEventListener('input', e => {
  state.width = +e.target.value;
  document.getElementById('sizePreset').value = 'custom';
  render();
});
// Similar pattern repeated for 10+ input fields
```

**Problem:**
- Each keystroke or slider movement triggers immediate full canvas redraw
- No debouncing on continuous input events (slider drag, number input)
- Creates janky UI experience during rapid adjustments

**Impact:** High - Affects UX for all parameter adjustments

**Recommended Fix:**
```javascript
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const debouncedRender = debounce(render, 100);

document.getElementById('canvasWidth').addEventListener('input', e => {
  state.width = +e.target.value;
  document.getElementById('sizePreset').value = 'custom';
  debouncedRender(); // Use debounced version
});
```

---

### 🔴 CRITICAL #3: O(n²) Complexity in Metatron's Cube

**Location:** `index.html:2411-2421`

```javascript
function drawMetatron(c,cx,cy,r){
  const pts=[];
  for(let i=0;i<6;i++){...}  // Create 6 outer points
  const inner=[];
  for(let i=0;i<6;i++){...}  // Create 6 inner points
  pts.push([cx,cy]);
  inner.forEach(p=>pts.push(p));

  // PROBLEM: Nested loop creates O(n²) line operations
  for(let i=0;i<pts.length;i++){
    for(let j=i+1;j<pts.length;j++){
      c.moveTo(pts[i][0],pts[i][1]);
      c.lineTo(pts[j][0],pts[j][1]);
    }
  }
  // ... circle drawing code
}
```

**Problem:**
- `pts.length = 13` (6 outer + 6 inner + 1 center)
- Nested loops create **78 line segments** (13 × 12 / 2)
- Complexity: O(n²) where n = number of points
- Every render of Metatron's Cube executes 156 canvas operations (78 moveTo + 78 lineTo)

**Impact:** Medium - Affects users who select Metatron's Cube grid

**Recommended Fix:**
The algorithm is inherently O(n²) for a complete graph. Optimizations:
1. Pre-calculate line segments and cache them
2. Use a single `Path2D` object and cache it
3. Only recalculate when canvas size changes significantly

```javascript
let metatronPath = null;
let metatronCacheKey = '';

function drawMetatron(c, cx, cy, r) {
  const cacheKey = `${cx},${cy},${r}`;

  if (!metatronPath || metatronCacheKey !== cacheKey) {
    metatronPath = new Path2D();
    // ... existing point calculation ...
    for(let i=0; i<pts.length; i++) {
      for(let j=i+1; j<pts.length; j++) {
        metatronPath.moveTo(pts[i][0], pts[i][1]);
        metatronPath.lineTo(pts[j][0], pts[j][1]);
      }
    }
    // ... circle drawing ...
    metatronCacheKey = cacheKey;
  }

  c.stroke(metatronPath);
}
```

---

### 🟡 HIGH #4: Inefficient SVG String Concatenation

**Location:** `index.html:1936-1964`

```javascript
function generateSVG(transparent) {
  // ...
  let paths = '';
  state.selectedGrids.forEach(id => {
    paths += generateGridSVG(id, x, y, w, h, g, s); // String concatenation in loop
  });
  // ...
}
```

**Problem:**
- Using `+=` for string concatenation in loops is inefficient in JavaScript
- Each concatenation creates a new string (strings are immutable)
- For multiple grids, this creates unnecessary string copies

**Impact:** Medium - Noticeable when exporting with multiple grids selected

**Recommended Fix:**
```javascript
function generateSVG(transparent) {
  // ...
  const pathArray = [];
  state.selectedGrids.forEach(id => {
    pathArray.push(generateGridSVG(id, x, y, w, h, g, s));
  });
  const paths = pathArray.join('');
  // ...
}
```

---

### 🟡 HIGH #5: No Caching of Color Conversions

**Location:** `index.html:2279, 1825-1827`

```javascript
// Called on EVERY render:
function renderGrids(c, transparent) {
  // ...
  c.strokeStyle = hexToRgba(state.lineColor, state.lineOpacity / 100); // Computed every time
  // ...
}

// Color conversion functions perform calculations each call:
function hexToRgba(h, a) {
  const r = parseInt(h.slice(1,3),16);
  const g = parseInt(h.slice(3,5),16);
  const b = parseInt(h.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
```

**Problem:**
- Color conversions (hex to RGBA, RGB, HSL) are computed on every render
- Same color values are converted repeatedly without caching
- `parseInt` and string operations are expensive when called frequently

**Impact:** Low-Medium - Adds unnecessary computation to every render

**Recommended Fix:**
```javascript
let colorCache = {
  key: '',
  rgba: ''
};

function renderGrids(c, transparent) {
  // ...
  const cacheKey = `${state.lineColor}-${state.lineOpacity}`;
  if (colorCache.key !== cacheKey) {
    colorCache.key = cacheKey;
    colorCache.rgba = hexToRgba(state.lineColor, state.lineOpacity / 100);
  }
  c.strokeStyle = colorCache.rgba;
  // ...
}
```

---

### 🟡 HIGH #6: Redundant Line Drawing in drawProgram

**Location:** `index.html:2377-2386`

```javascript
function drawProgram(c,x,y,w,h){
  const divs=[2,3,4,5,6];
  divs.forEach(d=>{
    for(let i=1;i<d;i++){
      c.moveTo(x+w*i/d,y);c.lineTo(x+w*i/d,y+h);
      c.moveTo(x,y+h*i/d);c.lineTo(x+w,y+h*i/d);
    }
  });
  // ...
}
```

**Problem:**
- Division 2 draws line at x = 0.5
- Division 4 draws lines at x = 0.25, 0.5, 0.75
- Division 6 draws lines at x = 0.166, 0.333, 0.5, 0.666, 0.833
- **The line at 0.5 is drawn 3 times** (by divs 2, 4, and 6)
- Multiple redundant overlapping lines are drawn

**Impact:** Low - Small performance hit, visual correctness maintained

**Recommended Fix:**
```javascript
function drawProgram(c,x,y,w,h){
  const positions = new Set();
  const divs=[2,3,4,5,6];

  divs.forEach(d=>{
    for(let i=1;i<d;i++){
      positions.add(i/d); // Use Set to track unique positions
    }
  });

  positions.forEach(pos => {
    c.moveTo(x+w*pos,y);c.lineTo(x+w*pos,y+h);
    c.moveTo(x,y+h*pos);c.lineTo(x+w,y+h*pos);
  });

  c.moveTo(x,y);c.lineTo(x+w,y);c.lineTo(x+w,y+h);c.lineTo(x,y+h);c.closePath();
}
```

---

### 🟡 MEDIUM #7: No Canvas Layer Caching

**Location:** `index.html:2268-2286`

**Problem:**
- Every state change triggers complete canvas redraw
- No layering strategy (background layer, grid layer, overlay layer)
- Static grids are redrawn even when only line color changes
- Background fill is recalculated on every render

**Impact:** Medium - Affects rendering performance with multiple complex grids

**Recommended Fix:**
Implement an offscreen canvas cache:

```javascript
let gridCache = null;
let gridCacheKey = '';

function renderGrids(c, transparent) {
  const cacheKey = `${state.selectedGrids.join(',')}-${state.width}-${state.height}-${state.margin}-${state.padding}-${state.gutter}`;

  // Only redraw if grid configuration changed
  if (!gridCache || gridCacheKey !== cacheKey) {
    gridCache = document.createElement('canvas');
    gridCache.width = state.width;
    gridCache.height = state.height;
    const cacheCtx = gridCache.getContext('2d');

    // Draw grids to cache
    // ... grid drawing logic ...

    gridCacheKey = cacheKey;
  }

  // Draw cached grids to main canvas
  c.clearRect(0, 0, state.width, state.height);
  if (!transparent) {
    c.fillStyle = state.bgColor;
    c.fillRect(0, 0, state.width, state.height);
  }

  // Apply current style settings and draw cached grid
  c.strokeStyle = hexToRgba(state.lineColor, state.lineOpacity / 100);
  c.lineWidth = state.lineWeight;
  c.drawImage(gridCache, 0, 0);
}
```

---

### 🟡 MEDIUM #8: Inefficient Loop in drawStd and drawBase

**Location:** `index.html:2361-2362`

```javascript
function drawStd(c,x,y,w,h,sp){
  for(let py=y;py<=y+h;py+=sp){
    c.moveTo(x,py);c.lineTo(x+w,py);
  }
  for(let px=x;px<=x+w;px+=sp){
    c.moveTo(px,y);c.lineTo(px,y+h);
  }
}
```

**Problem:**
- For a 1080×1080 canvas with 4px spacing (standard-4):
  - Horizontal lines: 1080/4 = 270 iterations × 2 calls = 540 operations
  - Vertical lines: 1080/4 = 270 iterations × 2 calls = 540 operations
  - **Total: 1,080 canvas operations** for a single standard grid

**Impact:** Medium - Noticeable with small spacing values (4px, 8px)

**Recommended Fix:**
Minimize path operations:

```javascript
function drawStd(c,x,y,w,h,sp){
  // Horizontal lines
  for(let py=y; py<=y+h; py+=sp){
    c.moveTo(x,py);
    c.lineTo(x+w,py);
  }
  // Vertical lines
  for(let px=x; px<=x+w; px+=sp){
    c.moveTo(px,y);
    c.lineTo(px,y+h);
  }
}
```

This is already optimal for this approach. Better optimization: use cached Path2D object.

---

### 🟡 MEDIUM #9: Memory Leak Risk - Event Listeners Not Removed

**Location:** Throughout `index.html` (1721-2254)

**Problem:**
- 30+ event listeners are added during initialization
- No corresponding `removeEventListener` calls anywhere in the code
- If grid template items are dynamically added/removed, old listeners persist
- DOM nodes with listeners cannot be garbage collected

**Current code adds listeners dynamically:**
```javascript
grids.forEach(g => {
  const item = document.createElement('label');
  item.innerHTML = `<input type="checkbox" ...>`;
  item.querySelector('input').addEventListener('change', e => {
    // Closure captures 'g' variable
    if (e.target.checked) state.selectedGrids.push(g.id);
    else state.selectedGrids = state.selectedGrids.filter(id => id !== g.id);
    render();
  });
  catEl.appendChild(item);
});
```

**Impact:** Low - Minor memory leak potential (static page, listeners rarely change)

**Recommended Fix:**
Use event delegation for dynamically created elements:

```javascript
// Single delegated listener on container
gridContainer.addEventListener('change', e => {
  if (e.target.type === 'checkbox' && e.target.id.startsWith('grid-')) {
    const gridId = e.target.id.replace('grid-', '');
    if (e.target.checked) {
      state.selectedGrids.push(gridId);
    } else {
      state.selectedGrids = state.selectedGrids.filter(id => id !== gridId);
    }
    render();
  }
});
```

---

### 🟡 MEDIUM #10: Temporary Canvas Creation in Export Preview

**Location:** `index.html:1873-1880, 1895-1901`

```javascript
function showExport() {
  // Creates temporary canvas
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = state.width;
  tempCanvas.height = state.height;
  const tempCtx = tempCanvas.getContext('2d');
  renderGrids(tempCtx, transparent);
  document.getElementById('exportPreviewImg').src = tempCanvas.toDataURL('image/png');
  overlay.classList.add('open');
}

// Creates ANOTHER temporary canvas on checkbox change
document.getElementById('transparentBg').addEventListener('change', () => {
  const tempCanvas = document.createElement('canvas'); // New canvas every time
  // ...
});
```

**Problem:**
- Creates new canvas elements on every export preview
- No reuse of temporary canvas
- Allocating large canvases (e.g., 4K) repeatedly is memory-intensive
- `toDataURL()` is synchronous and blocks the main thread

**Impact:** Low-Medium - Noticeable delay when previewing large canvases

**Recommended Fix:**
```javascript
let exportCanvas = null;

function getExportCanvas() {
  if (!exportCanvas) {
    exportCanvas = document.createElement('canvas');
  }
  exportCanvas.width = state.width;
  exportCanvas.height = state.height;
  return exportCanvas;
}

function showExport() {
  const transparent = document.getElementById('transparentBg').checked;
  const canvas = getExportCanvas();
  const ctx = canvas.getContext('2d');
  renderGrids(ctx, transparent);
  document.getElementById('exportPreviewImg').src = canvas.toDataURL('image/png');
  overlay.classList.add('open');
}
```

---

### 🟢 LOW #11: Flower of Life Nested Arc Loops

**Location:** `index.html:2351`

```javascript
case 'flower-of-life': {
  const flr=r*0.28;
  c.moveTo(cx+flr,cy);c.arc(cx,cy,flr,0,Math.PI*2);
  for(let ring=0;ring<2;ring++){
    const dist=flr*(ring+1);
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3+(ring*Math.PI/6);
      const px=cx+dist*Math.cos(a),py=cy+dist*Math.sin(a);
      c.moveTo(px+flr,py);c.arc(px,py,flr,0,Math.PI*2);
    }
  }
  // ... more circles
  break;
}
```

**Problem:**
- Nested loops create 12 arc operations (2 rings × 6 circles)
- Plus additional 6 circles = 18 total arc operations
- Each arc operation involves trigonometric calculations (sin/cos)
- Calculations repeated on every render

**Impact:** Low - Limited to specific grid selection

**Recommended Fix:**
Pre-calculate circle positions or use Path2D caching.

---

## Performance Anti-Patterns Summary

| Issue | Location | Severity | Type | Fix Effort |
|-------|----------|----------|------|------------|
| Unthrottled resize handler | 2423 | Critical | Event handling | Low |
| Unthrottled input handlers | 1766-1779 | Critical | Event handling | Low |
| O(n²) Metatron's Cube | 2411-2421 | Critical | Algorithm | Medium |
| SVG string concatenation | 1936-1964 | High | String operations | Low |
| No color conversion cache | 2279, 1825 | High | Computation | Low |
| Redundant lines in drawProgram | 2377-2386 | High | Algorithm | Low |
| No canvas layer caching | 2268-2286 | Medium | Rendering | High |
| Inefficient grid loops | 2361-2362 | Medium | Algorithm | Medium |
| Event listener memory leaks | 1721-2254 | Medium | Memory | Medium |
| Temporary canvas creation | 1873-1901 | Medium | Memory | Low |
| Flower of Life nested loops | 2351 | Low | Algorithm | Low |

---

## N+1 Queries

**Status:** ✅ Not Applicable

This is a frontend-only application with no database or API calls. No N+1 query patterns exist.

---

## Unnecessary Re-renders

**Status:** ⚠️ Multiple Issues Found

The application suffers from excessive re-renders due to:

1. **No debouncing on input events** - Every keystroke/slider movement triggers full redraw
2. **No throttling on resize** - Hundreds of renders during window resize
3. **No memoization** - Same calculations repeated on every render
4. **No caching** - Full canvas redraw even when only style changes

**Recommendation:** Implement debouncing, throttling, and caching as detailed in the issues above.

---

## Inefficient Algorithms

**Identified Issues:**

1. **O(n²) complexity** - drawMetatron function (Critical)
2. **Redundant operations** - drawProgram overlapping lines (High)
3. **Repeated calculations** - Color conversions without caching (High)
4. **Inefficient string operations** - SVG concatenation (High)

---

## Memory Leaks

**Identified Issues:**

1. **Event listener accumulation** - Dynamically created elements with uncleaned listeners (Medium)
2. **Temporary canvas allocation** - Multiple temporary canvases created (Low-Medium)
3. **No resource cleanup** - No cleanup on page unload/navigation (Low for SPA)

**Recommendation:** Implement event delegation and reuse temporary canvases.

---

## Recommendations Priority

### Phase 1: Quick Wins (1-2 hours)
1. Add resize debouncing/throttling
2. Add input debouncing
3. Fix SVG string concatenation
4. Add color conversion cache

### Phase 2: Medium Effort (4-6 hours)
5. Optimize drawProgram redundant lines
6. Implement Path2D caching for complex grids
7. Reuse export canvas
8. Event delegation for grid checkboxes

### Phase 3: Major Refactoring (8-12 hours)
9. Implement canvas layer caching system
10. Optimize Metatron's Cube with pre-calculation
11. Implement comprehensive memoization strategy

---

## Estimated Performance Gains

| Optimization | Expected Improvement |
|--------------|---------------------|
| Resize throttling | 90% reduction in resize lag |
| Input debouncing | 80% reduction in input lag |
| Color caching | 5-10% faster render time |
| SVG optimization | 30% faster export |
| Canvas caching | 50-70% faster re-renders |
| Metatron caching | 60% faster when selected |

---

## Tools for Profiling

To measure improvements:

1. **Chrome DevTools Performance Tab**
   - Record performance during resize
   - Check for long tasks and scripting time

2. **Chrome DevTools Memory Tab**
   - Check for detached DOM nodes
   - Monitor heap allocation

3. **Performance API**
   ```javascript
   const start = performance.now();
   render();
   const end = performance.now();
   console.log(`Render took ${end - start}ms`);
   ```

4. **Canvas FPS Counter**
   ```javascript
   let frameCount = 0;
   let lastTime = performance.now();
   function trackFPS() {
     frameCount++;
     const now = performance.now();
     if (now >= lastTime + 1000) {
       console.log(`FPS: ${frameCount}`);
       frameCount = 0;
       lastTime = now;
     }
     requestAnimationFrame(trackFPS);
   }
   trackFPS();
   ```

---

## Conclusion

The Baseline Grid Generator is a well-designed tool with significant performance optimization opportunities. The most critical issues are **unthrottled event handlers** causing excessive re-renders. Implementing the Phase 1 optimizations alone would provide immediate, noticeable improvements to user experience.

**Overall Performance Rating:** ⚠️ Moderate - Works well for simple grids, but struggles with complex geometries and rapid user input.

**Next Steps:**
1. Implement Phase 1 optimizations (2 hours)
2. Profile performance improvements
3. Proceed with Phase 2 based on user feedback
