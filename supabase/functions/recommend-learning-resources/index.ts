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
    const { skills, targetRole } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const skillsList = skills.map((s: any) => s.name).join(', ');
    
    const prompt = `You are an expert career development advisor specializing in curated learning resources. Analyze these skills: ${skillsList}

Target Role: ${targetRole || 'career advancement'}

Task: Recommend 6 HIGH-QUALITY, VERIFIED YouTube learning resources that will directly improve their career prospects.

Requirements for each recommendation:
1. Must be from REAL, well-known YouTube channels (e.g., freeCodeCamp, Traversy Media, Fireship, Programming with Mosh, CS Dojo, etc.)
2. Must target specific skill gaps or advancement areas
3. Must be practical, hands-on content (not just theory)
4. Must be recent and actively maintained

For each resource provide:
- channel_name: REAL verified YouTube channel name (check it exists)
- topic: Specific playlist, course, or topic to study (be very specific)
- skill_focus: Exact skill from their list this improves OR new skill they should learn
- reason: Concrete explanation of how this accelerates their career (2-3 sentences with specific outcomes)
- search_query: Optimized YouTube search query that will find the exact content (use channel name + topic)

Focus areas:
- If they have technical skills: advanced tutorials, real-world projects, system design
- If they lack certain in-demand skills: foundational courses in AI/ML, cloud, etc.
- Soft skills: communication, leadership, interview prep from reputable channels
- Industry-specific: domain knowledge relevant to their field

Output format: JSON with array of 6 recommendations`;


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
            content: 'You are a career development advisor who recommends high-quality YouTube learning resources.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "recommend_youtube_resources",
            description: "Recommend YouTube learning resources",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      channel_name: { type: "string" },
                      topic: { type: "string" },
                      skill_focus: { type: "string" },
                      reason: { type: "string" },
                      search_query: { type: "string" }
                    }
                  }
                }
              },
              required: ["recommendations"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "recommend_youtube_resources" } }
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
    console.error('Error in recommend-learning-resources:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate recommendations' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
