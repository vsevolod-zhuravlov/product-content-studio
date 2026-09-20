export const DESCRIPTION_EXCERPT_LENGTH = 140;

export function splitDescriptionParagraphs(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed === "") {
    return [];
  }

  return trimmed
    .split(/\n[ \t]*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

export function shortenDescription(
  text: string,
  maxLength = DESCRIPTION_EXCERPT_LENGTH,
): string {
  const firstParagraph = splitDescriptionParagraphs(text)[0];
  if (!firstParagraph) {
    return "";
  }

  const normalized = firstParagraph.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  const slice = normalized.slice(0, maxLength);
  const breakAt = slice.lastIndexOf(" ");
  const minBreak = Math.floor(maxLength * 0.6);
  const cut = breakAt >= minBreak ? slice.slice(0, breakAt) : slice;

  return `${cut.replace(/[\s.,;:!?—–-]+$/u, "")}…`;
}
