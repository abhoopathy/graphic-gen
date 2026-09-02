<script>
  import { jsPDF } from 'jspdf';
  import { svg2pdf } from 'svg2pdf.js';
  import { outlineTextNodes } from './lib/outlineText.js';
  import { loadFontForTypeset, typeset, fontAscender } from './lib/typeset.js';

  // ── Font map ──────────────────────────────────────────────────────────────
  const FONT_URL = '/fonts/EmpiricaNYCMayor-Black.otf';
  const FONT_MAP = {
    'Empirica NYCMayor':    FONT_URL,
    'EmpiricaNYCMayor-Black': FONT_URL,
  };

  // ── Text box geometry (SVG user units) ───────────────────────────────────
  // The text lives in the left white trapezoid.
  // translate(366.9 195.5) is the anchor; the box spans right to x≈1413.
  // Vertically the sign face runs from y≈34 to y≈245 (above the blue band).
  const TEXT_BOX_X      = 366.9;   // left edge / x origin
  const TEXT_BOX_TOP_Y  = 34;      // top of available area in SVG coords
  const TEXT_BOX_BOTTOM_Y = 245;   // bottom of available area (above blue band)
  const TEXT_BOX_WIDTH  = 1200 - TEXT_BOX_X;  // ≈ 1046 units
  const TEXT_BOX_HEIGHT = TEXT_BOX_BOTTOM_Y - TEXT_BOX_TOP_Y; // ≈ 211 units
  const MAX_FONT_SIZE   = 141;
  const MIN_FONT_SIZE   = 18;

  // ── State ─────────────────────────────────────────────────────────────────
  let svgRef;
  let title = 'Fix the City';

  // Typeset layout — updated reactively whenever title or font changes
  // { lines: string[], fontSize: number, lineHeight: number }
  let layout = { lines: [title], fontSize: MAX_FONT_SIZE, lineHeight: MAX_FONT_SIZE * 1.2 };
  let font = null;

  // Load font once, then re-typeset
  loadFontForTypeset(FONT_URL).then(f => {
    font = f;
    layout = computeLayout(title, f);
  });

  // Reactive: recompute whenever title changes (after font loaded)
  $: if (font) layout = computeLayout(title, font);

  function computeLayout(text, f) {
    return typeset(f, text, TEXT_BOX_WIDTH, TEXT_BOX_HEIGHT, MAX_FONT_SIZE, MIN_FONT_SIZE);
  }

  // Compute tspan y positions — vertically centred within the text box.
  // All metrics derived from the actual font at the resolved fontSize.
  $: tspanLines = (() => {
    const { lines, fontSize, lineHeight } = layout;
    const blockHeight = lines.length * lineHeight;
    const ascender = font ? fontAscender(font, fontSize) : fontSize * 0.8;
    // Centre the block; first baseline = box top + vertical offset + ascender
    const blockTop = TEXT_BOX_TOP_Y + (TEXT_BOX_HEIGHT - blockHeight) / 2 + ascender;
    return lines.map((text, i) => ({
      text,
      x: 0,
      y: blockTop - TEXT_BOX_TOP_Y + i * lineHeight, // relative to translate()
    }));
  })();

  // ── Export helpers ────────────────────────────────────────────────────────
  function getSvgString() {
    return new XMLSerializer().serializeToString(svgRef);
  }

  async function downloadSVG() {
    const outlined = await outlineTextNodes(svgRef, FONT_MAP);
    const svgString = new XMLSerializer().serializeToString(outlined);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graphic.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function downloadPDF() {
    const svgWidth = 3024;
    const svgHeight = 537;
    const outlined = await outlineTextNodes(svgRef, FONT_MAP);
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [svgWidth, svgHeight],
    });
    await svg2pdf(outlined, pdf, { x: 0, y: 0, width: svgWidth, height: svgHeight });
    pdf.save('graphic.pdf');
  }
</script>

<main>
  <header>
    <h1>SVG Graphic Editor</h1>
    <p>Edit the text below, then download as SVG or PDF.</p>
  </header>

  <div class="workspace">
    <!-- Controls -->
    <aside class="controls">
      <section>
        <h2>Text</h2>
        <label>
          Sign text
          <input type="text" bind:value={title} />
        </label>
        {#if font}
          <div class="layout-info">
            {layout.lines.length} line{layout.lines.length !== 1 ? 's' : ''}
            · {Math.round(layout.fontSize)}px
          </div>
        {/if}
      </section>

      <section class="download-section">
        <h2>Export</h2>
        <button class="btn btn-svg" on:click={downloadSVG}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 11L4 7h3V2h2v5h3L8 11z" fill="currentColor"/>
            <rect x="2" y="13" width="12" height="1.5" rx=".75" fill="currentColor"/>
          </svg>
          Download SVG
        </button>
        <button class="btn btn-pdf" on:click={downloadPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 11L4 7h3V2h2v5h3L8 11z" fill="currentColor"/>
            <rect x="2" y="13" width="12" height="1.5" rx=".75" fill="currentColor"/>
          </svg>
          Download PDF
        </button>
      </section>
    </aside>

    <!-- SVG Preview -->
    <div class="preview">
     <svg
        bind:this={svgRef}
  id="Layer_1" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 3024 537">
  <!-- Generator: Adobe Illustrator 30.7.0, SVG Export Plug-In . SVG Version: 2.1.4 Build 114)  -->
  <defs>
    <style>
      .st0, .st1 {
        fill: none;
      }

      .st2 {
        fill: #fb340c;
      }

      .st1 {
        stroke: #4f6ecf;
        stroke-width: 3px;
      }

      .st3, .st4 {
        fill: #fff;
      }

      .st5 {
        fill: #1601ae;
      }

      .st4 {
        font-family: 'Empirica NYCMayor', EmpiricaNYCMayor-Black;
        font-size: 141px;
        font-weight: 800;
        letter-spacing: 0em;
      }
    </style>
  </defs>
  <rect class="st0" width="3024" height="537"/>
  <rect class="st3" width="3024" height="537"/>
  <rect class="st0" width="3024" height="537"/>
  <path class="st5" d="M1471.7,537h1404v-126.3h-1404v126.3Z"/>
  <path class="st5" d="M2912,465h-1476l36.3-144h1403.2l36.5,144Z"/>
  <path class="st2" d="M1687.6,343c.2,1.9.2,3.6.2,5.2,0,7.5-2.3,12.2-11,16.1,3.7,0,16.3-2.5,27.1,9.2,4.9,5.4,7,12.5,7,20,0,14.1-8.1,29.8-17.9,39.6-3.1,3.1-8.5,4.4-12.4,4.4s-6.5-4.6-13.4-4.6-6.8,4.6-12.1,4.6-9.2-1.3-12.4-4.4c-9.7-9.7-17.8-25.4-17.8-39.5s1.9-14.1,6.6-19.5c9.8-11.4,17.2-10.7,28.3-9.6h0s-6.2-14.4-6.2-14.4c.9-2.5,5.2-4.4,5.2-4.4,0,0,3.7,12.6,6.2,19.3.2,0,.4,0,.6,0,2.7-15.3,9.4-16.3,21.8-22.2Z"/>
  <path class="st3" d="M2258.5,366c4.8,0,6.4,3,6.4,5.5,0,6.5-7,16-12.3,21.9-1.7,2.8-5.1,9.6-8.6,17.1,5.6-.6,10.6-4.4,16.8-11.7,2,1.1,2.8,2.5,2.8,4.2-.2,3.6-9.2,14.8-14.9,14.8v.6c.6,8.7-5.3,21.1-11.8,21.1s-5-4-5-6.2c-1.4-1.1-2.2-2.5-2.2-3.9.6-4.2,3.4-11.2,6.4-19.1-2.5,2.5-4.8,3.9-7.3,3.9-.8,0-1.4-.2-2.5-.8-3.1,4-6.7,6.8-10.1,6.8s-5.3-2-5.6-4.5c-2.8-.8-4.8-3.3-4.8-7.5,0-11.5,10.9-25.8,19.9-25.8s4.5,1.1,4.8,3.4c2.8,1.2,4.2,4,4.2,7.3s-1.4,9-4.2,14c3.9-3,9.5-8.6,14-14.5,4.8-10.4,10.1-20.5,14-26.3ZM2242.8,413.1c-3.4,7.3-6.4,14.3-7.8,18.8,4.8-2.9,10.1-11.8,7.6-17.9l.2-.8ZM1900.3,366.3c20,0,31.9,13.8,31.9,31s-13.6,31-32.1,31-32-13.8-32-31,13.6-31,32.2-31ZM2623.3,366.3c20.1,0,31.9,13.8,31.9,31,0,17.8-13.6,31-32.1,31-20,0-32-13.8-32-31s13.6-31,32.2-31ZM2101.6,366.5c8.4,0,14.6,1.8,20.8,4.9-.4,4.5-.8,12.7-.5,17.5h-.9c-5.3-6.8-10.9-10.7-18.3-10.7s-16.9,7.2-16.9,18.8,6.8,19.4,17.2,19.4,14.1-4.2,18.8-12.1h1c-.3,5-.4,13.7,0,18-6.3,3.6-13.7,5.8-22.2,5.8-17.1,0-30.8-11-30.8-29.8s15.2-31.8,31.9-31.8ZM2687.4,367.7c17.1,0,25.9,6.8,25.9,17.4s-5.9,14.5-14.4,16.7c5.1,1.5,7.4,5.5,9.6,9.7,2.6,4.3,5.4,8.5,10.5,6.3l.8.8c-1.4,5.4-5.9,9.2-12.5,9.2s-11.4-2.3-13.4-14c-1.4-7.7-4.3-8.9-10.8-8.9h-2.5c0,15.1.8,16.5,6.2,20.6v1.4c-4.3-.2-8.7-.2-13.1-.2s-8.7,0-13.2.2v-1.2c4.7-3.8,5.8-4.5,5.8-18.8v-14.7c0-18.5-.8-19.7-5.8-23.3v-1.3l11.7.3,15.1-.3ZM2440.9,367.5c2.9.4,6.2.4,12.2.4s8.2,0,13.3-.2v1c-5.7,3.4-6.5,5-6.4,20.6v15.9c0,16.2.7,17.2,5.6,20.8v1c-4.5-.2-9-.2-13.8-.2s-7.2,0-12.4.2v-1c5.5-3.1,6.3-4.2,6.3-17.4l-.2-24.2-18.2,42.6h-5l-17-40.3v21.9c-.1,13.4.5,14.5,5.7,17.4v1c-5.4-.2-8.3-.2-12.4-.2s-6.8,0-11.4.2v-1c4.9-3.6,5.3-4.7,5.6-20.8v-15.9c.2-15.4-.9-17.1-6.4-20.6v-1c5.3.2,8.4.2,15.1.2s8.9,0,10.4-.4c.5,1.9,2.2,6.2,4.2,11.2l9.1,23.8,11-24.5c2.1-4.1,4-8.4,4.7-10.4ZM1980.6,367.5c-.1,5,.2,13.4.5,16.4l-1.2.2c-3.4-5-5.4-5.9-16.7-5.9s-3.7,0-4.7.2v15.2l5.5-.2c9.4-.4,11.3-1,12.9-3.5h1.1c-.2,2.2-.3,5.7-.3,8.3s.1,6.2.3,8.4h-1.1c-1.7-2.7-3.4-3.1-12.9-3.6l-5.5-.2v1.3c0,17.4.5,18.3,6.5,21.8v1c-4.7-.2-9.2-.2-14.1-.2s-9.3,0-13.5.2v-1c5.3-3.5,6-4.5,6-23.1v-11.2c0-18.5-.7-19.4-6-23v-1c4.2.2,10.4.2,15.4.2,12.7,0,20.1,0,27.7-.3ZM2030.2,367.5c0,5,.2,13.4.5,16.4l-1.2.2c-3.4-5-5.4-5.9-16.6-5.9s-3.7,0-4.8.2v15.2l5.6-.2c9.4-.4,11.3-1,12.9-3.5h1.1c-.2,2.2-.2,5.7-.2,8.3s0,6.2.2,8.4h-1.1c-1.7-2.7-3.4-3.1-12.9-3.6l-5.6-.2v1.3c0,17.4.5,18.3,6.5,21.8v1c-4.7-.2-9.2-.2-14.1-.2s-9.2,0-13.5.2v-1c5.3-3.5,6-4.5,6-23.1v-11.2c0-18.5-.7-19.4-6-23v-1c4.3.2,10.5.2,15.5.2,12.6,0,20,0,27.7-.3ZM2064.3,368.6c-5.4,3.5-6.2,4.5-6.2,23v11.2c0,18.5.7,19.6,6.2,23.1v1c-5.1-.2-9-.2-13.8-.2s-8.9,0-13.6.2v-1c5.3-3.5,6.2-4.5,6.2-23.1v-11.2c0-18.5-.8-19.4-6.2-23v-1c4.9.2,8.8.2,13.7.2s8.9,0,13.7-.2v1ZM2174.5,367.5c-.2,4.8.1,13.1.4,16l-1.1.2c-3-4.8-5.2-5.5-16.7-5.5s-3.8,0-5.3.2v13.2l6.4-.2c9.2-.4,11-.8,12.7-3.5h1.2c-.3,1.8-.3,5.5-.3,8.5s0,6.4.3,8.3h-1.2c-1.6-2.7-3.5-3.1-12.7-3.5l-6.4-.2v10.8c0,3.5,1.2,4.8,5.9,4.8,10.5,0,12.8-1.5,17.4-7l1,.3c-1.2,5.9-1.8,13.3-2.2,17.1-8.1-.1-19.9-.2-28.6-.2s-10.4,0-14.6.2v-1c5.3-3.5,6-4.5,6-23.1v-11.2c0-18.5-.7-19.4-6-23v-1c4.2.2,10.4.2,15.4.2,13.1,0,20.3,0,28.3-.3ZM2509,367.1c3,7.9,8,19.7,20.3,48.2,2.2,5.2,3.7,7.7,6.9,10.5v1c-3.2-.2-7.8-.2-12.4-.2s-9.5,0-12.1.2v-1c2.5-1.9,2.9-3.1,2.9-4.7s-.3-2.9-1.4-5.3c-.3-.6-.5-1.4-.8-2.2h-22.5c-.2.6-.4,1.1-.6,1.5-1.1,2.7-1.8,4.5-1.8,5.9s.5,3.1,3,4.9v1c-3.9-.2-8.6-.2-12-.2s-7.4,0-9.8.2v-1c3.2-3,4.4-4.7,7.1-10.6,13.1-29.8,17-38.9,20.9-48.2h12.2ZM2592.6,368.6c-3.5,2.5-5,4.3-11.9,14.8-4.3,6.4-9,13.5-13.2,20v5.2c0,12.8.5,13.7,7.2,17.3v1c-6.2-.2-9.9-.2-14.8-.2s-8.5,0-14.7.2v-1c6.7-3.5,7.2-4.7,7.2-16.6v-4.8c-4.5-7.4-9.2-14.8-15.4-24.4-5.2-7.8-6.3-9.4-9.6-11.4v-1c3.8,0,7.3.2,12,.2s10,0,13.7-.2v1c-1.8,1.1-2.3,1.8-2.3,3.1s.4,2.7,3.1,7c2.5,4,5,8,7.7,12.3,2-3,3.8-5.5,5.4-8.2,3.5-6.2,4.9-9.1,4.9-11s-.5-2-2.5-3.2v-1c3.5.2,7.6.2,11.7.2s7.4-.2,11.3-.2v1ZM1801.6,368.5c4.5,0,7,1.4,7,4.8s-3.6,8.1-7.8,14.6l-5.9,10.4c9.2-10.1,15.1-13.5,17.6-13.5s5.3,2.8,5.3,4.2c-3.7,6.2-7.8,14.3-11.5,22.8,5-2.6,9.5-7.3,14-12,3.4-7.8,11.2-15.5,17.6-15.5s5.6,2,6.2,4c1.4.8,2.6,2.2,2.6,3.6,0,7-9.2,16.3-14.9,16.3s-4-2-4.5-3.4c-1.4,3.4-1.9,6.4-1.9,9.2.5.2,1.4.2,1.9.2,5.9,0,14-3.9,18.5-10.9h.3c1.1.6,2.2,1.4,2.2,2.8,0,3.4-9.2,15.7-18.2,15.7-3.6,0-9-2.8-9.5-9-.8-.5-1.7-1.6-1.7-2.8-5.1,6.2-10.7,11.8-14,11.8-2.8,0-4.8-3.6-5.3-6.4-1.1-.8-1.7-2-1.7-3.6,0-3.4,3.9-12,7.6-17.9-6.2,5.3-13.2,13.4-19.9,27.4-2.8,0-5-3.4-5-6.4s3.1-8.6,4.8-12.6c3.9-8.9,14.3-30.8,16.2-33.6ZM1772.8,366c4.2-.3,9,.2,11.5,1.4,1.4.2,2,1.1,2.2,2.5,2.2.8,4.5,2.6,3.9,4-5.6,10.3-16,28.2-22.4,47.3-2,0-6.7-1.4-6.7-7,0-8.1,9.2-22.4,19.3-39.2-5.9-.3-13.4.6-20.4,2,3.1,1.2,6.2,1.4,9,2,.6.5,0,3-1.7,3.3-2.2.9-7.8.9-11.3-.3-1.6-.6-1.9-2.2-1.6-3.9-1.1-1.7-1.7-5.6.6-7,5.3-4,10.7-5,17.7-5ZM2320.2,366.2c4.2,0,7,1.7,7,5s-3.7,8.4-7.8,14.3c-2,3.6-4.2,7.8-6.2,11,9.5-10.1,15.7-13.8,18.2-13.8s5,2.8,5,4.2c-3.7,6.4-7.8,14.6-11.5,23,5.1-2.5,9.9-7.5,14.1-12.3,3.7-8.1,11.5-15.4,17.9-15.4s5.9,2,6.4,3.9c1.4.8,2.2,2.2,2.2,3.9,0,7-9.2,16-14.9,16s-3.9-1.4-4.5-3.1c-1.4,3.1-2.2,6.4-1.7,9.5.3,0,1.1.2,1.7.2,5.9,0,14.3-4.5,18.8-11.2,1.4.2,2.5,1.4,2.5,3.1,0,3-9.5,15.4-18.5,15.4s-9-2.8-9.5-8.7c-.8-.8-1.7-1.9-2-3.1-5,6.2-10.7,11.8-14.1,11.8s-4.7-3.4-5.3-6.4c-1.2-.9-1.7-2-1.7-3.7,0-3.3,3.9-12,7.6-18.2-6.2,5.6-13.5,14-20.2,27.7-2.8,0-5-3.1-5-6.2s.8-3.6,1.6-5.8c-5.8,7-12.6,12.6-15.9,12.6-2.8.3-4.8-2.8-5.4-5.4-1.6-.6-2.2-2.2-2.2-4.2,0-3.3,3.6-12,7.6-20.1-.6,0-1.2-.3-2-.3-2-.3-4-5-2-5.9.3-.2,3.6-.2,7.3-.2,2-3.6,4-6.4,5.6-8.7,3.6,0,6.8,3,5.6,4.7-.2.3-1.1,1.7-2,4,3.1,0,5.4,0,5.9.2,1.1.8-1.2,5.6-3.4,6.2-1.4.2-3.6.2-6.2.2-3.3,6.4-7,14.6-9.8,20.7,10.4-3.6,20.8-16.8,25.8-23.5,4.5-9.5,9.5-19.6,10.6-21.6ZM1899.7,377.6c-9.9,0-15.6,7.8-15.6,18.8s6.2,20.6,16.5,20.6,15.6-7.9,15.6-18.8c0-11.9-6.3-20.7-16.5-20.7ZM2622.8,377.6c-9.9,0-15.6,7.8-15.6,18.8s6.2,20.7,16.5,20.7,15.6-8,15.6-18.8-6.3-20.7-16.4-20.7ZM2220.4,394c-3.7,4.8-6.7,11.8-7.6,20.2,3.6-.8,6.4-3,9-5.9-1.4-2.5-2.2-5.8-2.2-10s.3-2.9.8-4.3ZM2501.3,384.1c-2.7,7.1-5.3,13.8-7.7,19.7h15.3c-2.1-5.5-4.6-12.2-7.7-19.7ZM1841.7,389.2c-5.5,1.4-10.9,7.6-13.7,14.1,4.8-1.2,11.8-8.7,13.7-14.1ZM2229.3,386.1c-2.2.8-4.5,4.5-4.5,9s0,4.5.6,7.3c2.2-5.4,3.9-11.5,3.9-16.3ZM2360.5,387.3c-5.3,1.6-10.9,7.8-13.7,14.3,4.8-1.2,11.8-8.7,13.7-14.3ZM2685.8,378.1c-1.7,0-3.5,0-4.6.3v18.3h3.7c7.5,0,12.1-3.1,12.1-9.6s-4-9-11.1-9Z"/>
  <path class="st5" d="M225.2,536.8h1044V248.8H225.2v288Z"/>
  <path class="st5" d="M1413,250.7H81L153,34.7h1188l72,216Z"/>
  <path class="st3" d="M639.2,537h216v-216h-216v216Z"/>
  <path class="st2" d="M235,190.1c-8.7,0-8.7,5.8-15.4,5.8s-11.7-1.6-15.7-5.6c-12.4-12.4-22.6-32.5-22.6-50.4s2.5-18.1,8.4-24.9c12.5-14.6,21.9-13.6,36-12.2h0s-7.9-18.4-7.9-18.4c1.2-3.2,6.7-5.6,6.7-5.6,0,.1,4.7,16.1,7.9,24.7.2,0,.5.1.8.1,3.4-19.6,11.9-20.9,27.8-28.3.2,2.4.3,4.5.3,6.6,0,9.6-2.9,15.6-14,20.6,4.7-.1,20.8-3.1,34.4,11.8,6.2,6.9,8.9,15.9,8.9,25.5,0,18-10.3,38.1-22.7,50.6-4,4-10.8,5.6-15.8,5.6s-8.3-5.8-17.1-5.8Z"/>
  <path class="st1" d="M331,79v130"/>
  <text id="NYC_Tipping_Protections_Secure" class="st4" transform="translate({TEXT_BOX_X} {TEXT_BOX_TOP_Y})" font-size="{layout.fontSize}">
    {#each tspanLines as line}
      <tspan x={line.x} y={line.y}>{line.text}</tspan>
    {/each}
  </text>
</svg>

    </div>
  </div>
</main>

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    background: #0f0f13;
    color: #e0e0e0;
    font-family: system-ui, -apple-system, sans-serif;
    min-height: 100vh;
  }

  main {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }

  header {
    margin-bottom: 2rem;
  }

  header h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #fff;
    margin-bottom: 0.25rem;
  }

  header p {
    color: #888;
    font-size: 0.95rem;
  }

  .workspace {
    display: flex;
    gap: 2rem;
    align-items: flex-start;
  }

  /* Controls sidebar */
  .controls {
    flex: 0 0 220px;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .controls section {
    background: #18181f;
    border: 1px solid #2a2a35;
    border-radius: 10px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .controls h2 {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #666;
    margin-bottom: 0.25rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: 0.82rem;
    color: #aaa;
  }

  input[type="text"] {
    background: #0f0f13;
    border: 1px solid #2a2a35;
    border-radius: 6px;
    color: #e0e0e0;
    padding: 0.4rem 0.6rem;
    font-size: 0.85rem;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
  }

  input[type="text"]:focus {
    border-color: #e94560;
  }

  .layout-info {
    font-size: 0.75rem;
    color: #555;
    font-family: monospace;
  }


  .download-section {
    gap: 0.5rem !important;
  }

  .btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 1rem;
    border: none;
    border-radius: 7px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: opacity 0.15s, transform 0.1s;
    width: 100%;
    justify-content: center;
  }

  .btn:active {
    transform: scale(0.97);
  }

  .btn-svg {
    background: #2a2a35;
    color: #e0e0e0;
    border: 1px solid #3a3a4a;
  }

  .btn-svg:hover {
    background: #33333f;
  }

  .btn-pdf {
    background: #e94560;
    color: #fff;
  }

  .btn-pdf:hover {
    opacity: 0.88;
  }

  /* Preview area */
  .preview {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .preview svg {
    max-width: 100%;
    height: auto;
    border-radius: 12px;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
    display: block;
  }
</style>
