const MAX_QUERY_LENGTH = 80;

/**
 * Allowlist rather than blocklist: letters (any script), digits, spaces and the
 * handful of punctuation marks that appear in real place names and postcodes.
 * Everything else — markup delimiters, control characters — is rejected before
 * it reaches the URL builder.
 */
const ALLOWED_CHARACTERS = /^[\p{L}\p{N}\s,.'\-/]+$/u;

export type QueryValidation = { ok: true; value: string } | { ok: false; reason: string };

export const normaliseQuery = (input: string) => input.trim().replace(/\s+/g, ' ');

export function validateQuery(input: string): QueryValidation {
  const value = normaliseQuery(input);
  if (!value) return { ok: false, reason: 'Enter a city, postcode or country.' };
  if (value.length > MAX_QUERY_LENGTH) return { ok: false, reason: 'That search is too long.' };
  if (!ALLOWED_CHARACTERS.test(value)) return { ok: false, reason: 'That search contains characters we cannot use.' };
  if (!/[\p{L}\p{N}]/u.test(value)) return { ok: false, reason: 'Enter a city, postcode or country.' };
  return { ok: true, value };
}

/** Four decimal places is ~11m — plenty for weather, and keeps cache keys stable. */
export const coordinateQuery = (latitude: number, longitude: number) =>
  `${latitude.toFixed(4)},${longitude.toFixed(4)}`;

export const isCoordinateQuery = (query: string) => /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(query.trim());
