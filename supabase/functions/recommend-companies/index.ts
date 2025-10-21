import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeData } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const skills = resumeData.skills?.map((s: any) => s.name).join(', ') || 'None';
    const education = resumeData.education?.map((e: any) => `${e.degree} from ${e.institution}`).join(', ') || 'None';
    const experience = resumeData.experience?.map((e: any) => `${e.title} at ${e.company}`).join(', ') || 'None';

    const prompt = `You are an AI career advisor with expertise in ML-based candidate-company matching. Analyze this candidate profile:

SKILLS: ${skills}
EDUCATION: ${education}
EXPERIENCE: ${experience}

Task: Recommend 8 companies using advanced matching algorithms considering:
1. Skills alignment (40% weight)
2. Experience relevance (30% weight)  
3. Career growth potential (20% weight)
4. Company culture fit (10% weight)

For EACH company, calculate a precise ML-based match score (0-100) and provide:
- company_name: Real company name (mix of Fortune 500, tech unicorns, and innovative startups)
- industry: Specific industry/sector
- why_good_match: Data-driven explanation of why this is an excellent match based on their specific skills and experience (3-4 sentences with concrete connections)
- role_suggestions: Array of 2-3 specific, realistic job titles they should target at this company
- skills_valued: Array of their EXACT skills from their resume that this company highly values
- career_site_url: Real careers page URL (format: https://company.com/careers or https://careers.company.com)
- match_score: Calculated ML match score (must be realistic based on actual alignment - use 60-95 range, with most in 70-85 range)

Requirements:
- Include real, well-known companies that actually hire for these skills
- Match scores MUST reflect genuine skill-role alignment (not all high scores)
- Prioritize companies actively hiring in their field
- Include diverse company sizes and industries
- Use real, working career page URLs`;


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
            content: 'You are a career advisor who matches candidates with companies based on their skills and experience.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "recommend_companies",
            description: "Recommend companies for candidate",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      company_name: { type: "string" },
                      industry: { type: "string" },
                      why_good_match: { type: "string" },
                      role_suggestions: { type: "array", items: { type: "string" } },
                      skills_valued: { type: "array", items: { type: "string" } },
                      career_site_url: { type: "string" },
                      match_score: { type: "number" }
                    }
                  }
                }
              },
              required: ["recommendations"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "recommend_companies" } }
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
      throw new Error('AI recommendation failed');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No recommendations generated');
    }

    const recommendations = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: recommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in recommend-companies:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate recommendations' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
