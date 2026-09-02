# SVG Graphic Generator — Project Context

## What this is

A Svelte + Vite proof-of-concept for sign/graphic generation. The user edits text in a sidebar, sees it live in an SVG canvas, and can export as outlined SVG or vector PDF.

## Stack

- **Svelte 5** (Vite scaffold) — `src/App.svelte` is the single main component
- **jsPDF** + **svg2pdf.js** — vector PDF export (no rasterisation)
- **opentype.js** — font loading, glyph metrics, text-to-path outlining

## Key files

| File | Purpose |
|---|---|
| `src/App.svelte` | Main component: SVG canvas, controls, export buttons |
| `src/lib/typeset.js` | Fixed-box typesetter — balanced line-breaking (min-raggedness DP) + binary-search font sizing |
| `src/lib/outlineText.js` | Export helper — replaces `<text>` nodes with outlined `<path>` nodes on a clone |
| `public/fonts/` | Font files served statically; `EmpiricaNYCMayor-Black.otf` is the primary display font |
| `src/app.css` | `@font-face` declarations for all fonts in `public/fonts/` |

## SVG geometry

The canvas is `3024 × 537` SVG user units. The editable text lives in the left white trapezoid:

- **Text box origin**: `translate(366.9, 34)` (top-left of available area)
- **Text box width**: `~1046` units (366.9 → 1413)
- **Text box height**: `~211` units (y=34 → y=245, above the blue band)
- **Max font size**: 141px; **min**: 18px

Constants are defined at the top of the `<script>` block in `App.svelte`:
`TEXT_BOX_X`, `TEXT_BOX_TOP_Y`, `TEXT_BOX_BOTTOM_Y`, `TEXT_BOX_WIDTH`, `TEXT_BOX_HEIGHT`, `MAX_FONT_SIZE`, `MIN_FONT_SIZE`.

## Typesetting approach

`src/lib/typeset.js` implements:

1. **Exact glyph metrics** via `opentype.js` — no canvas, no DOM
2. **Binary-search font sizing** — 40 iterations, sub-0.5px precision
3. **Balanced line-breaking** — minimum-raggedness DP (O(n²) over words). Cost per line = `(leftover / boxWidth)²`. Last line excluded (ragged-right). Same principle as TeX badness minimisation.
4. **Real font ascender** — `fontAscender()` reads `sTypoAscender` from OS/2 table (or hhea fallback) for accurate vertical centring
5. **Line height** always proportional: `fontSize × 1.2` (`LINE_HEIGHT_RATIO`)

## Text-to-path export

`src/lib/outlineText.js`:

- Reads styles from the **live** DOM element (`getComputedStyle`) before cloning
- Parses SVG `<style>` class rules as fallback for class-based font declarations
- **Presentation attribute `font-size` takes priority** over CSS class rules (important — the typesetter sets size as an attribute to override `.st4`)
- Replaces `<text>` + `<tspan>` with `<path d="...">` using `font.getPath()`
- Font cache keyed by URL; loaded once per session via `fetch` + `opentype.parse()`

## Font map

```js
const FONT_MAP = {
  'Empirica NYCMayor':      '/fonts/EmpiricaNYCMayor-Black.otf',
  'EmpiricaNYCMayor-Black': '/fonts/EmpiricaNYCMayor-Black.otf',
};
```

Add entries here when adding more fonts. The key is matched case-insensitively against the CSS `font-family` value (with quotes and backslashes stripped).

## Dev server

```
npm run dev   # http://localhost:5173
```

## Known constraints / gotchas

- The SVG `<style>` block uses class `.st4` for the display font. The typesetter overrides `font-size` via a presentation attribute — CSS specificity means the attribute alone doesn't win in the browser, but `outlineText.js` checks the attribute first for export accuracy.
- `window.getComputedStyle` on a detached clone returns no useful styles — always call it on the **live** element before cloning.
- `opentype.load()` is deprecated; use `fetch()` + `opentype.parse(buffer)`.
- PDF dimensions are set to match the SVG viewBox exactly (`3024 × 537 pt` landscape).
