export function SkipLink() {
  return (
    <a
      href="#content"
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-4 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:ring-3 focus:ring-ring/50"
    >
      Перейти до змісту
    </a>
  );
}
