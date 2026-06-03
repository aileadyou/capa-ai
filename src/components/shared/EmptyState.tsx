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
        className="flex h-10 w-10 items-center justify-center rounded-[var(--r-sm)] border border-[var(--line-2)] bg-elevated text-foreground-tertiary"
      >
        <Inbox className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-foreground-secondary">{description}</p>
      {actionLabel && onAction && (
        <Button className="btn-brand mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
