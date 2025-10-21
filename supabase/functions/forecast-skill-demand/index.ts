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
    const { timeframe = '6months', industry } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Fetch historical skill demand data
    const { data: skillTrends } = await supabase
      .from('skill_demand_trends')
      .select('*')
      .order('period_end', { ascending: false })
      .limit(50);

    // Fetch active job postings
    const { data: jobPostings } = await supabase
      .from('job_postings')
      .select('skills_required, department, location_type')
      .eq('status', 'active');

    // Aggregate current demand
    const currentSkillDemand: Record<string, number> = {};
    jobPostings?.forEach(job => {
      job.skills_required?.forEach((skill: string) => {
        currentSkillDemand[skill] = (currentSkillDemand[skill] || 0) + 1;
      });
    });

    const contextData = {
      historicalTrends: skillTrends?.slice(0, 30),
      currentJobMarket: {
        activePostings: jobPostings?.length || 0,
        topSkills: Object.entries(currentSkillDemand)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 15)
          .map(([skill, count]) => ({ skill, count }))
      },
      timeframe,
      industry
    };

    // Call Lovable AI for forecasting
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
            content: `You are a skill demand forecasting expert. Analyze historical trends and current job market data to predict future skill demand. Consider:
- Historical growth/decline patterns
- Current market demand
- Emerging technologies and industry trends
- Seasonal variations
- Industry-specific requirements

Provide forecasts with confidence levels and reasoning.`
          },
          {
            role: 'user',
            content: `Forecast skill demand for the next ${timeframe}${industry ? ` in ${industry} industry` : ''}:\n${JSON.stringify(contextData, null, 2)}`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'forecast_skill_demand',
            description: 'Forecast future skill demand',
            parameters: {
              type: 'object',
              properties: {
                forecast: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      skill: { type: 'string' },
                      currentDemand: { type: 'string', enum: ['low', 'medium', 'high', 'very_high'] },
                      predictedDemand: { type: 'string', enum: ['low', 'medium', 'high', 'very_high'] },
                      trend: { type: 'string', enum: ['declining', 'stable', 'growing', 'surging'] },
                      confidence: { type: 'number', description: 'Confidence 0-100' },
                      reasoning: { type: 'string' }
                    }
                  }
                },
                emergingSkills: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      skill: { type: 'string' },
                      reason: { type: 'string' },
                      potentialImpact: { type: 'string', enum: ['low', 'medium', 'high'] }
                    }
                  }
                },
                decliningSkills: {
                  type: 'array',
                  items: { type: 'string' }
                },
                recommendations: {
                  type: 'array',
                  items: { type: 'string' }
                }
              },
              required: ['forecast', 'emergingSkills', 'recommendations']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'forecast_skill_demand' } }
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
    const forecast = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);

    return new Response(JSON.stringify({
      success: true,
      forecast: {
        ...forecast,
        timeframe,
        industry,
        generatedAt: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in forecast-skill-demand:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
