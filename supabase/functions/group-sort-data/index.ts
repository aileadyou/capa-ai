import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { processedDataId } = await req.json();

    if (!processedDataId) {
      throw new Error('processedDataId is required');
    }

    console.log('Loading processed data:', processedDataId);

    // Get the processed data record
    const { data: processedData, error: pdError } = await supabaseClient
      .from('processed_data')
      .select('*')
      .eq('id', processedDataId)
      .single();

    if (pdError) throw pdError;
    if (!processedData?.file_path) throw new Error('No file path found');

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('datasets')
      .download(processedData.file_path);

    if (downloadError) throw downloadError;

    const csvText = await fileData.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    console.log('Headers:', headers);

    // Parse CSV data
    const rows = lines.slice(1).map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      return headers.reduce((obj, header, idx) => {
        obj[header] = values[idx] || '';
        return obj;
      }, {} as Record<string, string>);
    });

    console.log(`Loaded ${rows.length} rows`);

    // Phase 2: Group by Assay ChEMBL ID and Smiles, compute max pIC50
    interface GroupKey {
      assayId: string;
      smiles: string;
    }

    const grouped = new Map<string, { assayId: string; smiles: string; maxPIC50: number; count: number }>();

    rows.forEach(row => {
      const assayId = row['Assay ChEMBL ID'];
      const smiles = row['Smiles'];
      const pic50 = parseFloat(row['Standard Value']);

      if (!assayId || !smiles || isNaN(pic50)) return;

      const key = `${assayId}|||${smiles}`;
      
      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        existing.maxPIC50 = Math.max(existing.maxPIC50, pic50);
        existing.count += 1;
      } else {
        grouped.set(key, { assayId, smiles, maxPIC50: pic50, count: 1 });
      }
    });

    console.log(`Grouped into ${grouped.size} unique (Assay, Smiles) pairs`);

    // Count how many assays each Smiles appears in for sorting
    const smilesAssayCount = new Map<string, number>();
    grouped.forEach(({ smiles }) => {
      smilesAssayCount.set(smiles, (smilesAssayCount.get(smiles) || 0) + 1);
    });

    // Convert to array and sort by assay count (descending)
    const sortedData = Array.from(grouped.values())
      .sort((a, b) => {
        const countA = smilesAssayCount.get(a.smiles) || 0;
        const countB = smilesAssayCount.get(b.smiles) || 0;
        return countB - countA;
      });

    console.log(`Sorted ${sortedData.length} rows by assay count`);

    // Statistics before deduplication
    const beforeDedup = sortedData.length;

    // Selective removal: drop duplicates by Smiles
    const seenSmiles = new Set<string>();
    const deduplicated = sortedData.filter(row => {
      if (seenSmiles.has(row.smiles)) {
        return false;
      }
      seenSmiles.add(row.smiles);
      return true;
    });

    console.log(`After deduplication: ${deduplicated.length} rows (removed ${beforeDedup - deduplicated.length} duplicates)`);

    // Create preview data
    const previewBeforeDedup = sortedData.slice(0, 100).map(row => [
      row.assayId,
      row.smiles,
      row.maxPIC50.toFixed(3),
    ]);

    const previewAfterDedup = deduplicated.slice(0, 100).map(row => [
      row.smiles,
      row.maxPIC50.toFixed(3),
    ]);

    // Save the final deduplicated data
    const finalCsvContent = [
      'Smiles,pIC50',
      ...deduplicated.map(row => `"${row.smiles}",${row.maxPIC50.toFixed(3)}`)
    ].join('\n');

    const fileName = `grouped_sorted_${Date.now()}.csv`;
    const filePath = `${processedData.dataset_id}/${fileName}`;

    const { error: uploadError } = await supabaseClient
      .storage
      .from('datasets')
      .upload(filePath, finalCsvContent, {
        contentType: 'text/csv',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Store in processed_data table
    const { error: insertError } = await supabaseClient
      .from('processed_data')
      .insert({
        dataset_id: processedData.dataset_id,
        step: 'grouping_sorting',
        file_path: filePath,
        row_count: deduplicated.length,
        column_count: 2,
        columns: ['Smiles', 'pIC50'],
        sample_data: previewAfterDedup,
        statistics: {
          before_deduplication: beforeDedup,
          after_deduplication: deduplicated.length,
          duplicates_removed: beforeDedup - deduplicated.length,
        }
      });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        beforeDedup: {
          headers: ['Assay ChEMBL ID', 'Smiles', 'pIC50'],
          rows: previewBeforeDedup,
          totalRows: beforeDedup,
        },
        afterDedup: {
          headers: ['Smiles', 'pIC50'],
          rows: previewAfterDedup,
          totalRows: deduplicated.length,
        },
        statistics: {
          before_deduplication: beforeDedup,
          after_deduplication: deduplicated.length,
          duplicates_removed: beforeDedup - deduplicated.length,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in group-sort-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});