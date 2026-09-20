const DATE_FALLBACK = "—";
const productPluralRules = new Intl.PluralRules("uk");

export function formatProductCount(count: number): string {
  const nouns: Record<Intl.LDMLPluralRule, string> = {
    one: "товар",
    few: "товари",
    many: "товарів",
    other: "товарів",
    two: "товарів",
    zero: "товарів",
  };

  return `${count} ${nouns[productPluralRules.select(count)]}`;
}

function toValidDate(
  value: string | Date | null | undefined,
): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function formatDate(
  value: string | Date | null | undefined,
  fallback = DATE_FALLBACK,
): string {
  const date = toValidDate(value);
  if (!date) {
    return fallback;
  }

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(
  value: string | Date | null | undefined,
  fallback = DATE_FALLBACK,
): string {
  const date = toValidDate(value);
  if (!date) {
    return fallback;
  }

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatTime(value: Date): string {
  return new Intl.DateTimeFormat("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}
