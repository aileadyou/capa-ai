import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";

interface NovaAssistPanelProps {
  /** Headline for the collapsed call-to-action */
  title?: string;
  /** One-line reassurance shown under the title */
  description?: string;
  /** The Nova suggestion content, revealed when expanded */
  children: ReactNode;
  /** Start expanded (defaults to collapsed so the user writes first) */
  defaultOpen?: boolean;
}

/**
 * Wraps a Nova suggestion in an opt-in, collapsed-by-default panel placed
 * BELOW the user's own input and quality signals. Reframes the AI from
 * "answers everything for you" to "here if you'd like a hand".
 */
export function NovaAssistPanel({
  title = "Stuck? Let Nova help",
  description,
  children,
  defaultOpen = false,
}: NovaAssistPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-[var(--r-md)] border border-dashed border-[var(--accent-line)] bg-primary/[0.03]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-2.5 border-0 bg-transparent px-4 py-3 text-left"
      >
        <Sparkles size={15} className="shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="m-0 font-sans text-[13px] font-semibold text-foreground">
            {title}
          </p>
          {description && (
            <p className="mb-0 mt-0.5 font-sans text-[11px] leading-[1.5] text-foreground-tertiary">
              {description}
            </p>
          )}
        </div>
        {open ? (
          <ChevronDown size={16} className="shrink-0 text-foreground-tertiary" />
        ) : (
          <ChevronRight size={16} className="shrink-0 text-foreground-tertiary" />
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
