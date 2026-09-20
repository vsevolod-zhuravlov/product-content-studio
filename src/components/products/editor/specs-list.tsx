type Spec = {
  label: string;
  value: string;
};

type SpecsListProps = {
  specs: Spec[];
};

export function SpecsList({ specs }: SpecsListProps) {
  if (specs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Характеристики відсутні</p>
    );
  }

  return (
    <dl className="divide-y">
      {specs.map((spec) => (
        <div
          key={`${spec.label}-${spec.value}`}
          className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[12rem_1fr] sm:gap-4"
        >
          <dt className="text-sm text-muted-foreground">{spec.label}</dt>
          <dd className="text-sm font-medium">{spec.value}</dd>
        </div>
      ))}
    </dl>
  );
}
