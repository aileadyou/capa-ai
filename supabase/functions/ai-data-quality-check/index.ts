import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { csvData, filename } = await req.json();
    
    if (!csvData || !filename) {
      throw new Error('Missing required fields: csvData and filename');
    }

    console.log(`Analyzing data quality for file: ${filename}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Parse CSV to get first few rows for analysis
    const lines = csvData.split('\n').filter((line: string) => line.trim());
    const sampleSize = Math.min(20, lines.length);
    const sampleData = lines.slice(0, sampleSize).join('\n');

    // Create a detailed prompt for AI analysis
    const prompt = `You are a bioactivity data quality expert. Analyze this CSV sample from a ChEMBL-format bioactivity dataset and identify data quality issues.

Dataset: ${filename}
Total rows in sample: ${sampleSize}

CSV Sample:
${sampleData}

Analyze for these common issues:
1. Missing values in critical columns (Smiles, Standard Value, Molecule ChEMBL ID)
2. Invalid SMILES notation (if you can detect obvious issues)
3. Standard Value outliers or unusual values
4. Missing or inconsistent Standard Relation (should be '=', '>', '<', etc.)
5. Missing Molecular Weight values
6. Duplicate entries
7. Inconsistent units or data formats
8. Special characters or encoding issues

For each issue found:
- Describe the problem clearly
- Specify which column(s) are affected
- Provide a specific, actionable fix suggestion
- Estimate severity (high/medium/low)

If no issues are found, say so clearly.

Return your analysis as a structured JSON object with this format:
{
  "overallQuality": "good/fair/poor",
  "issues": [
    {
      "severity": "high/medium/low",
      "category": "missing_values/invalid_format/outliers/duplicates/other",
      "column": "column name",
      "description": "clear description of the issue",
      "suggestion": "specific fix recommendation",
      "affectedRows": number or "unknown"
    }
  ],
  "summary": "brief overall assessment"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a bioactivity data quality expert. Analyze CSV data and return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI analysis complete');

    // Parse the JSON response from AI
    let analysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback response if parsing fails
      analysis = {
        overallQuality: 'unknown',
        issues: [],
        summary: 'Unable to parse AI analysis. Raw response: ' + content
      };
    }

    return new Response(
      JSON.stringify(analysis),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in ai-data-quality-check:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
