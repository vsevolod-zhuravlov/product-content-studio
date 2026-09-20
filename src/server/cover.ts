import "server-only";
import { generate } from "geopattern";
import { getCoverSpec } from "@/lib/cover";

export function getCoverBackground(slug: string): string {
  const { color, generator } = getCoverSpec(slug);
  return generate(slug, { color, generator }).toDataUrl();
}
