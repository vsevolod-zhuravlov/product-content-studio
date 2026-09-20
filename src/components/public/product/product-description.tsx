import { AlignLeft } from "lucide-react";
import { splitDescriptionParagraphs } from "@/lib/product-description";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProductDescriptionProps = {
  description: string;
};

export function ProductDescription({ description }: ProductDescriptionProps) {
  const paragraphs = splitDescriptionParagraphs(description);

  if (paragraphs.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card shadow-sm ring-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-semibold">
          <AlignLeft className="size-4 text-primary" aria-hidden="true" />
          Опис
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className="text-sm leading-6 break-words whitespace-pre-line text-muted-foreground"
          >
            {paragraph}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}
