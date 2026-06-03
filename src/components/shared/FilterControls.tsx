import type { ReactNode } from "react";
import { Search } from "lucide-react";

interface FilterCardProps {
  children: ReactNode;
  minColumnWidth?: number;
}

interface FilterSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel?: string;
  onEnter?: () => void;
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  ariaLabel?: string;
}

const fieldClassName =
  "h-9 w-full box-border rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] font-sans text-sm text-foreground outline-none transition-[background,border-color,box-shadow] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] focus:border-primary focus:bg-[var(--field-bg-hover)] focus:shadow-[0_0_0_3px_var(--accent-soft)]";

export function FilterCard({ children, minColumnWidth = 160 }: FilterCardProps) {
  return (
    <div
      className="max-w-full rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-4 shadow-sm"
      style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minColumnWidth}px), 1fr))`,
        }}
    >
      <div
        className="grid items-end gap-2.5"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minColumnWidth}px), 1fr))` }}
      >
        {children}
      </div>
    </div>
  );
}

export function FilterSearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  onEnter,
}: FilterSearchInputProps) {
  return (
    <div className="relative min-w-0">
      <Search
        size={14}
        strokeWidth={1.75}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary"
      />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && onEnter) {
            event.preventDefault();
            onEnter();
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className={`${fieldClassName} pl-[34px] pr-3`}
      />
    </div>
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
  ariaLabel,
}: FilterSelectProps) {
  return (
    <div className="relative min-w-0">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        className={`${fieldClassName} cursor-pointer appearance-none pl-3 pr-[34px]`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground-tertiary"
      >
        <path
          d="M3 5l3 3 3-3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
