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
