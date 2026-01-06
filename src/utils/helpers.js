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

export function getHexFromVarName(varName, scope = document.documentElement) {
  if (!varName) return null;

  // Haal '--foo-bar' uit 'var(--foo-bar)'
  const match = varName.match(/var\((--[^)]+)\)/);
  const cssVar = match ? match[1] : varName;

  const value = getComputedStyle(scope).getPropertyValue(cssVar).trim();

  return value || null;
}

export function formatShortDate(dateString) {
  const date = new Date(dateString);

  const day = date.getDate();
  const month = date.toLocaleString("nl-NL", { month: "short" });
  const year = String(date.getFullYear()).slice(-2);

  return `${day} ${month} '${year}`;
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
      y
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
