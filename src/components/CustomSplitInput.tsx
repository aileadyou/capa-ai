import { Input } from "@/components/ui/input";

interface CustomSplitInputProps {
  isSelected: boolean;
  trainPercent: number;
  validationPercent: number;
  testPercent: number;
  onSelect: () => void;
  onTrainChange: (value: number) => void;
  onValidationChange: (value: number) => void;
  onTestChange: (value: number) => void;
}

export const CustomSplitInput = ({
  isSelected,
  trainPercent,
  validationPercent,
  testPercent,
  onSelect,
  onTrainChange,
  onValidationChange,
  onTestChange,
}: CustomSplitInputProps) => {
  return (
    <div className="flex items-center gap-4">
      <button 
        onClick={onSelect}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-border cursor-pointer"
      >
        {isSelected && (
          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
        )}
      </button>
      <span className="text-xs font-bold text-foreground">Custom Splitting</span>
      
      <div className="ml-auto flex items-center gap-6">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-foreground">Training</label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={trainPercent}
              onChange={(e) => onTrainChange(Number(e.target.value))}
              className="h-[21px] w-11 rounded bg-muted text-xs px-1 py-0"
              min="0"
              max="100"
            />
            <span className="text-xs text-foreground">%</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-xs text-foreground">Validation</label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={validationPercent}
              onChange={(e) => onValidationChange(Number(e.target.value))}
              className="h-[21px] w-11 rounded bg-muted text-xs px-1 py-0"
              min="0"
              max="100"
            />
            <span className="text-xs text-foreground">%</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-xs text-foreground">Testing</label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={testPercent}
              onChange={(e) => onTestChange(Number(e.target.value))}
              className="h-[21px] w-11 rounded bg-muted text-xs px-1 py-0"
              min="0"
              max="100"
            />
            <span className="text-xs text-foreground">%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
