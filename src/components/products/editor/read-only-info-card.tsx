import { Info, Lock } from "lucide-react";
import { SpecsList } from "@/components/products/editor/specs-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminProduct } from "@/lib/api-types";

type ReadOnlyInfoCardProps = {
  product: Pick<AdminProduct, "name" | "slug" | "specs">;
};

export function ReadOnlyInfoCard({ product }: ReadOnlyInfoCardProps) {
  return (
    <Card className="bg-card shadow-sm ring-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-semibold">
          <Info className="size-4 shrink-0 text-primary" aria-hidden="true" />
          Основна інформація
        </CardTitle>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5 shrink-0" aria-hidden="true" />
          Назву й характеристики не можна змінити
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Назва товару
          </p>
          <p className="mt-1 text-sm font-medium">{product.name}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Slug</p>
          <p className="mt-1">
            <span className="inline-flex rounded-full bg-secondary px-2.5 py-1 font-mono text-xs font-medium text-secondary-foreground">
              {product.slug}
            </span>
          </p>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Характеристики
          </p>
          <SpecsList specs={product.specs} />
        </div>
      </CardContent>
    </Card>
  );
}
