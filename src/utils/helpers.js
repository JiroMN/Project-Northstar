import { ERRORS } from "../config/public";

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
