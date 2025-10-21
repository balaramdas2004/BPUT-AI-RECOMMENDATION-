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

    // Fetch student profile and skills
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;

    // Fetch student skills with details
    const { data: studentSkills } = await supabase
      .from('student_skills')
      .select(`
        proficiency_level,
        skills (
          id,
          name,
          category
        )
      `)
      .eq('student_id', studentId);

    // Fetch all career domains with required skills
    const { data: careerDomains } = await supabase
      .from('career_domains')
      .select(`
        id,
        name,
        description,
        category,
        average_salary_range,
        growth_rate
      `);

    // Fetch career skill mappings
    const { data: careerSkillMappings } = await supabase
      .from('career_skills_mapping')
      .select(`
        career_domain_id,
        importance_level,
        skills (
          id,
          name,
          category
        )
      `);

    // Prepare context for AI
    const studentProfile = {
      branch: student.branch,
      year: student.year_of_study,
      cgpa: student.cgpa,
      skills: studentSkills?.map(s => ({
        name: (s.skills as any).name,
        category: (s.skills as any).category,
        proficiency: s.proficiency_level
      })) || [],
      interests: student.interests || []
    };

    const careers = careerDomains?.map(cd => ({
      id: cd.id,
      name: cd.name,
      description: cd.description,
      category: cd.category,
      salary: cd.average_salary_range,
      growth: cd.growth_rate,
      requiredSkills: careerSkillMappings
        ?.filter(m => m.career_domain_id === cd.id && m.importance_level === 'required')
        .map(m => (m.skills as any).name) || []
    })) || [];

    // Call Lovable AI for career recommendations
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
            content: `You are an expert career counselor. Analyze the student profile and recommend the top 5 most suitable career paths.

For each recommendation provide:
- career_id: the ID from the available careers
- confidence_score: 0-100 based on skill match and fit
- reasoning: 2-3 sentences explaining why this career is suitable
- skill_match_percentage: percentage of required skills the student has
- recommended_skills: array of 3-5 skills they should learn for this career

Consider:
1. Current skills and proficiency levels
2. Academic background and CGPA
3. Year of study and career timing
4. Career growth potential
5. Skill gap analysis

Return recommendations ordered by confidence score (highest first).`
          },
          {
            role: 'user',
            content: `Student Profile:\n${JSON.stringify(studentProfile, null, 2)}\n\nAvailable Careers:\n${JSON.stringify(careers, null, 2)}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "recommend_careers",
            description: "Generate top 5 career recommendations",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      career_id: { type: "string" },
                      confidence_score: { type: "number" },
                      reasoning: { type: "string" },
                      skill_match_percentage: { type: "number" },
                      recommended_skills: {
                        type: "array",
                        items: { type: "string" }
                      }
                    },
                    required: ["career_id", "confidence_score", "reasoning", "skill_match_percentage", "recommended_skills"]
                  },
                  minItems: 5,
                  maxItems: 5
                }
              },
              required: ["recommendations"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "recommend_careers" } }
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
      throw new Error('Career recommendation failed');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No recommendations received from AI');
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Store recommendations in database
    const recommendationsToInsert = result.recommendations.map((rec: any) => ({
      student_id: studentId,
      career_domain_id: rec.career_id,
      confidence_score: Math.round(rec.confidence_score),
      reasoning: rec.reasoning,
      skill_match_percentage: Math.round(rec.skill_match_percentage),
      recommended_skills: rec.recommended_skills
    }));

    // Delete old recommendations
    await supabase
      .from('career_recommendations')
      .delete()
      .eq('student_id', studentId);

    // Insert new recommendations
    const { error: insertError } = await supabase
      .from('career_recommendations')
      .insert(recommendationsToInsert);

    if (insertError) {
      console.error('Error storing recommendations:', insertError);
    }

    return new Response(
      JSON.stringify({ success: true, recommendations: result.recommendations }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-career-recommendations:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Recommendation generation failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
