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
