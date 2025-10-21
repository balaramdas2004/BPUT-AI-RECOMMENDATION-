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
    const { jobPostingId, limit = 50 } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Fetch job posting details
    const { data: job, error: jobError } = await supabase
      .from('job_postings')
      .select('*')
      .eq('id', jobPostingId)
      .single();

    if (jobError) throw jobError;

    // Fetch job requirements
    const { data: requirements } = await supabase
      .from('job_requirements')
      .select('*')
      .eq('job_posting_id', jobPostingId);

    // Fetch eligible students
    const { data: students } = await supabase
      .from('students')
      .select(`
        id,
        user_id,
        branch,
        year_of_study,
        cgpa,
        skills,
        bio,
        profiles (
          full_name,
          email
        )
      `)
      .limit(limit);

    if (!students || students.length === 0) {
      return new Response(
        JSON.stringify({ success: true, matches: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch student skills for each student
    const studentIds = students.map(s => s.id);
    const { data: studentSkills } = await supabase
      .from('student_skills')
      .select(`
        student_id,
        proficiency_level,
        skills (
          name,
          category
        )
      `)
      .in('student_id', studentIds);

    // Prepare data for AI matching
    const jobContext = {
      title: job.title,
      description: job.description,
      type: job.job_type,
      location: job.location,
      skills_required: job.skills_required || [],
      qualifications: job.qualifications || [],
      requirements: requirements?.map(r => ({
        type: r.requirement_type,
        value: r.requirement_value,
        mandatory: r.is_mandatory
      })) || []
    };

    const candidatesData = students.map(student => {
      const skills = studentSkills
        ?.filter(ss => ss.student_id === student.id)
        .map(ss => ({
          name: (ss.skills as any).name,
          category: (ss.skills as any).category,
          proficiency: ss.proficiency_level
        })) || [];

      return {
        id: student.id,
        name: (student.profiles as any)?.full_name || 'Unknown',
        branch: student.branch,
        year: student.year_of_study,
        cgpa: student.cgpa,
        skills: skills,
        bio: student.bio
      };
    });

    // Call Lovable AI for candidate matching
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
            content: `You are an expert recruiter. Match candidates to a job opening based on:
1. Skills match (technical and soft skills)
2. Academic qualifications (branch, CGPA, year)
3. Experience and background
4. Job requirements

For each candidate provide:
- match_score: 0-100 indicating overall fit
- reasoning: 2-3 sentences explaining the match
- strengths: what makes them a good fit
- concerns: any gaps or concerns

Return candidates sorted by match score (highest first). Only include candidates with score >= 40.`
          },
          {
            role: 'user',
            content: `Job Opening:\n${JSON.stringify(jobContext, null, 2)}\n\nCandidates:\n${JSON.stringify(candidatesData, null, 2)}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "match_candidates",
            description: "Match and rank candidates for job",
            parameters: {
              type: "object",
              properties: {
                matches: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      candidate_id: { type: "string" },
                      match_score: { type: "number" },
                      reasoning: { type: "string" },
                      strengths: {
                        type: "array",
                        items: { type: "string" }
                      },
                      concerns: {
                        type: "array",
                        items: { type: "string" }
                      }
                    },
                    required: ["candidate_id", "match_score", "reasoning"]
                  }
                }
              },
              required: ["matches"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "match_candidates" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('Candidate matching failed');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No matches received from AI');
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Store shortlist in database
    const shortlistData = result.matches.map((match: any, index: number) => ({
      job_posting_id: jobPostingId,
      student_id: match.candidate_id,
      rank: index + 1,
      match_score: Math.round(match.match_score),
      match_reasoning: `${match.reasoning}\n\nStrengths: ${(match.strengths || []).join(', ')}\nConcerns: ${(match.concerns || []).join(', ')}`
    }));

    // Delete old shortlist
    await supabase
      .from('shortlists')
      .delete()
      .eq('job_posting_id', jobPostingId);

    // Insert new shortlist
    if (shortlistData.length > 0) {
      const { error: insertError } = await supabase
        .from('shortlists')
        .insert(shortlistData);

      if (insertError) {
        console.error('Error storing shortlist:', insertError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, matches: result.matches }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in match-candidates:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Matching failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
