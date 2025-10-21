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

    // Fetch student data with skills and career recommendations
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;

    // Fetch student skills
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

    // Fetch career recommendations
    const { data: careerRecs } = await supabase
      .from('career_recommendations')
      .select(`
        recommended_skills,
        career_domains (
          name,
          category
        )
      `)
      .eq('student_id', studentId)
      .order('confidence_score', { ascending: false })
      .limit(3);

    // Fetch all available courses
    const { data: allCourses } = await supabase
      .from('courses')
      .select('*');

    // Prepare context for AI
    const studentProfile = {
      branch: student.branch,
      year: student.year_of_study,
      cgpa: student.cgpa,
      currentSkills: studentSkills?.map(s => ({
        name: (s.skills as any).name,
        category: (s.skills as any).category,
        proficiency: s.proficiency_level
      })) || [],
      careerGoals: careerRecs?.map(r => ({
        career: (r.career_domains as any).name,
        skillsToLearn: r.recommended_skills
      })) || []
    };

    const courses = allCourses?.map(c => ({
      id: c.id,
      title: c.title,
      provider: c.provider,
      level: c.level,
      duration: c.duration,
      skillsCovered: c.skills_covered || [],
      rating: c.rating
    })) || [];

    // Call Lovable AI for course recommendations
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
            content: `You are an expert learning advisor. Recommend courses that:
1. Fill skill gaps for career goals
2. Match student's current level
3. Provide clear progression path
4. Are highly rated when possible

For each of the top 10 recommended courses provide:
- course_id: from available courses
- relevance_score: 0-100 based on fit
- reasoning: 1-2 sentences why recommended
- priority: high/medium/low based on career alignment

Consider student's current skills to avoid redundancy and ensure appropriate difficulty.`
          },
          {
            role: 'user',
            content: `Student Profile:\n${JSON.stringify(studentProfile, null, 2)}\n\nAvailable Courses:\n${JSON.stringify(courses, null, 2)}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "recommend_courses",
            description: "Generate top 10 course recommendations",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      course_id: { type: "string" },
                      relevance_score: { type: "number" },
                      reasoning: { type: "string" },
                      priority: { type: "string", enum: ["high", "medium", "low"] }
                    },
                    required: ["course_id", "relevance_score", "reasoning", "priority"]
                  },
                  minItems: 1,
                  maxItems: 10
                },
                learning_path_suggestion: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    estimated_duration: { type: "string" },
                    course_sequence: {
                      type: "array",
                      items: { type: "string" }
                    }
                  }
                }
              },
              required: ["recommendations"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "recommend_courses" } }
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
      throw new Error('Course recommendation failed');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No recommendations received from AI');
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Create learning path if suggested
    if (result.learning_path_suggestion && careerRecs && careerRecs.length > 0) {
      const topCareer = careerRecs[0];
      const { error: pathError } = await supabase
        .from('learning_paths')
        .insert({
          student_id: studentId,
          career_domain_id: (topCareer.career_domains as any).id,
          title: result.learning_path_suggestion.title,
          description: result.learning_path_suggestion.description,
          estimated_duration: result.learning_path_suggestion.estimated_duration,
          current_level: student.year_of_study === 1 || student.year_of_study === 2 ? 'beginner' : 'intermediate',
          target_level: 'advanced',
          recommended_courses: result.learning_path_suggestion.course_sequence || []
        });

      if (pathError) {
        console.error('Error creating learning path:', pathError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        recommendations: result.recommendations,
        learning_path: result.learning_path_suggestion
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in recommend-courses:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Course recommendation failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
