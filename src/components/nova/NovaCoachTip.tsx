import { Sparkles } from "lucide-react";

export function NovaCoachTip({ title = "Nova Coach Tip", children }: { title?: string; children: string }) {
  return (
    <div className="rounded border border-nova/20 bg-nova/5 p-3 text-sm">
      <div className="mb-1 flex items-center gap-2 font-medium text-nova">
        <Sparkles className="h-4 w-4" />
        {title}
      </div>
      <p className="leading-6 text-muted-foreground">{children}</p>
    </div>
  );
}

