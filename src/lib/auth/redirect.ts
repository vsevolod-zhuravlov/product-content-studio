const DEFAULT_ADMIN_PATH = "/admin/products";

export function safeRedirectPath(next: string | null): string {
  if (
    next === null ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("\\")
  ) {
    return DEFAULT_ADMIN_PATH;
  }

  const pathname = next.split(/[?#]/, 1)[0] ?? "";

  try {
    const decodedPath = decodeURIComponent(pathname);
    const segments = decodedPath.split("/");

    if (
      (decodedPath !== "/admin" && !decodedPath.startsWith("/admin/")) ||
      segments.includes("..")
    ) {
      return DEFAULT_ADMIN_PATH;
    }
  } catch {
    return DEFAULT_ADMIN_PATH;
  }

  return next;
}
