/**
 * Plain-language descriptions for readings that mean nothing to most people as
 * bare numbers. Pure functions, so they live here rather than inside the
 * component that renders them.
 */

/** WHO global UV index bands: 0–2 low, 3–5 moderate, 6–7 high, 8–10 very high, 11+ extreme. */
export function describeUvIndex(uv: number): string {
  if (uv >= 11) return 'Extreme';
  if (uv >= 8) return 'Very high';
  if (uv >= 6) return 'High';
  if (uv >= 3) return 'Moderate';
  return 'Low';
}

/**
 * Standard sea-level pressure is 1013 hPa. The bands are deliberately wide —
 * the useful signal for a reader is "unusually high or low", not a precise
 * figure they already have next to it.
 */
export function describePressure(hPa: number): string {
  if (hPa >= 1023) return 'High';
  if (hPa <= 1009) return 'Low';
  return 'Normal';
}

/** Visibility in kilometres, banded the way aviation and road reports describe it. */
export function describeVisibility(km: number): string {
  if (km >= 10) return 'Clear';
  if (km >= 4) return 'Moderate';
  if (km >= 1) return 'Poor';
  return 'Very poor';
}
