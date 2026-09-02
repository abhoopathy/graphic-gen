/**
 * typeset.js
 *
 * Fixed-box typesetter for sign/display text using opentype.js glyph metrics.
 *
 * Algorithm:
 *   1. Binary-search the largest font size where all words fit in the box
 *      with any wrapping.
 *   2. At that size, find the optimal line breaks using a minimum-raggedness
 *      dynamic-programming solver (O(n²) over words) — same principle as
 *      Knuth-Plass but without the penalty system, which is correct for
 *      display text with a small word count.
 *   3. "Balanced" means we minimise the sum of squared leftover space per
 *      line (classic TeX badness), which naturally produces even-looking lines.
 *
 * Returns: Array of { text: string, x: number, y: number } line objects,
 *          plus the resolved fontSize.
 */

import opentype from 'opentype.js';

const fontCache = new Map();

export async function loadFontForTypeset(url) {
  if (fontCache.has(url)) return fontCache.get(url);
  const buffer = await fetch(url).then(r => r.arrayBuffer());
  const font = opentype.parse(buffer);
  fontCache.set(url, font);
  return font;
}

/**
 * Measure the advance width of a string at a given font size using opentype metrics.
 * This is exact — no canvas, no DOM.
 */
export function measureWidth(font, text, fontSize) {
  const scale = fontSize / font.unitsPerEm;
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const glyph = font.charToGlyph(text[i]);
    width += (glyph.advanceWidth || 0) * scale;
  }
  return width;
}

/**
 * The line height as a multiple of font size.
 * 1.2 is standard for display/headline type.
 */
const LINE_HEIGHT_RATIO = 1.2;

/**
 * Return the ascender height in SVG user units for a given font and fontSize.
 * Uses actual opentype OS/2 or hhea metrics rather than a magic ratio.
 */
export function fontAscender(font, fontSize) {
  const scale = fontSize / font.unitsPerEm;
  // Prefer OS/2 sTypoAscender, fall back to hhea ascender
  const ascenderUnits =
    (font.tables.os2 && font.tables.os2.sTypoAscender) ||
    (font.tables.hhea && font.tables.hhea.ascender) ||
    font.unitsPerEm * 0.8;
  return ascenderUnits * scale;
}

/**
 * Main entry point.
 *
 * @param {object} font      - opentype.js Font object
 * @param {string} text      - the full input string
 * @param {number} boxWidth  - available width in SVG user units
 * @param {number} boxHeight - available height in SVG user units
 * @param {number} maxFontSize - largest allowed font size (the original)
 * @param {number} minFontSize - smallest allowed font size before giving up
 *
 * @returns {{ lines: string[], fontSize: number, lineHeight: number }}
 */
export function typeset(font, text, boxWidth, boxHeight, maxFontSize, minFontSize = 10) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return { lines: [], fontSize: maxFontSize, lineHeight: maxFontSize * LINE_HEIGHT_RATIO };

  // Binary search: find largest fontSize where text fits
  let lo = minFontSize;
  let hi = maxFontSize;
  let bestResult = null;

  // We need at least 1px precision; 20 iterations gives < 0.001px precision
  for (let iter = 0; iter < 40; iter++) {
    const mid = (lo + hi) / 2;
    const result = tryFit(font, words, mid, boxWidth, boxHeight);
    if (result) {
      bestResult = result;
      lo = mid;
    } else {
      hi = mid;
    }
    if (hi - lo < 0.5) break;
  }

  if (!bestResult) {
    // Force minimum size and wrap anyway (may overflow, but shouldn't in practice)
    bestResult = tryFit(font, words, minFontSize, boxWidth, boxHeight) ||
      forceWrap(font, words, minFontSize, boxWidth);
  }

  return bestResult;
}

/**
 * Try to fit words at a given fontSize within boxWidth × boxHeight.
 * Returns the layout or null if it doesn't fit.
 */
function tryFit(font, words, fontSize, boxWidth, boxHeight) {
  const lineHeight = fontSize * LINE_HEIGHT_RATIO;
  const lines = balancedBreak(font, words, fontSize, boxWidth);
  const totalHeight = lines.length * lineHeight;
  if (totalHeight > boxHeight) return null;
  return { lines, fontSize, lineHeight };
}

/**
 * Force wrap at minimum size without height constraint (last resort).
 */
function forceWrap(font, words, fontSize, boxWidth) {
  const lineHeight = fontSize * LINE_HEIGHT_RATIO;
  const lines = greedyWrap(font, words, fontSize, boxWidth);
  return { lines, fontSize, lineHeight };
}

/**
 * Balanced line-breaking using minimum-raggedness DP.
 *
 * Cost of a line = (leftover / boxWidth)²  — normalised so cost is
 * scale-independent. We minimise total cost across all lines.
 *
 * This is equivalent to TeX's "minimize sum of badness²" for display text.
 * Last line is excluded from cost (ragged-right is conventional).
 */
function balancedBreak(font, words, fontSize, boxWidth) {
  const n = words.length;

  // Precompute cumulative widths for O(1) line-width lookup.
  // lineWidth(i, j) = width of words[i..j] joined by single spaces.
  const wordWidths = words.map(w => measureWidth(font, w, fontSize));
  const spaceWidth = measureWidth(font, ' ', fontSize);

  // lineW[i][j] = render width of words i..j (inclusive)
  // We only need it on demand, so we use a helper.
  function lineW(i, j) {
    let w = 0;
    for (let k = i; k <= j; k++) {
      w += wordWidths[k];
      if (k < j) w += spaceWidth;
    }
    return w;
  }

  // Check if words i..j fit on one line
  function fits(i, j) {
    return lineW(i, j) <= boxWidth;
  }

  // Cost of breaking words i..j onto one line (only meaningful if fits)
  function cost(i, j, isLastLine) {
    if (isLastLine) return 0; // last line has no raggedness cost
    const leftover = boxWidth - lineW(i, j);
    const ratio = leftover / boxWidth;
    return ratio * ratio;
  }

  // DP: dp[i] = minimum cost to break words[i..n-1]
  //     split[i] = the j where the break happens (words[i..j] on one line)
  const dp = new Array(n + 1).fill(Infinity);
  const split = new Array(n).fill(-1);
  dp[n] = 0;

  for (let i = n - 1; i >= 0; i--) {
    for (let j = i; j < n; j++) {
      if (!fits(i, j)) break; // words are ordered, so once it doesn't fit, stop
      const isLastLine = j === n - 1;
      const c = cost(i, j, isLastLine) + dp[j + 1];
      if (c < dp[i]) {
        dp[i] = c;
        split[i] = j;
      }
    }
  }

  // Reconstruct lines
  const lines = [];
  let i = 0;
  while (i < n) {
    const j = split[i];
    if (j === -1) {
      // Single word too wide — force it on its own line
      lines.push(words[i]);
      i++;
    } else {
      lines.push(words.slice(i, j + 1).join(' '));
      i = j + 1;
    }
  }

  return lines;
}

/**
 * Simple greedy wrap — fallback only.
 */
function greedyWrap(font, words, fontSize, boxWidth) {
  const spaceWidth = measureWidth(font, ' ', fontSize);
  const lines = [];
  let current = [];
  let currentWidth = 0;

  for (const word of words) {
    const ww = measureWidth(font, word, fontSize);
    const addWidth = current.length ? spaceWidth + ww : ww;
    if (current.length && currentWidth + addWidth > boxWidth) {
      lines.push(current.join(' '));
      current = [word];
      currentWidth = ww;
    } else {
      current.push(word);
      currentWidth += addWidth;
    }
  }
  if (current.length) lines.push(current.join(' '));
  return lines;
}
