import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div
      className="surface-card flex min-h-[220px] flex-col items-center justify-center p-8 text-center"
      role="status"
      aria-live="polite"
    >
      <div
        className="flex h-10 w-10 items-center justify-center"
        style={{
          background: "var(--bg-3)",
          border: "1px solid var(--line-2)",
          borderRadius: "var(--r-sm)",
          color: "var(--fg-3)",
        }}
      >
        <Inbox className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold" style={{ color: "var(--fg-1)" }}>{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6" style={{ color: "var(--fg-2)" }}>{description}</p>
      {actionLabel && onAction && (
        <Button className="btn-brand mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
