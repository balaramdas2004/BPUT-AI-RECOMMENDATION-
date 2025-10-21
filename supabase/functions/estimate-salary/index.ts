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
    const { studentId, careerDomainId, location, experienceYears = 0 } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Fetch student and career domain data
    const [studentRes, careerRes] = await Promise.all([
      supabase.from('students').select('*, student_skills(*, skills(*))').eq('id', studentId).single(),
      supabase.from('career_domains').select('*').eq('id', careerDomainId).single()
    ]);

    if (studentRes.error) throw studentRes.error;
    if (careerRes.error) throw careerRes.error;

    const student = studentRes.data;
    const career = careerRes.data;

    // Fetch placement statistics for salary benchmarks
    const { data: placementStats } = await supabase
      .from('placement_statistics')
      .select('average_package, highest_package, median_package, branch')
      .eq('branch', student.branch)
      .order('academic_year', { ascending: false })
      .limit(3);

    // Fetch skill demand trends for salary premiums
    const studentSkills = student.student_skills?.map((s: any) => s.skills?.name).filter(Boolean) || [];
    const { data: skillTrends } = await supabase
      .from('skill_demand_trends')
      .select('skill_name, salary_premium, demand_score')
      .in('skill_name', studentSkills);

    const profileData = {
      career: {
        name: career.name,
        category: career.category,
        averageSalaryRange: career.average_salary_range
      },
      student: {
        cgpa: student.cgpa,
        branch: student.branch,
        department: student.department,
        yearOfStudy: student.year_of_study,
        skills: student.student_skills?.map((s: any) => ({
          name: s.skills?.name,
          proficiency: s.proficiency_level,
          verified: s.verified
        }))
      },
      marketData: {
        branchAverageSalaries: placementStats,
        skillPremiums: skillTrends
      },
      location,
      experienceYears
    };

    // Call Lovable AI for salary estimation
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
            content: `You are a salary estimation expert for placements. Analyze student profiles and market data to estimate realistic salary ranges. Consider:
- Career domain and category
- Student's academic performance and branch
- Skills (especially high-demand ones with salary premiums)
- Location and cost of living adjustments
- Years of experience
- Historical placement data

Provide realistic estimates with confidence intervals and factors affecting the estimate.`
          },
          {
            role: 'user',
            content: `Estimate salary for this profile:\n${JSON.stringify(profileData, null, 2)}`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'estimate_salary',
            description: 'Estimate expected salary range',
            parameters: {
              type: 'object',
              properties: {
                minSalary: {
                  type: 'number',
                  description: 'Minimum expected salary (in LPA)'
                },
                maxSalary: {
                  type: 'number',
                  description: 'Maximum expected salary (in LPA)'
                },
                mostLikely: {
                  type: 'number',
                  description: 'Most likely salary (in LPA)'
                },
                confidence: {
                  type: 'string',
                  enum: ['low', 'medium', 'high'],
                  description: 'Confidence in estimate'
                },
                factors: {
                  type: 'object',
                  properties: {
                    positive: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Factors increasing salary'
                    },
                    negative: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Factors limiting salary'
                    }
                  }
                },
                growthPotential: {
                  type: 'object',
                  properties: {
                    year1: { type: 'number' },
                    year3: { type: 'number' },
                    year5: { type: 'number' }
                  }
                },
                recommendations: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'How to increase salary potential'
                },
                comparisonToMarket: {
                  type: 'string',
                  description: 'How this compares to market averages'
                }
              },
              required: ['minSalary', 'maxSalary', 'mostLikely', 'confidence', 'factors', 'recommendations']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'estimate_salary' } }
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
    const estimate = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);

    return new Response(JSON.stringify({
      success: true,
      estimate: {
        ...estimate,
        location,
        experienceYears,
        generatedAt: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in estimate-salary:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
