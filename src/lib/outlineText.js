import opentype from 'opentype.js';

// Cache loaded fonts by URL so we only fetch once per session
const fontCache = new Map();

async function loadFont(url) {
  if (fontCache.has(url)) return fontCache.get(url);
  const buffer = await fetch(url).then(r => r.arrayBuffer());
  const font = opentype.parse(buffer);
  fontCache.set(url, font);
  return font;
}

/**
 * Given a live SVG element, returns a clone where every <text> node has been
 * replaced with a <path> containing the outlined glyphs.
 *
 * fontMap: { [cssFontFamily]: '/fonts/FileName.otf' }
 */
export async function outlineTextNodes(svgEl, fontMap) {
  // Pre-load all fonts in parallel
  const urlsNeeded = new Set(Object.values(fontMap));
  await Promise.all([...urlsNeeded].map(url => loadFont(url).catch(() => null)));

  // Parse class-based CSS rules out of any <style> blocks inside the SVG.
  // We do this on the LIVE element so the browser has already parsed it.
  const classStyles = extractSvgClassStyles(svgEl);

  // Collect live <text> elements and their computed styles BEFORE cloning
  const liveTextEls = Array.from(svgEl.querySelectorAll('text'));
  const resolved = liveTextEls.map(el => resolveTextStyle(el, classStyles));

  // Now clone and operate on the clone
  const clone = svgEl.cloneNode(true);
  const cloneTextEls = Array.from(clone.querySelectorAll('text'));

  for (let i = 0; i < cloneTextEls.length; i++) {
    const textEl = cloneTextEls[i];
    const style = resolved[i];

    const fontUrl = resolveFontUrl(style.fontFamily, fontMap);
    if (!fontUrl) continue;

    const font = fontCache.get(fontUrl);
    if (!font) continue;

    const segments = collectTextSegments(textEl, style);
    if (!segments.length) continue;

    const paths = [];
    for (const seg of segments) {
      const pathData = font.getPath(seg.text, seg.x, seg.y, style.fontSize).toPathData(4);
      if (!pathData) continue;

      const pathEl = clone.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', pathData);
      pathEl.setAttribute('fill', seg.fill || style.fill);
      if (seg.opacity) pathEl.setAttribute('opacity', seg.opacity);
      const transform = textEl.getAttribute('transform');
      if (transform) pathEl.setAttribute('transform', transform);
      paths.push(pathEl);
    }

    if (paths.length) {
      const parent = textEl.parentNode;
      paths.forEach(p => parent.insertBefore(p, textEl));
      parent.removeChild(textEl);
    }
  }

  return clone;
}

/**
 * Parse all CSS class rules out of <style> blocks inside the SVG.
 * Returns a map of { '.classname': { property: value, ... } }
 */
function extractSvgClassStyles(svgEl) {
  const map = {};
  const styleEls = svgEl.querySelectorAll('style');
  for (const styleEl of styleEls) {
    const text = styleEl.textContent;
    // Match .className { ... } blocks
    const ruleRe = /([^{}]+)\{([^{}]+)\}/g;
    let m;
    while ((m = ruleRe.exec(text)) !== null) {
      const selectors = m[1].trim().split(',').map(s => s.trim());
      const declarations = parseDeclarations(m[2]);
      for (const sel of selectors) {
        if (!map[sel]) map[sel] = {};
        Object.assign(map[sel], declarations);
      }
    }
  }
  return map;
}

function parseDeclarations(block) {
  const result = {};
  for (const decl of block.split(';')) {
    const colon = decl.indexOf(':');
    if (colon === -1) continue;
    const prop = decl.slice(0, colon).trim();
    const val = decl.slice(colon + 1).trim();
    if (prop && val) result[prop] = val;
  }
  return result;
}

/**
 * Resolve font-family, font-size, and fill for a live <text> element.
 * Priority: presentation attribute > getComputedStyle > class rules
 *
 * We check the presentation attribute FIRST because the app sets font-size
 * as an attribute to override the CSS class value (which would otherwise
 * always win via the cascade).
 */
function resolveTextStyle(el, classStyles) {
  // 1. Presentation attribute takes top priority (set by the typesetter)
  const attrFontSize = el.getAttribute('font-size');
  const attrFontFamily = el.getAttribute('font-family');
  const attrFill = el.getAttribute('fill');

  // 2. getComputedStyle for anything not set as an attribute
  const cs = window.getComputedStyle(el);
  let fontFamily = attrFontFamily || cs.fontFamily;
  let fontSize = attrFontSize ? parseFloat(attrFontSize) : parseFloat(cs.fontSize);
  let fill = attrFill || cs.fill;

  // 3. Class rules from SVG <style> block as fallback
  if (!fontFamily || fontFamily === 'sans-serif' || fontFamily === '') {
    const classDecls = getClassDecls(el, classStyles);
    fontFamily = classDecls['font-family'] || fontFamily;
    if (!fontSize || isNaN(fontSize)) {
      fontSize = parseFloat(classDecls['font-size']) || 16;
    }
    if (!fill || fill === 'rgb(0, 0, 0)') {
      fill = classDecls['fill'] || fill;
    }
  }

  fontFamily = fontFamily || 'sans-serif';
  fontSize = (!fontSize || isNaN(fontSize)) ? 16 : fontSize;
  fill = fill || '#000';

  return { fontFamily, fontSize, fill };
}

/** Merge all CSS declarations that apply to an element via its class attribute */
function getClassDecls(el, classStyles) {
  const classes = (el.getAttribute('class') || '').split(/\s+/).filter(Boolean);
  const merged = {};
  for (const cls of classes) {
    const rules = classStyles[`.${cls}`];
    if (rules) Object.assign(merged, rules);
  }
  return merged;
}

/** Collect {text, x, y, fill, opacity} segments from a <text> and its tspan children */
function collectTextSegments(textEl, style) {
  const segments = [];
  const tspans = textEl.querySelectorAll('tspan');

  const baseX = parseFloat(textEl.getAttribute('x')) || 0;
  const baseY = parseFloat(textEl.getAttribute('y')) || 0;

  if (tspans.length === 0) {
    const text = textEl.textContent.trim();
    if (text) {
      segments.push({ text, x: baseX, y: baseY, fill: style.fill, opacity: textEl.getAttribute('opacity') });
    }
  } else {
    for (const tspan of tspans) {
      const text = tspan.textContent.trim();
      if (!text) continue;
      const x = tspan.getAttribute('x') !== null ? parseFloat(tspan.getAttribute('x')) : baseX;
      const y = tspan.getAttribute('y') !== null ? parseFloat(tspan.getAttribute('y')) : baseY;
      segments.push({
        text,
        x,
        y,
        fill: tspan.getAttribute('fill') || style.fill,
        opacity: tspan.getAttribute('opacity'),
      });
    }
  }

  return segments;
}

/** Resolve a CSS font-family string against fontMap keys (case-insensitive, partial match) */
function resolveFontUrl(fontFamilyString, fontMap) {
  for (const [key, url] of Object.entries(fontMap)) {
    const needle = key.toLowerCase().replace(/['"\\]/g, '');
    const families = fontFamilyString.split(',').map(f => f.trim().toLowerCase().replace(/['"\\]/g, ''));
    if (families.some(f => f === needle || f.includes(needle) || needle.includes(f))) {
      return url;
    }
  }
  return null;
}
