export const COVER_COLORS = [
  "#5B6CDE",
  "#7B6BC9",
  "#3D8FD4",
  "#2F9A94",
  "#4A7FD4",
  "#8B63C7",
] as const;

export const COVER_GENERATORS = [
  "hexagons",
  "overlappingCircles",
  "sineWaves",
  "diamonds",
  "triangles",
  "concentricCircles",
  "overlappingRings",
  "chevrons",
] as const;

export type CoverColor = (typeof COVER_COLORS)[number];
export type CoverGenerator = (typeof COVER_GENERATORS)[number];

export type CoverSpec = {
  color: CoverColor;
  generator: CoverGenerator;
};

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

function hashSlug(slug: string): number {
  let hash = FNV_OFFSET;

  for (let i = 0; i < slug.length; i += 1) {
    hash ^= slug.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }

  return hash >>> 0;
}

export function getCoverSpec(slug: string): CoverSpec {
  const hash = hashSlug(slug);
  const color = COVER_COLORS[(hash >>> 8) % COVER_COLORS.length];
  const generator =
    COVER_GENERATORS[(hash >>> 16) % COVER_GENERATORS.length];

  return { color, generator };
}
