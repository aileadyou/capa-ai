interface SplitOptionProps {
  title: string;
  description: string;
  trainPercent: number;
  validationPercent: number;
  testPercent: number;
  isSelected?: boolean;
  isRecommended?: boolean;
  onSelect?: () => void;
}

export const SplitOption = ({
  title,
  description,
  trainPercent,
  validationPercent,
  testPercent,
  isSelected = false,
  isRecommended = false,
  onSelect,
}: SplitOptionProps) => {
  return (
    <button
      onClick={onSelect}
      className={`relative rounded-[11px] border p-6 w-full text-left cursor-pointer ${
        isSelected
          ? "border-primary bg-primary-light"
          : "border-border bg-card"
      }`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-4 w-4 items-center justify-center rounded-full border ${
            isSelected ? "border-primary" : "border-border"
          }`}
        >
          {isSelected && (
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
          )}
        </div>
        <h4 className="text-2xl font-bold text-foreground">{title}</h4>
        {isRecommended && (
          <div className="rounded-[9px] bg-[var(--accent-soft)] px-2 py-0.5">
            <span className="text-xs font-bold text-primary-dark">
              Recomended
            </span>
          </div>
        )}
      </div>
      <p className="mb-4 text-xs text-foreground">{description}</p>
      <div className="relative h-4 overflow-hidden rounded-lg">
        <div className="absolute h-full w-full bg-train rounded-lg" />
        <div
          className="absolute h-full bg-validation rounded-lg"
          style={{ width: `${100 - testPercent}%` }}
        />
        <div
          className="absolute h-full bg-test rounded-lg"
          style={{ width: `${trainPercent}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-around text-[10px] font-bold text-card">
          <span>Train</span>
          <span>Val</span>
          <span>Test</span>
        </div>
      </div>
    </button>
  );
};
