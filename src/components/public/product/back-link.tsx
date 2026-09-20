import Link from "next/link";

export function BackLink() {
  return (
    <Link
      href="/"
      className="inline-flex rounded-md text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      ← Назад до каталогу
    </Link>
  );
}
