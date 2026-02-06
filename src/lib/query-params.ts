export function parsePositiveIntParam(
  value: string | null,
  defaultValue: number
): number {
  if (!value) return defaultValue;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return defaultValue;
  return parsed;
}

export function parseBoundedIntParam(
  value: string | null,
  defaultValue: number,
  min: number,
  max: number
): number {
  const parsed = parsePositiveIntParam(value, defaultValue);
  return Math.min(max, Math.max(min, parsed));
}
