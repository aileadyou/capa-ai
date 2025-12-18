import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CsvPreview } from "@/components/CsvPreview";
import { Loader2, ExternalLink, Play, ChevronDown } from "lucide-react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ParticleBackground } from "@/components/ParticleBackground";
import { SuccessOverlay } from "@/components/SuccessOverlay";
import { useProgress } from "@/hooks/use-progress";
import { toast } from "@/hooks/use-toast";
import selectiveCleaningPipeline from "@/assets/selective-cleaning-pipeline.png";
import { GlossaryTerm } from "@/components/GlossaryTerm";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface DatasetFile {
  id: string;
  filename: string;
  file_size: number | null;
  status: string;
  created_at: string;
}

const SelectiveCleaning = () => {
  const navigate = useNavigate();
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [files, setFiles] = useState<DatasetFile[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filteredData, setFilteredData] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPipelineImage, setShowPipelineImage] = useState(false);
  const { markStepComplete } = useProgress();

  useEffect(() => {
    loadDatasetAndFiles();
  }, []);

  const loadDatasetAndFiles = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to continue.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Get the most recent dataset
      const { data: datasets, error: datasetError } = await supabase
        .from('datasets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (datasetError) throw datasetError;

      if (!datasets || datasets.length === 0) {
        toast({
          title: "No Dataset Found",
          description: "Please start from Data Collection.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      const dataset = datasets[0];
      setDatasetId(dataset.id);

      // Load all completed files for this dataset
      const { data: datasetFiles, error: filesError } = await supabase
        .from('dataset_files')
        .select('*')
        .eq('dataset_id', dataset.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: true });

      if (filesError) throw filesError;

      setFiles(datasetFiles || []);
      
      // Select all files by default
      if (datasetFiles && datasetFiles.length > 0) {
        setSelectedFileIds(datasetFiles.map(f => f.id));
      }

    } catch (error) {
      console.error('Error loading dataset:', error);
      toast({
        title: "Error",
        description: "Failed to load dataset files.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds(prev => 
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleRunSelectiveFiltering = async () => {
    if (!datasetId || selectedFileIds.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one file to process.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('filter-selective-data', {
        body: {
          datasetId,
          fileIds: selectedFileIds,
        },
      });

      if (error) throw error;

      if (data.success) {
        setFilteredData(data.preview);
        setStatistics(data.statistics);
        markStepComplete("selective-cleaning");
        setShowSuccess(true);
        
        toast({
          title: "Phase 1 Complete",
          description: `Processed ${data.statistics.rows_after_filtering} rows without duplicate removal.`,
        });
      }
    } catch (error) {
      console.error('Error running selective filtering:', error);
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process selective filtering.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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
              Selective Cleaning
            </h1>
            <p className="text-muted-foreground">
              Optional cleaning mode with full data retention for detailed analysis
            </p>
          </div>

          {isLoading ? (
            <LoadingScreen message="Loading dataset files..." />
          ) : (
            <>
              {/* Educational Section */}
              <Card className="p-6 mb-6">
                <CardHeader>
                  <CardTitle>About Selective Cleaning</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Selective cleaning preserves multiple assay measurements per molecule, enabling more robust AI/ML model training 
                    by retaining statistical diversity in the dataset.
                  </p>
                  
                  <Collapsible open={showPipelineImage} onOpenChange={setShowPipelineImage}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span>View Pipeline Diagram</span>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showPipelineImage ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      <div className="bg-muted rounded-lg p-4 animate-fade-in">
                        <img 
                          src={selectiveCleaningPipeline} 
                          alt="Selective Cleaning Pipeline" 
                          className="w-full rounded-md"
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Based on research:</span>
                    <a 
                      href="https://www.mdpi.com/1420-3049/30/14/2992" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      Study proving selective cleaning boosts AI/ML performance
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* File Selection */}
              <Card className="p-6 mb-6">
                <CardHeader>
                  <CardTitle>Select Dataset Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose files to process (multiple selections will be merged)
                  </p>
                  
                  {files.length === 0 ? (
                    <p className="text-muted-foreground">No completed files found.</p>
                  ) : (
                    <div className="space-y-2">
                      {files.map((file) => (
                        <div key={file.id} className="flex items-center gap-3 p-3 border border-border rounded-md">
                          <Checkbox
                            checked={selectedFileIds.includes(file.id)}
                            onCheckedChange={() => toggleFileSelection(file.id)}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{file.filename}</p>
                            <p className="text-xs text-muted-foreground">
                              {file.file_size ? `${(file.file_size / 1024).toFixed(2)} KB` : 'Size unknown'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button 
                    onClick={handleRunSelectiveFiltering}
                    disabled={isProcessing || selectedFileIds.length === 0}
                    className="mt-4 w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Phase 1...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Run Phase 1: Filter & Preserve Data
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Results Preview */}
              {filteredData && (
                <Card className="p-6 mb-6">
                  <CardHeader>
                    <CardTitle>Phase 1 Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {filteredData.totalRows} rows preserved (no duplicates removed)
                    </p>
                    
                    {statistics && (
                      <div className="mb-4 p-3 bg-muted rounded-md text-sm space-y-1">
                        <p>Files processed: {statistics.files_processed}</p>
                        <p>Total rows processed: {statistics.total_rows}</p>
                        <p>Rows after filtering: {statistics.rows_after_filtering}</p>
                        <p className="text-primary font-medium">{statistics.duplicates_kept}</p>
                      </div>
                    )}

                    <CsvPreview
                      filename="Selective Filtered Data"
                      headers={filteredData.headers}
                      rows={filteredData.rows}
                      totalRows={filteredData.totalRows}
                      previewRows={100}
                    />
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => navigate("/stream/filtering")}>
                  Back
                </Button>
                <Button 
                  onClick={() => navigate("/stream/grouping-sorting")}
                  disabled={!filteredData}
                >
                  Next: Phase 2 - Grouping & Sorting
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
      
      {isProcessing && <LoadingScreen message="Processing selective cleaning..." />}
      <SuccessOverlay 
        isVisible={showSuccess} 
        message="Selective cleaning phase 1 completed successfully!"
        onComplete={() => setShowSuccess(false)}
      />
    </div>
  );
};

export default SelectiveCleaning;
