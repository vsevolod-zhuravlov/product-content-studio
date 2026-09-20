import type { PublicProduct } from "@/lib/api-types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SpecRow } from "./spec-row";

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
        <h2 className="font-heading text-base font-semibold">Характеристики</h2>
      </CardHeader>
      <CardContent>
        <dl className="divide-y">
          {specs.map((spec, index) => (
            <SpecRow
              key={`${index}-${spec.label}`}
              label={spec.label}
              value={spec.value}
            />
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
