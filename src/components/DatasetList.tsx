import { BarChart3 } from "lucide-react";

interface Dataset {
  name: string;
}

interface DatasetListProps {
  datasets: Dataset[];
}

export const DatasetList = ({ datasets }: DatasetListProps) => {
  return (
    <div className="space-y-0">
      {datasets.map((dataset, index) => (
        <div key={index}>
          {index > 0 && <div className="h-px bg-border-light" />}
          <div className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              className="h-6 w-6 rounded border-border-light"
            />
            <span className="text-base font-light text-muted-foreground">
              {dataset.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export const DashboardDataset = () => {
  return (
    <div className="rounded-[5px] border border-border bg-card p-3">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
        <span className="text-base font-light text-muted-foreground">
          20240801_all_assay_MDM2...
        </span>
      </div>
    </div>
  );
};
