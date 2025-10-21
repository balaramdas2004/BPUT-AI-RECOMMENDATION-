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
    const { question, candidateAnswer } = await req.json();
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert interview coach analyzing candidate responses. Provide detailed feedback on interview answers including grammar, content quality, and professional communication.`
          },
          {
            role: 'user',
            content: `Analyze this interview response:

Question: "${question}"

Candidate's Answer: "${candidateAnswer}"

Provide analysis in the following format:
1. Key points covered by the candidate
2. Key points missed (important aspects they should have mentioned)
3. A model/ideal answer
4. Grammar and language quality assessment
5. Specific improvement suggestions`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_answer",
            description: "Analyze interview answer quality and provide feedback",
            parameters: {
              type: "object",
              properties: {
                expectedPoints: {
                  type: "array",
                  items: { type: "string" },
                  description: "Key points that should be covered in an ideal answer"
                },
                correctAnswer: {
                  type: "string",
                  description: "A model/ideal answer to the question"
                },
                grammarIssues: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      issue: { type: "string" },
                      correction: { type: "string" },
                      category: { type: "string" }
                    }
                  },
                  description: "Grammatical or language issues found"
                },
                contentQuality: {
                  type: "object",
                  properties: {
                    score: { type: "number", description: "Score out of 100" },
                    strengths: { type: "array", items: { type: "string" } },
                    improvements: { type: "array", items: { type: "string" } }
                  }
                },
                overallFeedback: {
                  type: "string",
                  description: "Comprehensive feedback summary"
                }
              },
              required: ["expectedPoints", "correctAnswer", "grammarIssues", "contentQuality", "overallFeedback"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "analyze_answer" } }
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to continue.');
      }
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    const analysisData = toolCall ? JSON.parse(toolCall.function.arguments) : {};

    console.log('AI Analysis:', analysisData);

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Error analyzing answer:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
