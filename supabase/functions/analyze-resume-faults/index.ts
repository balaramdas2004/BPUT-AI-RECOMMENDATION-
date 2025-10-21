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
    const { resumeText, resumeData } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const skills = resumeData?.skills?.map((s: any) => s.name).join(', ') || 'None listed';
    const education = resumeData?.education?.map((e: any) => `${e.degree} from ${e.institution}`).join(', ') || 'None listed';
    const experience = resumeData?.experience?.map((e: any) => `${e.title} at ${e.company}`).join(', ') || 'None listed';

    const prompt = `You are an expert resume analyzer and career counselor. Analyze this resume thoroughly and identify issues, improvements, and provide actionable feedback.

RESUME CONTENT:
${resumeText}

PARSED DATA:
- Skills: ${skills}
- Education: ${education}
- Experience: ${experience}

Analyze and provide:
1. Critical Issues (severity: high) - Major problems that hurt job prospects
2. Moderate Issues (severity: medium) - Areas needing improvement
3. Minor Issues (severity: low) - Small optimizations
4. Strengths - What's working well
5. Overall Score (0-100) - Resume quality rating
6. Key Recommendations - Top 3-5 actionable improvements

For each issue, provide:
- category (formatting, content, keywords, structure, grammar, experience, skills, achievements)
- description (clear explanation)
- suggestion (specific fix)
- impact (how it affects job prospects)

Return comprehensive, actionable analysis.`;

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
            content: 'You are an expert resume analyzer who provides detailed, actionable feedback on resumes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_resume",
            description: "Analyze resume and identify faults, issues, and improvements",
            parameters: {
              type: "object",
              properties: {
                overall_score: {
                  type: "number",
                  description: "Overall resume quality score (0-100)"
                },
                issues: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      severity: { type: "string", enum: ["high", "medium", "low"] },
                      category: { type: "string" },
                      description: { type: "string" },
                      suggestion: { type: "string" },
                      impact: { type: "string" }
                    },
                    required: ["severity", "category", "description", "suggestion", "impact"]
                  }
                },
                strengths: {
                  type: "array",
                  items: { type: "string" }
                },
                recommendations: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["overall_score", "issues", "strengths", "recommendations"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "analyze_resume" } }
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
      console.error('AI analysis failed:', aiResponse.status, errorText);
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No analysis generated');
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-resume-faults:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to analyze resume' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
