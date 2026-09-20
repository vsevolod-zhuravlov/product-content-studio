import { splitDescriptionParagraphs } from "@/lib/product-description";

type ProductDescriptionProps = {
  description: string;
};

export function ProductDescription({ description }: ProductDescriptionProps) {
  const paragraphs = splitDescriptionParagraphs(description);

  if (paragraphs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          className="text-base leading-relaxed break-words whitespace-pre-line"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}
