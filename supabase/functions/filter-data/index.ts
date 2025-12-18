import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0'
import Papa from 'https://esm.sh/papaparse@5.5.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CsvRow {
  'Assay ChEMBL ID'?: string
  'Molecule ChEMBL ID'?: string
  'Smiles'?: string
  'Standard Relation'?: string
  'Standard Value'?: string
  'Molecular Weight'?: string
  [key: string]: any
}

interface FilteredRow {
  'Assay ChEMBL ID': string
  'Molecule ChEMBL ID': string
  'Smiles': string
  'Standard Value': number
}

interface FilterConfig {
  minMolecularWeight: number
  maxMolecularWeight: number
  normalizeStandardValue: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { datasetId, config } = await req.json()
    const filterConfig: FilterConfig = config || {
      minMolecularWeight: 100,
      maxMolecularWeight: 750,
      normalizeStandardValue: true,
    }

    console.log('Processing dataset:', datasetId, 'with config:', filterConfig)

    // Fetch all files for this dataset to get original data with Molecular Weight
    const { data: files, error: filesError } = await supabaseClient
      .from('dataset_files')
      .select('*')
      .eq('dataset_id', datasetId)
      .eq('status', 'completed')

    if (filesError) throw filesError
    if (!files || files.length === 0) {
      throw new Error('No files found for this dataset')
    }

    console.log(`Found ${files.length} files to process`)

    // Process each file for filtering
    const allData: FilteredRow[] = []
    
    for (const file of files) {
      console.log(`Processing file: ${file.filename}`)
      
      // Download file from storage
      const { data: fileData, error: downloadError } = await supabaseClient
        .storage
        .from('datasets')
        .download(file.file_path)

      if (downloadError) {
        console.error(`Error downloading ${file.filename}:`, downloadError)
        continue
      }

      // Parse CSV
      const csvText = await fileData.text()
      const parsed = Papa.parse<CsvRow>(csvText, {
        header: true,
        delimiter: ';',
        skipEmptyLines: true,
      })

      console.log(`Parsed ${parsed.data.length} rows from ${file.filename}`)

      // Process each row
      for (const row of parsed.data) {
        // Skip rows where required fields are missing
        if (!row['Smiles'] || !row['Standard Value'] || !row['Standard Relation'] || 
            !row['Molecule ChEMBL ID'] || !row['Assay ChEMBL ID'] || !row['Molecular Weight']) {
          continue
        }

        // Filter by Standard Relation (only "=")
        if (!row['Standard Relation'].includes('=')) {
          continue
        }

        const molecularWeight = parseFloat(row['Molecular Weight'])
        if (isNaN(molecularWeight)) continue

        // Filter by Molecular Weight range
        if (molecularWeight <= filterConfig.minMolecularWeight || 
            molecularWeight >= filterConfig.maxMolecularWeight) {
          continue
        }

        let standardValue = parseFloat(row['Standard Value'])
        if (isNaN(standardValue)) continue

        // Normalize Standard Value if enabled (IC50 to pIC50)
        if (filterConfig.normalizeStandardValue) {
          // Convert IC50 from nM to M (multiply by 10^-9)
          const molarValue = standardValue * 1e-9
          // Convert to pIC50 (-log10 of molar value)
          standardValue = -Math.log10(molarValue)
        }

        allData.push({
          'Assay ChEMBL ID': row['Assay ChEMBL ID'],
          'Molecule ChEMBL ID': row['Molecule ChEMBL ID'],
          'Smiles': row['Smiles'],
          'Standard Value': standardValue,
        })
      }
    }

    console.log(`Total rows after filtering: ${allData.length}`)

    // Remove duplicates based on Smiles column
    const uniqueData = Array.from(
      new Map(allData.map(item => [item['Smiles'], item])).values()
    )

    console.log(`Rows after removing duplicates: ${uniqueData.length}`)

    // Store filtered data in processed_data table
    const { data: processedData, error: processedError } = await supabaseClient
      .from('processed_data')
      .insert({
        dataset_id: datasetId,
        step: 'filtering',
        row_count: uniqueData.length,
        column_count: 4,
        columns: ['Assay ChEMBL ID', 'Molecule ChEMBL ID', 'Smiles', 'Standard Value'],
        sample_data: uniqueData.slice(0, 100),
        statistics: {
          total_rows: allData.length,
          unique_rows: uniqueData.length,
          duplicates_removed: allData.length - uniqueData.length,
          filter_config: filterConfig,
        },
      })
      .select()
      .single()

    if (processedError) throw processedError

    // Update dataset status
    await supabaseClient
      .from('datasets')
      .update({
        current_step: 'filtering',
      })
      .eq('id', datasetId)

    return new Response(
      JSON.stringify({
        success: true,
        processed_data_id: processedData.id,
        row_count: uniqueData.length,
        statistics: {
          total_rows: allData.length,
          unique_rows: uniqueData.length,
          duplicates_removed: allData.length - uniqueData.length,
          filter_config: filterConfig,
        },
        preview: uniqueData.slice(0, 10),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in filter-data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
