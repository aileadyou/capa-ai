import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Loader2, Download } from "lucide-react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ParticleBackground } from "@/components/ParticleBackground";
import { SuccessOverlay } from "@/components/SuccessOverlay";
import { useProgress } from "@/hooks/use-progress";
import { CsvPreview } from "@/components/CsvPreview";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlossaryTerm } from "@/components/GlossaryTerm";

const Filtering = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { markStepComplete } = useProgress();

  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(searchParams.get("datasetId") || "");
  const [minMolecularWeight, setMinMolecularWeight] = useState(100);
  const [maxMolecularWeight, setMaxMolecularWeight] = useState(750);
  const [normalizeStandardValue, setNormalizeStandardValue] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filteredData, setFilteredData] = useState<any>(null);
  const [cleanedData, setCleanedData] = useState<any>(null);
  const [isLoadingCleanedData, setIsLoadingCleanedData] = useState(false);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch available datasets
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const { data, error } = await supabase
          .from("datasets")
          .select("id, name, created_at")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setDatasets(data || []);

        // If no dataset selected but URL has one, use it
        if (!selectedDatasetId && searchParams.get("datasetId")) {
          setSelectedDatasetId(searchParams.get("datasetId")!);
        }
      } catch (error: any) {
        console.error("Error fetching datasets:", error);
        toast({
          title: "Error Loading Datasets",
          description: error.message || "Failed to load datasets",
          variant: "destructive",
        });
      } finally {
        setIsLoadingDatasets(false);
      }
    };

    fetchDatasets();
  }, []);

  // Fetch cleaned data when dataset is selected
  useEffect(() => {
    if (!selectedDatasetId) {
      setCleanedData(null);
      return;
    }

    const fetchCleanedData = async () => {
      setIsLoadingCleanedData(true);
      try {
        const { data, error } = await supabase
          .from("processed_data")
          .select("*")
          .eq("dataset_id", selectedDatasetId)
          .eq("step", "standard_cleaning")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;

        if (!data) {
          toast({
            title: "No Cleaned Data Found",
            description: "Please complete Standard Cleaning for this dataset first.",
            variant: "destructive",
          });
          setCleanedData(null);
          return;
        }

        setCleanedData(data);
        setFilteredData(null); // Reset filtered data when dataset changes
      } catch (error: any) {
        console.error("Error fetching cleaned data:", error);
        toast({
          title: "Error Loading Data",
          description: error.message || "Failed to load cleaned data",
          variant: "destructive",
        });
        setCleanedData(null);
      } finally {
        setIsLoadingCleanedData(false);
      }
    };

    fetchCleanedData();
  }, [selectedDatasetId, toast]);

  const handleDatasetChange = (datasetId: string) => {
    setSelectedDatasetId(datasetId);
    setSearchParams({ datasetId });
  };

  const handleDownloadFiltered = () => {
    if (!filteredData) return;

    // Convert data to CSV format
    const headers = ['Assay ChEMBL ID', 'Molecule ChEMBL ID', 'Smiles', 'Standard Value'];
    const csvRows = [headers.join(',')];

    filteredData.preview.forEach((row: any) => {
      const values = [
        row['Assay ChEMBL ID'],
        row['Molecule ChEMBL ID'],
        `"${row['Smiles']}"`, // Quote SMILES to handle commas
        row['Standard Value'].toFixed(4),
      ];
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'D1_filtered.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download Complete",
      description: "D1_filtered.csv has been downloaded successfully.",
    });
  };

  const handleRunFiltering = async () => {
    if (!selectedDatasetId) {
      toast({
        title: "No Dataset Selected",
        description: "Please select a dataset first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("filter-data", {
        body: {
          datasetId: selectedDatasetId,
          config: {
            minMolecularWeight,
            maxMolecularWeight,
            normalizeStandardValue,
          },
        },
      });

      if (error) throw error;

      setFilteredData(data);
      markStepComplete("filtering");
      setShowSuccess(true);
      
      toast({
        title: "Filtering Complete",
        description: `Successfully filtered data. ${data.row_count} rows after filtering.`,
      });
    } catch (error: any) {
      console.error("Error filtering data:", error);
      toast({
        title: "Filtering Failed",
        description: error.message || "An error occurred during filtering",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoadingDatasets) {
    return (
      <div className="min-h-screen bg-background">
        <ParticleBackground />
        <Sidebar />
        <main className="p-8 relative z-10">
          <div className="max-w-5xl mx-auto flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ParticleBackground />
      <Sidebar />
      
      <main className="p-8 relative z-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Filtering
            </h1>
            <p className="text-muted-foreground">
              Apply optional filters for data quality
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Select Dataset</CardTitle>
              <CardDescription>
                Choose a dataset to apply filtering
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Dataset</Label>
                <Select value={selectedDatasetId} onValueChange={handleDatasetChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a dataset..." />
                  </SelectTrigger>
                  <SelectContent>
                    {datasets.map((dataset) => (
                      <SelectItem key={dataset.id} value={dataset.id}>
                        {dataset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {isLoadingCleanedData && selectedDatasetId && (
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              </CardContent>
            </Card>
          )}

          {cleanedData && (
            <Card>
              <CardHeader>
                <CardTitle>Source Data (Standard Cleaning)</CardTitle>
                <CardDescription>
                  {cleanedData.row_count} rows from cleaned dataset
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CsvPreview
                  filename="Cleaned Data (D1_std.csv)"
                  headers={cleanedData.columns || ['Molecule ChEMBL ID', 'Smiles', 'Standard Value']}
                  rows={(cleanedData.sample_data || []).slice(0, 10).map((row: any) => [
                    row['Molecule ChEMBL ID'],
                    row['Smiles'],
                    typeof row['Standard Value'] === 'number' ? row['Standard Value'].toFixed(4) : row['Standard Value'],
                  ])}
                  totalRows={cleanedData.row_count}
                  previewRows={10}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Filter Configuration</CardTitle>
              <CardDescription>
                Customize filtering parameters for your dataset
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label><GlossaryTerm term="Molecular Weight" definition="The sum of atomic weights of all atoms in a molecule, measured in Daltons (Da).">Molecular Weight</GlossaryTerm> Range</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-muted-foreground w-12">{minMolecularWeight}</span>
                    <Slider
                      value={[minMolecularWeight]}
                      onValueChange={(value) => setMinMolecularWeight(value[0])}
                      min={50}
                      max={500}
                      step={10}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-muted-foreground w-12">{maxMolecularWeight}</span>
                    <Slider
                      value={[maxMolecularWeight]}
                      onValueChange={(value) => setMaxMolecularWeight(value[0])}
                      min={500}
                      max={1000}
                      step={10}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Filter molecules between {minMolecularWeight} and {maxMolecularWeight} Da
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="normalize">Normalize Standard Value</Label>
                    <p className="text-xs text-muted-foreground">
                      Convert <GlossaryTerm term="IC50" definition="Half-maximal inhibitory concentration - the concentration required to inhibit a biological process by 50%.">IC50</GlossaryTerm> (nM) to <GlossaryTerm term="pIC50" definition="The negative logarithm of IC50 in molar units. Higher values indicate greater potency.">pIC50</GlossaryTerm> (-log10 of molar value)
                    </p>
                  </div>
                  <Switch
                    id="normalize"
                    checked={normalizeStandardValue}
                    onCheckedChange={setNormalizeStandardValue}
                  />
                </div>
              </div>

              <Button 
                onClick={handleRunFiltering} 
                disabled={isProcessing || !cleanedData}
                className="w-full"
              >
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isProcessing ? "Filtering..." : "Run Filtering"}
              </Button>
              {!cleanedData && selectedDatasetId && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  No cleaned data available. Please complete Standard Cleaning first.
                </p>
              )}
            </CardContent>
          </Card>

          {filteredData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Filtered Data Preview</CardTitle>
                    <CardDescription>
                      {filteredData.row_count} rows after filtering and deduplication
                    </CardDescription>
                  </div>
                  <Button onClick={handleDownloadFiltered} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download D1_filtered.csv
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Rows</p>
                      <p className="text-lg font-semibold">{filteredData.statistics.total_rows}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Unique Rows</p>
                      <p className="text-lg font-semibold">{filteredData.statistics.unique_rows}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duplicates Removed</p>
                      <p className="text-lg font-semibold">{filteredData.statistics.duplicates_removed}</p>
                    </div>
                  </div>

                  <CsvPreview
                    filename="Filtered Data (df_main_2)"
                    headers={['Assay ChEMBL ID', 'Molecule ChEMBL ID', 'Smiles', 'Standard Value']}
                    rows={filteredData.preview.map((row: any) => [
                      row['Assay ChEMBL ID'],
                      row['Molecule ChEMBL ID'],
                      row['Smiles'],
                      row['Standard Value'].toFixed(4),
                    ])}
                    totalRows={filteredData.row_count}
                    previewRows={10}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => navigate(selectedDatasetId ? `/stream/standard-cleaning?datasetId=${selectedDatasetId}` : '/stream/standard-cleaning')}
              disabled={!selectedDatasetId}
            >
              Back
            </Button>
            <Button 
              onClick={() => navigate(`/stream/selective-cleaning?datasetId=${selectedDatasetId}`)}
              disabled={!filteredData || !selectedDatasetId}
            >
              Next: Selective Cleaning
            </Button>
          </div>
        </div>
      </main>
      
      {isProcessing && <LoadingScreen message="Applying filters..." />}
      <SuccessOverlay 
        isVisible={showSuccess} 
        message="Filtering completed successfully!"
        onComplete={() => setShowSuccess(false)}
      />
    </div>
  );
};

export default Filtering;
