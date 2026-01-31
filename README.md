# Baseline

Grid generator for designers and developers.

**Live:** https://baseline-beta.vercel.app

## v4.1

### New: User Accounts & Grid Management
- **Sign in** with GitHub or Google (via Supabase Auth)
- **Save grids** to your account with custom names
- **Grid library** — browse, rename, delete, and reload saved grids
- **Batch download** — select multiple grids and download as a ZIP (PNG or SVG)
- **Shareable links** — load any saved grid via URL (`/editor?load=<id>`)

### Editor Upgrades
- Migrated from single HTML file to **Next.js 14** (App Router)
- **Unified floating toolbar** — transform tools, layers, zoom, support, and theme toggle in one Figma-style bottom bar
- **Glass UI** — frosted glass toolbar and save button with backdrop blur
- **Remix Icons** throughout the app for visual consistency
- **Light/dark theme** toggle
- Save (S) and Export (E) keyboard shortcuts
- Improved zoom performance (rAF throttling)

### Previous (v3.0)
- 74 grid types across 14 collapsible categories
- 2-layer system with independent settings and opacity
- Spacing sliders with number inputs (margin, padding, gutter)
- Lock controls to preserve values during randomize
- Canvas size presets with custom dropdown
- Randomize with weighted distribution
- PNG and SVG export with transparent background option
- Mobile responsive layout with bottom drawer

## Tech Stack

- **Next.js 14** — App Router, server components
- **Supabase** — Auth (OAuth), PostgreSQL, Row Level Security
- **Remix Icon** — icon system
- **JSZip** — batch download
- **Vanilla Canvas API** — grid rendering engine (1700+ lines)

## Local Development

```bash
npm install
cp .env.local.example .env.local
# Add your Supabase URL and anon key to .env.local
npm run dev
```
