const PUBLIC_PRODUCT_SLUG_PATTERN = /^[a-z0-9-]{1,100}$/;

export function isValidPublicProductSlug(slug: string): boolean {
  return PUBLIC_PRODUCT_SLUG_PATTERN.test(slug);
}
