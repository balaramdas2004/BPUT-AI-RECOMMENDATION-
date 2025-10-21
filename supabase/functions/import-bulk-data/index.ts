import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { importId } = await req.json();
    const authHeader = req.headers.get('Authorization')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    // Get import record
    const { data: importRecord } = await supabase
      .from('bulk_data_imports')
      .select('*')
      .eq('id', importId)
      .single();

    if (!importRecord) {
      throw new Error('Import record not found');
    }

    // Update status to processing
    await supabase
      .from('bulk_data_imports')
      .update({ status: 'processing' })
      .eq('id', importId);

    // Download CSV file
    const { data: fileData } = await supabase
      .storage
      .from('resumes')
      .download(importRecord.file_url);

    if (!fileData) {
      throw new Error('Failed to download file');
    }

    const csvText = await fileData.text();
    const rows = parseCSV(csvText);
    
    const results = {
      total: rows.length,
      processed: 0,
      failed: 0,
      errors: [] as any[]
    };

    // Process based on import type
    for (let i = 0; i < rows.length; i++) {
      try {
        switch (importRecord.import_type) {
          case 'students':
            await importStudent(supabase, rows[i]);
            break;
          case 'placements':
            await importPlacement(supabase, rows[i]);
            break;
          case 'companies':
            await importCompany(supabase, rows[i]);
            break;
          case 'skills':
            await importSkill(supabase, rows[i]);
            break;
        }
        results.processed++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          data: rows[i],
          error: error.message
        });
      }
    }

    // Update import record
    await supabase
      .from('bulk_data_imports')
      .update({
        status: results.failed === 0 ? 'completed' : 'failed',
        total_records: results.total,
        processed_records: results.processed,
        failed_records: results.failed,
        error_log: results.errors,
        completed_at: new Date().toISOString()
      })
      .eq('id', importId);

    return new Response(JSON.stringify({
      success: true,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Error importing bulk data:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

function parseCSV(csvText: string): any[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: any = {};
    headers.forEach((header, i) => {
      row[header] = values[i];
    });
    return row;
  });
}

async function importStudent(supabase: any, data: any) {
  // Note: In production, students should be created via signup
  // This is for bulk import of existing student data
  const { error } = await supabase
    .from('students')
    .upsert({
      registration_no: data.registration_no,
      department: data.department,
      branch: data.branch,
      year_of_study: parseInt(data.year_of_study),
      cgpa: parseFloat(data.cgpa),
      skills: data.skills?.split(';') || []
    });
  
  if (error) throw error;
}

async function importPlacement(supabase: any, data: any) {
  const { error } = await supabase
    .from('placement_statistics')
    .upsert({
      academic_year: data.academic_year,
      department: data.department,
      branch: data.branch,
      total_students: parseInt(data.total_students),
      placed_students: parseInt(data.placed_students),
      average_package: parseFloat(data.average_package),
      highest_package: parseFloat(data.highest_package)
    });
  
  if (error) throw error;
}

async function importCompany(supabase: any, data: any) {
  const { error } = await supabase
    .from('employers')
    .upsert({
      company_name: data.company_name,
      industry: data.industry,
      location: data.location,
      website: data.website,
      verification_status: 'verified'
    });
  
  if (error) throw error;
}

async function importSkill(supabase: any, data: any) {
  const { error } = await supabase
    .from('skills')
    .upsert({
      name: data.skill_name,
      category: data.category,
      description: data.description
    });
  
  if (error) throw error;
}