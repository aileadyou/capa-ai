import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0'
import Papa from 'https://esm.sh/papaparse@5.5.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CsvRow {
  'Molecule ChEMBL ID'?: string
  'Smiles'?: string
  'Standard Value'?: string
  [key: string]: any
}

interface CleanedRow {
  'Molecule ChEMBL ID': string
  'Smiles': string
  'Standard Value': number
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

    const { datasetId } = await req.json()
    console.log('Processing dataset:', datasetId)

    // Fetch all files for this dataset
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

    // Process each file
    const allData: CleanedRow[] = []
    
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
        // Skip rows where Smiles or Standard Value is missing
        if (!row['Smiles'] || !row['Standard Value'] || !row['Molecule ChEMBL ID']) {
          continue
        }

        const standardValue = parseFloat(row['Standard Value'])
        if (isNaN(standardValue)) continue

        // Convert IC50 from nM to M (multiply by 10^-9)
        const molarValue = standardValue * 1e-9
        
        // Convert to pIC50 (-log10 of molar value)
        const pIC50 = -Math.log10(molarValue)

        allData.push({
          'Molecule ChEMBL ID': row['Molecule ChEMBL ID'],
          'Smiles': row['Smiles'],
          'Standard Value': pIC50,
        })
      }
    }

    console.log(`Total rows after processing: ${allData.length}`)

    // Remove duplicates based on Smiles column
    const uniqueData = Array.from(
      new Map(allData.map(item => [item['Smiles'], item])).values()
    )

    console.log(`Rows after removing duplicates: ${uniqueData.length}`)

    // Store cleaned data in processed_data table
    const { data: processedData, error: processedError } = await supabaseClient
      .from('processed_data')
      .insert({
        dataset_id: datasetId,
        step: 'standard_cleaning',
        row_count: uniqueData.length,
        column_count: 3,
        columns: ['Molecule ChEMBL ID', 'Smiles', 'pIC50'],
        sample_data: uniqueData.slice(0, 100),
        statistics: {
          total_rows: allData.length,
          unique_rows: uniqueData.length,
          duplicates_removed: allData.length - uniqueData.length,
        },
      })
      .select()
      .single()

    if (processedError) throw processedError

    // Update dataset status
    await supabaseClient
      .from('datasets')
      .update({
        status: 'completed',
        current_step: 'standard_cleaning',
        total_rows: uniqueData.length,
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
        },
        preview: uniqueData.slice(0, 10),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in clean-standard-data:', error)
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
