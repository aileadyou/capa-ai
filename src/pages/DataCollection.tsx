import { useState } from "react";
import { useQualityData } from "@/contexts/QualityDataContext";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CsvPreview } from "@/components/CsvPreview";
import { DataQualityReport } from "@/components/DataQualityReport";
import { DataSourceCard } from "@/components/DataSourceCard";
import { useToast } from "@/hooks/use-toast";
import { Link, Upload, X, CheckCircle2, AlertCircle, Loader2, Info } from "lucide-react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ParticleBackground } from "@/components/ParticleBackground";
import { SuccessOverlay } from "@/components/SuccessOverlay";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { useProgress } from "@/hooks/use-progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type UrlEntry = {
  id: string;
  url: string;
  status: "pending" | "downloading" | "success" | "error";
  filename?: string;
  error?: string;
};

type FileWithPreview = {
  file: File;
  preview?: {
    headers: string[];
    rows: string[][];
    totalRows: number;
  };
  qualityAnalysis?: {
    overallQuality: "good" | "fair" | "poor" | "unknown";
    issues: Array<{
      severity: "high" | "medium" | "low";
      category: string;
      column: string;
      description: string;
      suggestion: string;
      affectedRows: number | string;
    }>;
    summary: string;
  };
  isAnalyzing?: boolean;
};

const DataCollection = () => {
  const [dataSource, setDataSource] = useState<"bioactivity" | "pubchem">("bioactivity");
  const [urls, setUrls] = useState<UrlEntry[]>([]);
  const [currentUrl, setCurrentUrl] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { markStepComplete } = useProgress();
  const { addQualityData } = useQualityData();

  const addUrl = () => {
    if (!currentUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    const newEntry: UrlEntry = {
      id: Math.random().toString(36).substr(2, 9),
      url: currentUrl,
      status: "pending"
    };

    setUrls([...urls, newEntry]);
    setCurrentUrl("");
  };

  const removeUrl = (id: string) => {
    setUrls(urls.filter(u => u.id !== id));
  };

  const parseCsvFile = (file: File) => {
    return new Promise<{ headers: string[]; rows: string[][]; totalRows: number }>((resolve, reject) => {
      Papa.parse(file, {
        delimiter: ";", // Bioactivity data uses semicolon delimiter
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as string[][];
          if (data.length > 0) {
            const headers = data[0];
            const rows = data.slice(1);
            resolve({
              headers,
              rows,
              totalRows: rows.length
            });
          } else {
            reject(new Error("Empty file"));
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  };

  const runQualityCheck = async (file: File, preview: any) => {
    try {
      // Read file content for AI analysis
      const text = await file.text();
      
      const response = await fetch(
        `https://pwwbtsupjimkaxqxgwkl.supabase.co/functions/v1/ai-data-quality-check`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            csvData: text,
            filename: file.name
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Quality check failed: ${response.status}`);
      }

      const analysisResult = await response.json();
      
      // Add to quality data context
      addQualityData({
        filename: file.name,
        timestamp: new Date().toISOString(),
        analysis: analysisResult,
      });

      return analysisResult;
    } catch (error) {
      console.error('Quality check error:', error);
      toast({
        title: "AI Analysis Warning",
        description: `Could not analyze ${file.name}. You can still proceed.`,
        variant: "default",
      });
      return null;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validExtensions = dataSource === "bioactivity" 
      ? ['.csv', '.zip']
      : ['.json', '.csv'];
    
    const validFiles = files.filter(f => 
      validExtensions.some(ext => f.name.endsWith(ext))
    );

    if (validFiles.length !== files.length) {
      toast({
        title: "Warning",
        description: `Only ${validExtensions.join(', ')} files are supported for ${dataSource}`,
        variant: "destructive",
      });
    }

    // Parse CSV files for preview
    const filesWithPreviews = await Promise.all(
      validFiles.map(async (file) => {
        if (file.name.endsWith('.csv')) {
          try {
            const preview = await parseCsvFile(file);
            return { file, preview, isAnalyzing: true };
          } catch (error) {
            toast({
              title: "Parse Error",
              description: `Could not parse ${file.name}`,
              variant: "destructive",
            });
            return { file };
          }
        }
        return { file };
      })
    );

    setUploadedFiles([...uploadedFiles, ...filesWithPreviews]);

    // Run AI quality checks in background
    filesWithPreviews.forEach(async (fileWithPreview, index) => {
      if (fileWithPreview.preview) {
        const qualityAnalysis = await runQualityCheck(fileWithPreview.file, fileWithPreview.preview);
        
        setUploadedFiles(prev => {
          const newFiles = [...prev];
          const fileIndex = prev.length - filesWithPreviews.length + index;
          if (newFiles[fileIndex]) {
            newFiles[fileIndex] = {
              ...newFiles[fileIndex],
              qualityAnalysis,
              isAnalyzing: false
            };
          }
          return newFiles;
        });
      }
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    if (urls.length === 0 && uploadedFiles.length === 0) {
      toast({
        title: "No data provided",
        description: "Please add URLs or upload files to continue",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to continue",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // Create dataset record
      const { data: dataset, error: datasetError } = await supabase
        .from("datasets")
        .insert({
          name: `Dataset ${new Date().toLocaleString()}`,
          description: `${dataSource === "pubchem" ? "PubChem" : "Bioactivity"} dataset with ${uploadedFiles.length} files and ${urls.length} URLs`,
          source_type: uploadedFiles.length > 0 ? "upload" : "url",
          user_id: user.id,
          status: "pending",
          current_step: "data_collection"
        })
        .select()
        .single();

      if (datasetError) throw datasetError;

      // Upload files to storage and create file records
      for (const { file } of uploadedFiles) {
        const filePath = `${user.id}/${dataset.id}/${file.name}`;
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("datasets")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create file record
        const { error: fileError } = await supabase
          .from("dataset_files")
          .insert({
            dataset_id: dataset.id,
            filename: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            status: "completed"
          });

        if (fileError) throw fileError;
      }

      // Create URL entries
      for (const urlEntry of urls) {
        const { error: urlError } = await supabase
          .from("dataset_files")
          .insert({
            dataset_id: dataset.id,
            filename: urlEntry.url.split('/').pop() || 'downloaded_file',
            file_path: '',
            source_url: urlEntry.url,
            status: "pending"
          });

        if (urlError) throw urlError;
      }

      toast({
        title: "Success",
        description: "Files uploaded successfully",
      });

      markStepComplete("data-collection");
      setShowSuccess(true);
      
      // Navigate after overlay completes
      setTimeout(() => {
        navigate("/stream/standard-cleaning");
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ParticleBackground />
      <Sidebar />
      
      <main className="p-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-foreground">
                Data Collection
              </h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-5 w-5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>This application is compatible with ChEMBL-formatted data sources and PubChem database exports.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-muted-foreground">
              Select your data source and upload files or provide download URLs to get started
            </p>
          </div>

          {/* Data Source Selection */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <DataSourceCard
              title="ChEMBL / Bioactivity Data"
              isSelected={dataSource === "bioactivity"}
              onSelect={() => setDataSource("bioactivity")}
            >
              <p className="text-sm text-muted-foreground">
                CSV or ZIP files with bioactivity measurements, IC₅₀ values, and SMILES structures
              </p>
            </DataSourceCard>
            
            <DataSourceCard
              title="PubChem Database"
              isSelected={dataSource === "pubchem"}
              onSelect={() => setDataSource("pubchem")}
            >
              <p className="text-sm text-muted-foreground">
                JSON data exports from PubChem compound searches and screening results
              </p>
            </DataSourceCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* URL Collection */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Link className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">
                  From URL
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {dataSource === "bioactivity" 
                  ? "Paste bioactivity data download URLs to fetch data automatically"
                  : "Paste PubChem JSON export URLs (from Structure Data Query or search results)"}
              </p>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={dataSource === "bioactivity" 
                      ? "https://www.ebi.ac.uk/chembl/..." 
                      : "https://pubchem.ncbi.nlm.nih.gov/sdq/..."}
                    value={currentUrl}
                    onChange={(e) => setCurrentUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addUrl()}
                    className="flex-1"
                  />
                  <Button onClick={addUrl} size="sm">
                    Add
                  </Button>
                </div>

                {urls.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {urls.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
                      >
                        {entry.status === "success" && (
                          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                        )}
                        {entry.status === "error" && (
                          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                        )}
                        {entry.status === "pending" && (
                          <div className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span className="text-sm text-foreground truncate flex-1">
                          {entry.filename || entry.url}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUrl(entry.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* File Upload */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">
                  Upload Files
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {dataSource === "bioactivity"
                  ? "Upload CSV or ZIP files directly from your computer"
                  : "Upload JSON or CSV files from PubChem exports"}
              </p>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-foreground mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dataSource === "bioactivity" ? "CSV or ZIP files only" : "JSON or CSV files"}
                    </p>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    accept={dataSource === "bioactivity" ? ".csv,.zip" : ".json,.csv"}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {uploadedFiles.map(({ file }, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
                      >
                        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* CSV Previews */}
          {uploadedFiles.some(f => f.preview) && (
            <div className="mb-8 space-y-6">
              <h2 className="text-2xl font-bold text-foreground">
                Data Previews & AI Quality Analysis
              </h2>
              {uploadedFiles
                .filter(f => f.preview)
                .map(({ file, preview, qualityAnalysis, isAnalyzing }, index) => (
                  <div key={index} className="space-y-4">
                    <CsvPreview
                      filename={file.name}
                      headers={preview!.headers}
                      rows={preview!.rows}
                      totalRows={preview!.totalRows}
                    />
                    {isAnalyzing && (
                      <Card className="p-6">
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">
                            Analyzing data quality with AI...
                          </p>
                        </div>
                      </Card>
                    )}
                    {qualityAnalysis && !isAnalyzing && (
                      <DataQualityReport
                        filename={file.name}
                        analysis={qualityAnalysis}
                      />
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* Summary Card */}
          {(urls.length > 0 || uploadedFiles.length > 0) && (
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Data Summary
              </h3>
              <div className="flex gap-8 text-sm">
                <div>
                  <span className="text-muted-foreground">URLs:</span>{" "}
                  <span className="font-semibold text-foreground">
                    {urls.length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Files:</span>{" "}
                  <span className="font-semibold text-foreground">
                    {uploadedFiles.length}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-end">
            <Button 
              size="lg"
              onClick={handleNext}
              disabled={urls.length === 0 && uploadedFiles.length === 0 || isUploading}
            >
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUploading ? "Uploading..." : "Next: Standard Cleaning"}
            </Button>
          </div>
        </div>
      </main>
      
      {isUploading && <LoadingScreen message="Uploading files..." />}
      <SuccessOverlay 
        isVisible={showSuccess} 
        message="Data collection completed successfully!"
        onComplete={() => setShowSuccess(false)}
      />
    </div>
  );
};

export default DataCollection;
