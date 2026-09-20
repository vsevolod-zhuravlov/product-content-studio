import type { PublicProduct } from "@/lib/api-types";

type SpecRowProps = PublicProduct["specs"][number];

export function SpecRow({ label, value }: SpecRowProps) {
  return (
    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-muted-foreground break-words">{label}</dt>
      <dd className="min-w-0 text-sm font-medium break-words">{value}</dd>
    </div>
  );
}
