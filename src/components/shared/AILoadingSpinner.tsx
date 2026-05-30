import { Sparkles } from "lucide-react";

export function AILoadingSpinner({ label = "Nova is analyzing..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 rounded border border-nova/20 bg-nova/5 px-3 py-2 text-sm text-nova">
      <Sparkles className="h-4 w-4 animate-pulse" />
      <span>{label}</span>
      <span className="flex gap-0.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-nova [animation-delay:-0.2s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-nova [animation-delay:-0.1s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-nova" />
      </span>
    </div>
  );
}

