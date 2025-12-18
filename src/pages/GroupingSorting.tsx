import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CsvPreview } from "@/components/CsvPreview";
import { Loader2, Play, Download } from "lucide-react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ParticleBackground } from "@/components/ParticleBackground";
import { SuccessOverlay } from "@/components/SuccessOverlay";
import { PipelineCompletionCelebration } from "@/components/PipelineCompletionCelebration";
import { useProgress } from "@/hooks/use-progress";
import { toast } from "@/hooks/use-toast";
import { GlossaryTerm } from "@/components/GlossaryTerm";

interface ProcessedDataRecord {
  id: string;
  dataset_id: string;
  step: string;
  row_count: number;
  created_at: string;
}

const GroupingSorting = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<ProcessedDataRecord[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [beforeDedup, setBeforeDedup] = useState<any>(null);
  const [afterDedup, setAfterDedup] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPipelineCompletion, setShowPipelineCompletion] = useState(false);
  const { markStepComplete, completedSteps, isStepComplete } = useProgress();

  useEffect(() => {
    loadSelectiveCleaningData();
  }, []);

  const loadSelectiveCleaningData = async () => {
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

      // Get datasets that have completed selective cleaning
      const { data: userDatasets, error: datasetsError } = await supabase
        .from('datasets')
        .select('id')
        .eq('user_id', user.id);

      if (datasetsError) throw datasetsError;

      const datasetIds = userDatasets?.map(d => d.id) || [];

      if (datasetIds.length === 0) {
        toast({
          title: "No Datasets Found",
          description: "Please complete selective cleaning first.",
          variant: "destructive",
        });
        return;
      }

      // Get processed data from selective cleaning step
      const { data: processedData, error: pdError } = await supabase
        .from('processed_data')
        .select('*')
        .in('dataset_id', datasetIds)
        .eq('step', 'selective_cleaning')
        .order('created_at', { ascending: false });

      if (pdError) throw pdError;

      setDatasets(processedData || []);

      // Auto-select the most recent one
      if (processedData && processedData.length > 0) {
        setSelectedDatasetId(processedData[0].id);
      }

    } catch (error) {
      console.error('Error loading datasets:', error);
      toast({
        title: "Error",
        description: "Failed to load selective cleaning data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupAndSort = async () => {
    if (!selectedDatasetId) {
      toast({
        title: "No Dataset Selected",
        description: "Please select a dataset to process.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('group-sort-data', {
        body: { processedDataId: selectedDatasetId },
      });

      if (error) throw error;

      if (data.success) {
        setBeforeDedup(data.beforeDedup);
        setAfterDedup(data.afterDedup);
        setStatistics(data.statistics);
        markStepComplete("grouping-sorting");
        
        // Check if all pipeline steps are completed
        const allSteps = ["data-collection", "standard-cleaning", "filtering", "selective-cleaning", "grouping-sorting"];
        const allPreviousComplete = allSteps.slice(0, -1).every(step => isStepComplete(step as any));
        
        if (allPreviousComplete) {
          // Show full pipeline completion celebration
          setShowPipelineCompletion(true);
        } else {
          // Show regular step completion
          setShowSuccess(true);
        }
        
        toast({
          title: "Phase 2 Complete",
          description: `Grouped and sorted ${data.statistics.after_deduplication} unique molecules.`,
        });
      }
    } catch (error) {
      console.error('Error processing grouping and sorting:', error);
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process grouping and sorting.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadGroupedSorted = () => {
    if (!beforeDedup) return;

    try {
      const csvContent = [
        beforeDedup.headers.join(','),
        ...beforeDedup.rows.map((row: any) => {
          const assayId = row['Assay ChEMBL ID'] || '';
          const smiles = row['Smiles'] || '';
          const pic50 = row['pIC50'] || '';
          return `${assayId},"${smiles}",${pic50}`;
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'D1_grouped_sorted.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "D1_grouped_sorted.csv is being downloaded.",
      });
    } catch (error) {
      console.error('Error downloading grouped sorted data:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the grouped sorted data.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadFinal = () => {
    if (!afterDedup) return;

    try {
      const csvContent = [
        afterDedup.headers.join(','),
        ...afterDedup.rows.map((row: any) => {
          const smiles = row['Smiles'] || '';
          const pic50 = row['pIC50'] || '';
          return `"${smiles}",${pic50}`;
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'D1_full_opt.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "D1_full_opt.csv is being downloaded.",
      });
    } catch (error) {
      console.error('Error downloading final data:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the final deduplicated data.",
        variant: "destructive",
      });
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
              Grouping & Sorting
            </h1>
            <p className="text-muted-foreground">
              Aggregate data and prioritize by <GlossaryTerm term="Assay ChEMBL ID" definition="A unique identifier for a biological assay in the ChEMBL database.">assay</GlossaryTerm> count
            </p>
          </div>

          {isLoading ? (
            <LoadingScreen message="Loading selective cleaning data..." />
          ) : (
            <>
              {/* Dataset Selection */}
              <Card className="p-6 mb-6">
                <CardHeader>
                  <CardTitle>Select Processed Dataset</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose a dataset that has completed Phase 1 of selective cleaning
                  </p>
                  
                  {datasets.length === 0 ? (
                    <p className="text-muted-foreground">No selective cleaning data found. Please complete Phase 1 first.</p>
                  ) : (
                    <>
                      <Select value={selectedDatasetId} onValueChange={setSelectedDatasetId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a dataset" />
                        </SelectTrigger>
                        <SelectContent>
                          {datasets.map((dataset) => (
                            <SelectItem key={dataset.id} value={dataset.id}>
                              Dataset from {new Date(dataset.created_at).toLocaleString()} ({dataset.row_count} rows)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button 
                        onClick={handleGroupAndSort}
                        disabled={isProcessing || !selectedDatasetId}
                        className="mt-4 w-full"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing Phase 2...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Run Phase 2: Group, Sort & Deduplicate
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Before Deduplication Preview */}
              {beforeDedup && (
                <Card className="p-6 mb-6">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Before Deduplication</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadGroupedSorted}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Grouped Data
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {beforeDedup.totalRows} rows (grouped by Assay and <GlossaryTerm term="SMILES" definition="Simplified Molecular Input Line Entry System - a notation for representing chemical structures as text.">SMILES</GlossaryTerm>, sorted by assay count)
                    </p>
                    
                    <CsvPreview
                      filename="Grouped & Sorted Data"
                      headers={beforeDedup.headers}
                      rows={beforeDedup.rows}
                      totalRows={beforeDedup.totalRows}
                      previewRows={100}
                    />
                  </CardContent>
                </Card>
              )}

              {/* After Deduplication Preview */}
              {afterDedup && (
                <Card className="p-6 mb-6">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>After Deduplication (Final Result)</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadFinal}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download D1_full_opt.csv
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {statistics && (
                      <div className="mb-4 p-3 bg-muted rounded-md text-sm space-y-1">
                        <p>Before deduplication: {statistics.before_deduplication} rows</p>
                        <p>After deduplication: {statistics.after_deduplication} rows</p>
                        <p className="text-primary font-medium">Duplicates removed: {statistics.duplicates_removed}</p>
                      </div>
                    )}
                    
                    <CsvPreview
                      filename="Final Deduplicated Data"
                      headers={afterDedup.headers}
                      rows={afterDedup.rows}
                      totalRows={afterDedup.totalRows}
                      previewRows={100}
                    />
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => navigate("/stream/selective-cleaning")}>
                  Back
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
      
      {isProcessing && <LoadingScreen message="Grouping and sorting data..." />}
      
      {/* Show either regular success or full pipeline completion */}
      {!showPipelineCompletion && (
        <SuccessOverlay 
          isVisible={showSuccess} 
          message="Grouping and sorting completed successfully!"
          onComplete={() => setShowSuccess(false)}
        />
      )}
      
      <PipelineCompletionCelebration
        isVisible={showPipelineCompletion}
        completedSteps={completedSteps}
        onComplete={() => setShowPipelineCompletion(false)}
      />
    </div>
  );
};

export default GroupingSorting;
