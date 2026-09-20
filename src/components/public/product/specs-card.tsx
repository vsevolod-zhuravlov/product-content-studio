import { SlidersHorizontal } from "lucide-react";
import type { PublicProduct } from "@/lib/api-types";
import { SpecsList } from "@/components/products/editor/specs-list";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SpecsCardProps = {
  specs: PublicProduct["specs"];
};

export function SpecsCard({ specs }: SpecsCardProps) {
  if (specs.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card shadow-sm ring-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-semibold">
          <SlidersHorizontal className="size-4 text-primary" aria-hidden="true" />
          Характеристики
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SpecsList specs={specs} />
      </CardContent>
    </Card>
  );
}
