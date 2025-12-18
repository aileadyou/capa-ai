import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Papa from "https://esm.sh/papaparse@5.4.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CsvRow {
  'Assay ChEMBL ID': string;
  'Molecule ChEMBL ID': string;
  'Smiles': string;
  'Standard Relation': string;
  'Standard Value': string;
  'Molecular Weight': string;
}

interface FilteredRow {
  'Assay ChEMBL ID': string;
  'Molecule ChEMBL ID': string;
  'Smiles': string;
  'Standard Value': number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { datasetId, fileIds } = await req.json();
    
    console.log('Starting selective filtering for dataset:', datasetId);
    console.log('Selected file IDs:', fileIds);

    // Fetch selected files
    const { data: files, error: filesError } = await supabaseClient
      .from('dataset_files')
      .select('*')
      .eq('dataset_id', datasetId)
      .in('id', fileIds)
      .eq('status', 'completed');

    if (filesError) {
      console.error('Error fetching files:', filesError);
      throw filesError;
    }

    if (!files || files.length === 0) {
      throw new Error('No completed files found for selected IDs');
    }

    console.log(`Processing ${files.length} files`);

    let allFilteredData: FilteredRow[] = [];
    let totalRowsProcessed = 0;
    let rowsAfterFiltering = 0;

    // Process each file
    for (const file of files) {
      console.log(`Processing file: ${file.filename}`);
      
      // Download file from storage
      const { data: fileData, error: downloadError } = await supabaseClient
        .storage
        .from('datasets')
        .download(file.file_path);

      if (downloadError) {
        console.error(`Error downloading file ${file.filename}:`, downloadError);
        continue;
      }

      const csvText = await fileData.text();
      
      // Parse CSV with semicolon delimiter
      const parseResult = Papa.parse<CsvRow>(csvText, {
        header: true,
        delimiter: ';',
        skipEmptyLines: true,
      });

      console.log(`Parsed ${parseResult.data.length} rows from ${file.filename}`);
      totalRowsProcessed += parseResult.data.length;

      // Filter and process data
      const filteredRows = parseResult.data
        .filter((row) => {
          // Check required fields
          if (!row['Smiles'] || !row['Standard Value'] || !row['Standard Relation']) {
            return false;
          }

          // Filter Standard Relation to only "="
          if (!row['Standard Relation'].includes('=')) {
            return false;
          }

          // Filter Molecular Weight between 100 and 750
          const molecularWeight = parseFloat(row['Molecular Weight']);
          if (isNaN(molecularWeight) || molecularWeight <= 100 || molecularWeight >= 750) {
            return false;
          }

          return true;
        })
        .map((row): FilteredRow => {
          // Convert IC50 from nM to M
          const standardValueNm = parseFloat(row['Standard Value']);
          const standardValueM = standardValueNm * 1e-9;
          
          // Convert to pIC50: -log10(M)
          const pIC50 = -Math.log10(standardValueM);

          return {
            'Assay ChEMBL ID': row['Assay ChEMBL ID'],
            'Molecule ChEMBL ID': row['Molecule ChEMBL ID'],
            'Smiles': row['Smiles'],
            'Standard Value': Math.round(pIC50 * 100) / 100, // Round to 2 decimal places
          };
        });

      console.log(`Filtered to ${filteredRows.length} rows from ${file.filename}`);
      rowsAfterFiltering += filteredRows.length;
      
      // NO DUPLICATE REMOVAL - Keep all rows for selective cleaning
      allFilteredData = allFilteredData.concat(filteredRows);
    }

    console.log(`Total filtered data rows: ${allFilteredData.length}`);

    // Save filtered data to storage as CSV
    const csvContent = [
      'Assay ChEMBL ID,Molecule ChEMBL ID,Smiles,Standard Value',
      ...allFilteredData.map(row => 
        `${row['Assay ChEMBL ID']},${row['Molecule ChEMBL ID']},"${row['Smiles']}",${row['Standard Value'].toFixed(3)}`
      )
    ].join('\n');

    const fileName = `selective_filtered_${Date.now()}.csv`;
    const filePath = `${datasetId}/${fileName}`;

    const { error: uploadError } = await supabaseClient
      .storage
      .from('datasets')
      .upload(filePath, csvContent, {
        contentType: 'text/csv',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading filtered data:', uploadError);
      throw uploadError;
    }

    console.log(`Saved filtered data to storage: ${filePath}`);

    // Store processed data
    const sampleData = allFilteredData.slice(0, 10);
    const statistics = {
      total_rows: totalRowsProcessed,
      rows_after_filtering: rowsAfterFiltering,
      files_processed: files.length,
      duplicates_kept: 'All rows preserved for selective cleaning',
    };

    const { data: processedData, error: insertError } = await supabaseClient
      .from('processed_data')
      .insert({
        dataset_id: datasetId,
        step: 'selective_cleaning',
        file_path: filePath,
        row_count: allFilteredData.length,
        column_count: 4,
        columns: ['Assay ChEMBL ID', 'Molecule ChEMBL ID', 'Smiles', 'Standard Value'],
        sample_data: sampleData,
        statistics,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting processed data:', insertError);
      throw insertError;
    }

    // Update dataset current_step
    await supabaseClient
      .from('datasets')
      .update({ current_step: 'selective_cleaning' })
      .eq('id', datasetId);

    // Prepare preview data
    const previewData = {
      headers: ['Assay ChEMBL ID', 'Molecule ChEMBL ID', 'Smiles', 'Standard Value'],
      rows: allFilteredData.slice(0, 100).map(row => [
        row['Assay ChEMBL ID'],
        row['Molecule ChEMBL ID'],
        row['Smiles'],
        row['Standard Value'].toFixed(2),
      ]),
      totalRows: allFilteredData.length,
    };

    return new Response(
      JSON.stringify({
        success: true,
        processedDataId: processedData.id,
        statistics,
        preview: previewData,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in filter-selective-data function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
