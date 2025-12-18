import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CsvPreview } from "@/components/CsvPreview";
import { Loader2, Download } from "lucide-react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ParticleBackground } from "@/components/ParticleBackground";
import { SuccessOverlay } from "@/components/SuccessOverlay";
import { useProgress } from "@/hooks/use-progress";
import { toast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { GlossaryTerm } from "@/components/GlossaryTerm";
import * as XLSX from "xlsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const StandardCleaning = () => {
  const navigate = useNavigate();
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [mergedData, setMergedData] = useState<{ headers: string[], rows: any[][] } | null>(null);
  const [cleanedData, setCleanedData] = useState<{ headers: string[], rows: any[][] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [exportFormat, setExportFormat] = useState<string>("csv");
  const { markStepComplete } = useProgress();

  useEffect(() => {
    fetchAndMergeData();
  }, []);

  const fetchAndMergeData = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Please log in", variant: "destructive" });
        navigate("/auth");
        return;
      }

      // Get the latest dataset for this user
      const { data: datasets, error: datasetError } = await supabase
        .from('datasets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (datasetError) throw datasetError;
      if (!datasets || datasets.length === 0) {
        toast({ title: "No dataset found", variant: "destructive" });
        navigate("/stream/data-collection");
        return;
      }

      const dataset = datasets[0];
      setDatasetId(dataset.id);

      // Get all files for this dataset
      const { data: files, error: filesError } = await supabase
        .from('dataset_files')
        .select('*')
        .eq('dataset_id', dataset.id)
        .eq('status', 'completed');

      if (filesError) throw filesError;
      if (!files || files.length === 0) {
        toast({ title: "No files found", variant: "destructive" });
        return;
      }

      // Download and merge all files
      const allRows: any[][] = [];
      let headers: string[] = [];

      for (const file of files) {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('datasets')
          .download(file.file_path);

        if (downloadError) {
          console.error(`Error downloading ${file.filename}:`, downloadError);
          continue;
        }

        const csvText = await fileData.text();
        const parsed = Papa.parse(csvText, {
          header: false,
          delimiter: ';',
          skipEmptyLines: true,
        });

        if (parsed.data && parsed.data.length > 0) {
          const fileHeaders = parsed.data[0] as string[];
          if (headers.length === 0) {
            headers = fileHeaders;
          }
          
          // Add all rows except header
          for (let i = 1; i < parsed.data.length; i++) {
            allRows.push(parsed.data[i] as any[]);
          }
        }
      }

      setMergedData({
        headers,
        rows: allRows,
      });

      toast({
        title: "Files merged successfully",
        description: `${allRows.length} total rows from ${files.length} files`,
      });
    } catch (error) {
      console.error('Error merging data:', error);
      toast({
        title: "Error merging files",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCleaned = () => {
    if (!cleanedData) return;

    const headers = ['Molecule ChEMBL ID', 'Smiles', 'pIC50'];
    
    if (exportFormat === "xlsx") {
      // Create Excel workbook
      const worksheetData = [headers, ...cleanedData.rows];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Cleaned Data");
      
      XLSX.writeFile(workbook, 'D1_std.xlsx');
      
      toast({
        title: "Download Complete",
        description: "D1_std.xlsx has been downloaded successfully.",
      });
    } else if (exportFormat === "json") {
      // JSON format - array of objects
      const jsonData = cleanedData.rows.map((row: any[]) => ({
        "Molecule ChEMBL ID": row[0],
        "Smiles": row[1],
        "pIC50": row[2],
      }));

      const jsonContent = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', 'D1_std.json');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Complete",
        description: "D1_std.json has been downloaded successfully.",
      });
    } else {
      // CSV format
      const csvRows = [headers.join(',')];

      cleanedData.rows.forEach((row: any[]) => {
        const values = [
          row[0],
          `"${row[1]}"`,
          row[2],
        ];
        csvRows.push(values.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', 'D1_std.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Complete",
        description: "D1_std.csv has been downloaded successfully.",
      });
    }
  };

  const handleCleanData = async () => {
    if (!datasetId) {
      toast({ title: "No dataset selected", variant: "destructive" });
      return;
    }

    try {
      setIsCleaning(true);

      const { data, error } = await supabase.functions.invoke('clean-standard-data', {
        body: { datasetId },
      });

      if (error) throw error;

      // Format cleaned data for display
      const preview = data.preview || [];
      const headers = ['Molecule ChEMBL ID', 'Smiles', 'pIC50'];
      const rows = preview.map((row: any) => [
        row['Molecule ChEMBL ID'],
        row['Smiles'],
        row['Standard Value'].toFixed(4),
      ]);

      setCleanedData({ headers, rows });
      setStatistics(data.statistics);

      markStepComplete("standard-cleaning");
      setShowSuccess(true);

      toast({
        title: "Data cleaned successfully",
        description: `${data.row_count} unique rows after cleaning`,
      });
    } catch (error) {
      console.error('Error cleaning data:', error);
      toast({
        title: "Error cleaning data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ParticleBackground />
      <Sidebar />
      
      <main className="p-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Standard Cleaning
            </h1>
            <p className="text-muted-foreground">
              Remove missing values and normalize units
            </p>
          </div>

          <Card className="p-8 mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Processing Pipeline
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>✓ Read data using semicolon delimiter</p>
              <p>✓ Remove rows where <GlossaryTerm term="SMILES" definition="Simplified Molecular Input Line Entry System - a notation for representing chemical structures as text.">SMILES</GlossaryTerm> or Standard Value is missing</p>
              <p>✓ Retain only: Molecule ChEMBL ID, SMILES, Standard Value</p>
              <p>✓ Convert <GlossaryTerm term="IC50" definition="Half-maximal inhibitory concentration - the concentration required to inhibit a biological process by 50%.">IC₅₀</GlossaryTerm> (nM) to molar units and calculate <GlossaryTerm term="pIC50" definition="The negative logarithm of IC50 in molar units. Higher values indicate greater potency.">pIC₅₀</GlossaryTerm></p>
              <p>✓ Concatenate data from all files</p>
              <p>✓ Drop duplicate rows based on SMILES column</p>
            </div>
          </Card>

          {isLoading ? (
            <LoadingScreen message="Loading files..." />
          ) : mergedData ? (
            <>
              <Card className="p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Merged Data Preview
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {mergedData.rows.length} total rows before cleaning
                    </p>
                  </div>
                  <Button 
                    onClick={handleCleanData} 
                    disabled={isCleaning}
                    size="lg"
                  >
                    {isCleaning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cleaning...
                      </>
                    ) : (
                      "Run Standard Cleaning"
                    )}
                  </Button>
                </div>
                <CsvPreview
                  filename="Merged Data"
                  headers={mergedData.headers}
                  rows={mergedData.rows}
                  totalRows={mergedData.rows.length}
                  previewRows={10}
                />
              </Card>

              {cleanedData && (
                <Card className="p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">
                        Cleaned Data Preview
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {cleanedData.rows.length} unique rows after cleaning
                      </p>
                      {statistics && (
                        <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                          <p>Total rows processed: {statistics.total_rows}</p>
                          <p>Duplicates removed: {statistics.duplicates_removed}</p>
                          <p>Final unique rows: {statistics.unique_rows}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Select value={exportFormat} onValueChange={setExportFormat}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV (.csv)</SelectItem>
                          <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                          <SelectItem value="json">JSON (.json)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleDownloadCleaned} variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <CsvPreview
                    filename="Cleaned Data (D1_std.csv)"
                    headers={cleanedData.headers}
                    rows={cleanedData.rows}
                    totalRows={cleanedData.rows.length}
                    previewRows={10}
                  />
                </Card>
              )}
            </>
          ) : null}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => navigate("/stream/data-collection")}>
              Back
            </Button>
            <Button onClick={() => navigate("/stream/filtering")}>
              Next: Filtering
            </Button>
          </div>
        </div>
      </main>
      
      {isCleaning && <LoadingScreen message="Cleaning data..." />}
      <SuccessOverlay 
        isVisible={showSuccess} 
        message="Standard cleaning completed successfully!"
        onComplete={() => setShowSuccess(false)}
      />
    </div>
  );
};

export default StandardCleaning;
