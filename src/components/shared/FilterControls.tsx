import type { CSSProperties, ReactNode } from "react";
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

const fieldBaseStyle: CSSProperties = {
  width: "100%",
  height: "36px",
  background: "var(--field-bg)",
  border: "1px solid var(--line-2)",
  borderRadius: "var(--r-sm)",
  color: "var(--fg-1)",
  fontSize: "13px",
  fontFamily: "var(--font-sans)",
  outline: "none",
  boxSizing: "border-box",
  transition:
    "background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)",
};

function focusField(element: HTMLElement) {
  element.style.background = "var(--field-bg-hover)";
  element.style.borderColor = "var(--accent)";
  element.style.boxShadow = "0 0 0 3px var(--accent-soft)";
}

function blurField(element: HTMLElement) {
  element.style.background = "var(--field-bg)";
  element.style.borderColor = "var(--line-2)";
  element.style.boxShadow = "none";
}

export function FilterCard({ children, minColumnWidth = 160 }: FilterCardProps) {
  return (
    <div
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--line-2)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-sm)",
        padding: "16px",
        maxWidth: "100%",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minColumnWidth}px), 1fr))`,
          gap: "10px",
          alignItems: "end",
        }}
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
    <div style={{ position: "relative", minWidth: 0 }}>
      <Search
        size={14}
        strokeWidth={1.75}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--fg-3)",
          pointerEvents: "none",
        }}
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
        style={{
          ...fieldBaseStyle,
          padding: "0 12px 0 34px",
        }}
        onFocus={(event) => focusField(event.currentTarget)}
        onBlur={(event) => blurField(event.currentTarget)}
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
    <div style={{ position: "relative", minWidth: 0 }}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        style={{
          ...fieldBaseStyle,
          appearance: "none",
          WebkitAppearance: "none",
          cursor: "pointer",
          padding: "0 34px 0 12px",
        }}
        onFocus={(event) => focusField(event.currentTarget)}
        onBlur={(event) => blurField(event.currentTarget)}
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
        style={{
          position: "absolute",
          right: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      >
        <path
          d="M3 5l3 3 3-3"
          stroke="var(--fg-3)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
