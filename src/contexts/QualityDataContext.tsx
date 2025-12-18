import { createContext, useContext, useState, ReactNode } from "react";

interface DataQualityIssue {
  severity: "high" | "medium" | "low";
  category: string;
  column: string;
  description: string;
  suggestion: string;
  affectedRows: number | string;
}

interface DataQualityAnalysis {
  overallQuality: "good" | "fair" | "poor" | "unknown";
  issues: DataQualityIssue[];
  summary: string;
}

interface FileQualityData {
  filename: string;
  timestamp: string;
  analysis: DataQualityAnalysis;
}

interface QualityDataContextType {
  qualityData: FileQualityData[];
  addQualityData: (data: FileQualityData) => void;
  clearQualityData: () => void;
}

const QualityDataContext = createContext<QualityDataContextType | undefined>(undefined);

export const QualityDataProvider = ({ children }: { children: ReactNode }) => {
  const [qualityData, setQualityData] = useState<FileQualityData[]>([]);

  const addQualityData = (data: FileQualityData) => {
    setQualityData((prev) => [...prev, data]);
  };

  const clearQualityData = () => {
    setQualityData([]);
  };

  return (
    <QualityDataContext.Provider value={{ qualityData, addQualityData, clearQualityData }}>
      {children}
    </QualityDataContext.Provider>
  );
};

export const useQualityData = () => {
  const context = useContext(QualityDataContext);
  if (context === undefined) {
    throw new Error("useQualityData must be used within a QualityDataProvider");
  }
  return context;
};
