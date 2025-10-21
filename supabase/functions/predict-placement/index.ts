import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Fetch student data
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;

    // Fetch related data
    const [skills, projects, certifications, academics] = await Promise.all([
      supabase.from('student_skills').select('*, skills(*)').eq('student_id', studentId),
      supabase.from('projects').select('*').eq('student_id', studentId),
      supabase.from('certifications').select('*').eq('student_id', studentId),
      supabase.from('academic_records').select('*').eq('student_id', studentId).order('year', { ascending: false })
    ]);

    // Fetch placement statistics for context
    const { data: placementStats } = await supabase
      .from('placement_statistics')
      .select('*')
      .eq('branch', student.branch)
      .order('academic_year', { ascending: false })
      .limit(3);

    const profileData = {
      cgpa: student.cgpa,
      yearOfStudy: student.year_of_study,
      branch: student.branch,
      department: student.department,
      skills: skills.data?.map(s => ({
        name: s.skills?.name,
        proficiency: s.proficiency_level,
        verified: s.verified
      })),
      projectCount: projects.data?.length || 0,
      certificationCount: certifications.data?.length || 0,
      recentSGPA: academics.data?.slice(0, 2).map(a => a.sgpa),
      branchPlacementStats: placementStats
    };

    // Call Lovable AI for prediction
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a placement prediction expert. Analyze student profiles and predict placement probability based on:
- Academic performance (CGPA, recent SGPA)
- Skills (count, proficiency, verification)
- Projects and certifications
- Historical placement data for their branch
- Year of study and department

Provide a detailed prediction with probability score (0-100), confidence level, key strengths, areas for improvement, and actionable recommendations.`
          },
          {
            role: 'user',
            content: `Predict placement probability for this student:\n${JSON.stringify(profileData, null, 2)}`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'predict_placement',
            description: 'Predict student placement probability',
            parameters: {
              type: 'object',
              properties: {
                probability: {
                  type: 'number',
                  description: 'Placement probability (0-100)'
                },
                confidence: {
                  type: 'string',
                  enum: ['low', 'medium', 'high'],
                  description: 'Confidence in prediction'
                },
                strengths: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Key strengths'
                },
                weaknesses: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Areas for improvement'
                },
                recommendations: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Actionable recommendations'
                },
                estimatedTimeToPlacement: {
                  type: 'string',
                  description: 'Estimated time to placement'
                },
                targetCompanyTypes: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Recommended company types to target'
                }
              },
              required: ['probability', 'confidence', 'strengths', 'weaknesses', 'recommendations']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'predict_placement' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI service payment required. Please contact support.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const prediction = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);

    return new Response(JSON.stringify({
      success: true,
      prediction: {
        ...prediction,
        generatedAt: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in predict-placement:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
