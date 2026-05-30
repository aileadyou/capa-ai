import { Progress } from "@/components/ui/progress";

export function ScoreBar({ value, label, max = 25 }: { value: number; label: string; max?: number }) {
  const percent = Math.round((value / max) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value}/{max}
        </span>
      </div>
      <Progress value={percent} className="h-2" />
    </div>
  );
}

