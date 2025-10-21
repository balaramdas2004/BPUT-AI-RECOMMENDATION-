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
    const { videoFrames, transcript, studentId } = await req.json();

    if (!videoFrames || !Array.isArray(videoFrames) || videoFrames.length === 0) {
      throw new Error('No video frames provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Analyzing ${videoFrames.length} frames for student ${studentId}`);

    // Analyze multiple frames for comprehensive assessment
    const frameAnalysisPrompt = `You are an expert HR interviewer analyzing a candidate's interview performance through video.

Analyze these video frames from an interview and assess:
1. **Confidence & Posture**: Body language, sitting posture, overall confidence level
2. **Eye Contact**: Looking at camera, eye movement patterns
3. **Facial Expressions**: Emotions, stress indicators, engagement level
4. **Nervousness Indicators**: Fidgeting, excessive movements, stress signs
5. **Professional Demeanor**: Overall professionalism and presentation

${transcript ? `\nInterview Transcript: "${transcript}"\n\nAlso assess communication clarity, speaking pace, and articulation based on this transcript.` : ''}

Provide detailed scores and observations.`;

    // Prepare messages with images for vision analysis
    const messages: any[] = [
      {
        role: 'system',
        content: 'You are an expert HR interviewer and psychologist who analyzes interview performance through video and body language.'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: frameAnalysisPrompt },
          ...videoFrames.slice(0, 5).map((frame: string) => ({
            type: 'image_url',
            image_url: { url: frame }
          }))
        ]
      }
    ];

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        tools: [{
          type: "function",
          function: {
            name: "analyze_interview_performance",
            description: "Analyze interview performance from video and transcript",
            parameters: {
              type: "object",
              properties: {
                confidence_score: { type: "number", description: "0-100 score for confidence" },
                eye_contact_score: { type: "number", description: "0-100 score for eye contact quality" },
                facial_expression_score: { type: "number", description: "0-100 score for appropriate facial expressions" },
                posture_score: { type: "number", description: "0-100 score for body posture" },
                communication_clarity_score: { type: "number", description: "0-100 score for communication clarity" },
                nervousness_level: { type: "string", enum: ["low", "medium", "high"] },
                speaking_pace: { type: "string", enum: ["slow", "moderate", "fast"] },
                overall_soft_skills_score: { type: "number", description: "0-100 overall soft skills score" },
                leadership_indicators: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Observable leadership traits"
                },
                problem_solving_indicators: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Problem-solving approach indicators"
                },
                teamwork_indicators: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Teamwork and collaboration indicators"
                },
                strengths: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Key strengths observed"
                },
                areas_for_improvement: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Areas needing improvement"
                },
                detailed_feedback: { type: "string", description: "Comprehensive feedback" },
                recommended_company_types: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      reason: { type: "string" }
                    }
                  },
                  description: "Company types that match the candidate's soft skills"
                }
              },
              required: [
                "confidence_score", "eye_contact_score", "facial_expression_score",
                "posture_score", "communication_clarity_score", "nervousness_level",
                "speaking_pace", "overall_soft_skills_score", "strengths",
                "areas_for_improvement", "detailed_feedback"
              ]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "analyze_interview_performance" } }
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
      throw new Error('Interview analysis failed');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No analysis generated');
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    console.log('Analysis complete:', analysis);

    // Store analysis in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: analysisRecord, error: dbError } = await supabase
      .from('ai_interview_analyses')
      .insert({
        student_id: studentId,
        video_duration_seconds: Math.round(videoFrames.length * 2), // Approximate
        ...analysis,
        leadership_indicators: analysis.leadership_indicators || [],
        problem_solving_indicators: analysis.problem_solving_indicators || [],
        teamwork_indicators: analysis.teamwork_indicators || [],
        recommended_company_types: analysis.recommended_company_types || []
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save analysis');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      analysis: analysisRecord 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-interview-video:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Interview analysis failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
