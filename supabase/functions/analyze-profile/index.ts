import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentId } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Fetch student data
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;

    // Fetch related data
    const [skillsData, projectsData, certsData, academicData] = await Promise.all([
      supabase.from('student_skills')
        .select('*, skills(*)')
        .eq('student_id', studentId),
      supabase.from('projects')
        .select('*')
        .eq('student_id', studentId),
      supabase.from('certifications')
        .select('*')
        .eq('student_id', studentId),
      supabase.from('academic_records')
        .select('*')
        .eq('student_id', studentId)
        .order('semester', { ascending: true })
    ]);

    // Prepare context for AI analysis
    const profileContext = {
      cgpa: student.cgpa || 0,
      branch: student.branch,
      year: student.year_of_study,
      skills: skillsData.data?.map(s => ({
        name: s.skills.name,
        category: s.skills.category,
        proficiency: s.proficiency_level
      })) || [],
      projects: projectsData.data?.length || 0,
      certifications: certsData.data?.length || 0,
      academicRecords: academicData.data?.length || 0
    };

    // Call Lovable AI for analysis
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `You are a career counselor analyzing student profiles. Provide detailed career readiness analysis with:
1. Overall readiness score (0-100)
2. Breakdown scores for: academic (30%), skills (40%), experience (20%), soft skills (10%)
3. Key strengths (list 3-5)
4. Areas for improvement (list 3-5)
5. Specific recommendations (list 5-7 actionable items)

Return response as JSON with this structure:
{
  "overall_score": number,
  "academic_score": number,
  "skills_score": number,
  "experience_score": number,
  "soft_skills_score": number,
  "strengths": string[],
  "improvements": string[],
  "recommendations": string[]
}`
          },
          {
            role: 'user',
            content: `Analyze this student profile:\n${JSON.stringify(profileContext, null, 2)}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_profile",
            description: "Analyze student career readiness",
            parameters: {
              type: "object",
              properties: {
                overall_score: { type: "number" },
                academic_score: { type: "number" },
                skills_score: { type: "number" },
                experience_score: { type: "number" },
                soft_skills_score: { type: "number" },
                strengths: { type: "array", items: { type: "string" } },
                improvements: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } }
              },
              required: ["overall_score", "academic_score", "skills_score", "experience_score", "soft_skills_score", "strengths", "improvements", "recommendations"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "analyze_profile" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No analysis received from AI');
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // Store the analysis
    const { error: insertError } = await supabase
      .from('career_readiness_scores')
      .insert({
        student_id: studentId,
        overall_score: Math.round(analysis.overall_score),
        academic_score: Math.round(analysis.academic_score),
        skills_score: Math.round(analysis.skills_score),
        experience_score: Math.round(analysis.experience_score),
        soft_skills_score: Math.round(analysis.soft_skills_score),
        analysis: {
          strengths: analysis.strengths,
          improvements: analysis.improvements
        },
        recommendations: analysis.recommendations
      });

    if (insertError) {
      console.error('Error storing analysis:', insertError);
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-profile:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
