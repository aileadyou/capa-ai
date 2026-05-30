import { AlertTriangle } from "lucide-react";

export function BlockerBanner({ title = "Action blocked", message }: { title?: string; message: string }) {
  return (
    <div className="rounded border border-destructive/25 bg-destructive/10 p-3 text-sm">
      <div className="flex gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <div>
          <div className="font-medium text-destructive">{title}</div>
          <p className="mt-1 text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}

