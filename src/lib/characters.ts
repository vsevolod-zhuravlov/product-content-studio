/**
 * Count Unicode code points. Combining marks count separately; this is not
 * grapheme-cluster segmentation.
 */
export function countCharacters(value: string): number {
  return Array.from(value).length;
}
