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
    const { studentId, interests } = await req.json();
    const authHeader = req.headers.get('Authorization')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    // Get available mentors
    const { data: alumni, error: alumniError } = await supabase
      .from('alumni')
      .select('*')
      .eq('mentorship_available', true);

    if (alumniError) throw alumniError;

    // Calculate match scores
    const matches = alumni?.map((alum: any) => {
      let matchScore = 0;
      const alumniExpertise = alum.expertise_areas || [];
      
      // Score based on expertise overlap
      const overlapCount = interests.filter((interest: string) =>
        alumniExpertise.includes(interest)
      ).length;
      
      matchScore = (overlapCount / Math.max(interests.length, 1)) * 100;

      return {
        ...alum,
        matchScore: Math.round(matchScore)
      };
    }) || [];

    // Sort by match score
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return new Response(JSON.stringify({
      success: true,
      matches: matches.slice(0, 10) // Top 10 matches
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Error matching mentor:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});