import { ERRORS } from "../config/public";
import { renderToast } from "../ui/toast";

export function getErrorMessage(error, fallback = ERRORS.fallback) {
  const code = error?.code ?? error?.response?.code; // defensive
  const type = error?.type;

  return (
    (type && ERRORS.types?.[type]) ||
    (code && ERRORS.codes?.[code]) ||
    error?.message ||
    fallback
  );
}

export function getCssValueFromVarName(
  varName,
  scope = document.documentElement,
) {
  if (!varName) return null;

  // Haal '--foo-bar' uit 'var(--foo-bar)'
  const match = varName.match(/var\((--[^)]+)\)/);
  const cssVar = match ? match[1] : varName;

  const value = getComputedStyle(scope).getPropertyValue(cssVar).trim();

  return value || null;
}

export function convertRemToPx(remValue) {
  if (!remValue) return 0;

  // haal 'rem' weg en maak er een number van
  const rem = parseFloat(remValue.replace("rem", ""));
  if (!Number.isFinite(rem)) return 0;

  const htmlFontSize = parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  );

  return rem * htmlFontSize;
}

export function formatShortDate(dateString) {
  const date = new Date(dateString);

  const day = date.getDate();
  const month = date.toLocaleString("nl-NL", { month: "short" });
  const year = String(date.getFullYear()).slice(-2);

  return `${day} ${month} '${year}`;
}

export function formatDateTime(dateString) {
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

export function formatFullDate(dateString) {
  const date = new Date(dateString);

  const day = date.getDate();
  const month = date.toLocaleString("nl-NL", { month: "long" });
  const year = String(date.getFullYear());

  return `${day} ${month} ${year}`;
}

export function formatFullDayDate(dateString) {
  const date = new Date(dateString);

  const base = date.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const yearShort = String(date.getFullYear()).slice(-2);

  const formatted = `${base} '${yearShort}`;

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function daysUntil(date) {
  if (!date) return null;

  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return null;

  const now = new Date();

  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffMs = target - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

export function isBetweenDates(date, start, end) {
  const d = new Date(date).setHours(0, 0, 0, 0);
  const s = new Date(start).setHours(0, 0, 0, 0);
  const e = new Date(end).setHours(0, 0, 0, 0);
  return d >= s && d <= e;
}

export function isLightHexColor(hexColor) {
  if (!hexColor || typeof hexColor !== "string") return false;

  // Normalize: remove leading '#', trim whitespace
  let hex = hexColor.trim().replace(/^#/, "");

  // Support shorthand (#RGB)
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  // Must be 6 hex chars
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return false;

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // Relative luminance (sRGB) — simple threshold for UI contrast decisions
  // 0..255 -> 0..1
  const rs = r / 255;
  const gs = g / 255;
  const bs = b / 255;

  const toLinear = (c) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const R = toLinear(rs);
  const G = toLinear(gs);
  const B = toLinear(bs);

  const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;

  // Threshold: ~0.5 is a good practical split for "light" backgrounds
  return luminance > 0.5;
}

export function isDarkHexColor(hexColor) {
  return !isLightHexColor(hexColor);
}

// ===== Color format helpers =====
function parseNumberList(input) {
  if (input == null) return [];

  // Accept arrays (numbers/strings) or a single string like "55, 66, 59" or "16.67%, 0%, ..."
  const raw = Array.isArray(input) ? input.join(",") : String(input);

  return raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      // Remove trailing % if present
      const cleaned = p.replace(/%/g, "");
      const n = parseFloat(cleaned);
      return Number.isFinite(n) ? n : null;
    })
    .filter((n) => n != null);
}

function ensureHashHex(hex) {
  if (!hex) return null;
  const value = String(hex).trim();
  if (!value) return null;
  return value.startsWith("#")
    ? value.toUpperCase()
    : `#${value.toUpperCase()}`;
}

/**
 * Format a color value from DB into a CSS-like string.
 *
 * DB examples:
 * - HEX: "#37423B"
 * - RGBA: "55, 66, 59"
 * - HSL: "142, 9, 24"
 * - CMYK: "16.67%, 0%, 10.61%, 74.12%"
 */
export function formatColorValue(format, value) {
  const type = String(format || "").toLowerCase();

  if (type === "hex") {
    return ensureHashHex(value);
  }

  if (type === "rgba" || type === "rgb") {
    const parts = parseNumberList(value);
    const r = parts[0];
    const g = parts[1];
    const b = parts[2];
    const a = parts.length >= 4 ? parts[3] : 1;

    if ([r, g, b].some((n) => n == null)) return null;

    // User requested: rgb(55, 66, 59, 1)
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
  }

  if (type === "hsl") {
    const parts = parseNumberList(value);
    const h = parts[0];
    const s = parts[1];
    const l = parts[2];

    if ([h, s, l].some((n) => n == null)) return null;

    return `hsl(${Math.round(h)}, ${Math.round(s)}, ${Math.round(l)})`;
  }

  if (type === "cmyk") {
    const parts = parseNumberList(value);
    const c = parts[0];
    const m = parts[1];
    const y = parts[2];
    const k = parts[3];

    if ([c, m, y, k].some((n) => n == null)) return null;

    // Round to whole percentages as requested
    return `cmyk(${Math.round(c)}%, ${Math.round(m)}%, ${Math.round(
      y,
    )}%, ${Math.round(k)}%)`;
  }

  return null;
}

export function formatColorFormats({ hex, rgba, hsl, cmyk } = {}) {
  return {
    hex: formatColorValue("hex", hex),
    rgba: formatColorValue("rgba", rgba),
    hsl: formatColorValue("hsl", hsl),
    cmyk: formatColorValue("cmyk", cmyk),
  };
}

export async function copyToClipboard(string, positiveFeedbackMessage) {
  try {
    await navigator.clipboard.writeText(string);
    renderToast("Gelukt", positiveFeedbackMessage, "positive");
  } catch (err) {
    renderToast("Mislukt", "Kon niet kopiëren.", "negative");
  }
}

export function formatPx(value, decimals = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "";
  return `${num.toFixed(decimals)}px`;
}

export function formatRem(value, decimals = 3) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "";
  // Trim trailing zeros a bit for cleaner output
  return `${parseFloat(num.toFixed(decimals))}rem`;
}
/**
 * Build a typography scale around a base (1rem) using a factor.
 * - base is always "base" (1rem)
 * - 1 step below base is "sm", then "2sm", "3sm", ...
 * - 1 step above base is "lg", then "xl", then "2xl", "3xl", ...
 *
 * @param {Object} params
 * @param {number} params.basePx - Base pixel size that equals 1rem (e.g. 16)
 * @param {number} params.factor - Multiplication factor per step (e.g. 1.414)
 * @param {number} [params.stepsUp=6] - Steps above base (lg, xl, 2xl...)
 * @param {number} [params.stepsDown=4] - Steps below base (sm, 2sm...)
 * @returns {Array<{label:string, step:number, px:number, rem:number}>}
 */

export function buildTypographyScale({
  basePx,
  factor,
  stepsUp = 6,
  stepsDown = 4,
}) {
  const safeBasePx = Number(basePx);
  const safeFactor = Number(factor);

  if (!Number.isFinite(safeBasePx) || safeBasePx <= 0) {
    throw new Error(`Invalid basePx: ${basePx}`);
  }
  if (!Number.isFinite(safeFactor) || safeFactor <= 0) {
    throw new Error(`Invalid factor: ${factor}`);
  }

  const steps = [];

  // Steps below base: sm, 2sm, 3sm, ...
  for (let n = stepsDown; n >= 1; n--) {
    const rem = 1 / Math.pow(safeFactor, n);
    const px = rem * safeBasePx;

    const label = n === 1 ? "sm" : `${n}sm`;
    steps.push({ label, step: -n, px, rem });
  }

  // Base
  steps.push({ label: "base", step: 0, px: safeBasePx, rem: 1 });

  // Steps above base: lg, xl, 2xl, 3xl, ...
  for (let n = 1; n <= stepsUp; n++) {
    const rem = Math.pow(safeFactor, n);
    const px = rem * safeBasePx;

    let label;
    if (n === 1) label = "lg";
    else if (n === 2) label = "xl";
    else label = `${n - 1}xl`;

    steps.push({ label, step: n, px, rem });
  }

  steps.sort((a, b) => b.rem - a.rem);

  return steps;
}

// Source - https://stackoverflow.com/a
// Posted by anon, modified by community. See post 'Timeline' for change history
// Retrieved 2026-01-13, License - CC BY-SA 4.0
export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function stripePriceToEuroFormat(unitAmount) {
  return unitAmount / 100;
}
